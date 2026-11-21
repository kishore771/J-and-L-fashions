import hashlib
import json
import logging
from decimal import Decimal

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import PermissionDenied

from rest_framework.permissions import IsAdminUser
from .serializers import OrderManagementSerializer
from .serializers import CustomerOrderSerializer

from products.models import ProductVariant
from .models import Order, OrderItem
from .serializers import CheckoutSerializer
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import authentication_classes
from django.views.decorators.csrf import csrf_protect
from rest_framework.authentication import CSRFCheck
from django.utils.crypto import get_random_string


logger = logging.getLogger(__name__)

class CheckoutError(Exception):
    pass


def restore_cancelled_order_stock(order):
    """
    Restore inventory for a cancelled order.

    Must be called inside transaction.atomic()
    after locking the order with select_for_update().
    """

    # Retrieve all purchased items.
    items = list(order.items.all())

    # Collect variant IDs in a consistent order.
    variant_ids = sorted({
        item.variant_id for item in items
    })

    # Lock product variants to protect inventory updates.
    variants = {
        variant.id: variant
        for variant in (
            ProductVariant.objects
            .select_for_update()
            .filter(id__in=variant_ids)
            .order_by('id')
        )
    }

    # Restore purchased quantities.
    for item in items:
        variant = variants.get(item.variant_id)

        if variant is None:
            raise CheckoutError(
                f'Cannot restore stock: '
                f'variant {item.variant_id} is missing.'
            )

        variant.stock += item.quantity
        variant.save(update_fields=['stock'])


def enforce_checkout_csrf(request):
    """Require a valid CSRF token for every checkout request."""
    check = CSRFCheck(lambda request: None)

    check.process_request(request)

    reason = check.process_view(
        request,
        lambda request: None,
        (),
        {}
    )

    if reason:
        raise PermissionDenied(
            'CSRF verification failed.'
        )


def get_request_hash(data):
    """Create a consistent fingerprint of checkout details."""

    payload = {
        'full_name': data['full_name'],
        'email': data['email'],
        'phone': data['phone'],
        'address': data['address'],
        'apartment': data.get('apartment', ''),
        'city': data['city'],
        'state': data['state'],
        'pincode': data['pincode'],
        'items': sorted(
            [
                {
                    'variant_id': item['variant_id'],
                    'quantity': item['quantity'],
                }
                for item in data['items']
            ],
            key=lambda item: item['variant_id']
        ),
    }

    encoded = json.dumps(
        payload,
        sort_keys=True,
        separators=(',', ':')
    ).encode('utf-8')

    return hashlib.sha256(encoded).hexdigest()

def get_guest_session_hash(request):
    """
    Return a stable, hashed identifier for the guest checkout session.
    """

    session = request.session

    # Create a random identifier for guest checkout.
    # This remains stable across requests in the same session.
    guest_id = session.get('guest_checkout_id')

    if not guest_id:
        guest_id = get_random_string(64)
        session['guest_checkout_id'] = guest_id

    return hashlib.sha256(
        guest_id.encode('utf-8')
    ).hexdigest()

def order_response(order, already_exists=False):
    return Response(
        {
            'message': (
                'Existing COD order retrieved successfully.'
                if already_exists
                else 'COD order confirmed successfully.'
            ),
            'order_id': order.id,
            'subtotal': str(order.subtotal),
            'shipping_charge': str(order.shipping_charge),
            'total_amount': str(order.total_amount),
            'status': order.status,
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'already_exists': already_exists,
        },
        status=(
            status.HTTP_200_OK
            if already_exists
            else status.HTTP_201_CREATED
        )
    )

def existing_order_response(order, request_hash, customer, guest_session_hash=None):

    # Reject requests with different checkout details.
    if order.checkout_request_hash != request_hash:
        return Response(
            {'error': 'This checkout key was already used.'},
            status=409
        )

    # Registered customer orders
    if order.customer_id is not None:
        if customer is None or order.customer_id != customer.id:
            return Response(
                {'error': 'This checkout key was already used.'},
                status=409
            )

    # Guest orders
    else:
        if customer is not None:
            return Response(
                {'error': 'This checkout key was already used.'},
                status=409
            )

        # Reject older guest orders without session ownership data.
        if not order.guest_session_hash:
            return Response(
                {'error': 'This checkout key was already used.'},
                status=409
            )

        # Only the original guest session may retry.
        if (
            not guest_session_hash
            or order.guest_session_hash != guest_session_hash
        ):
            return Response(
                {'error': 'This checkout key was already used.'},
                status=409
            )

    return order_response(order, already_exists=True)

@csrf_protect
@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def create_checkout(request):
    enforce_checkout_csrf(request._request)

    serializer = CheckoutSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data
    # Link orders to registered customers only
    customer = (
        request.user
        if request.user.is_authenticated
        and not request.user.is_staff
        and not request.user.is_superuser
        else None
    )
    idempotency_key = data['idempotency_key']
    request_hash = get_request_hash(data)

    guest_session_hash = (
        get_guest_session_hash(request)
        if customer is None
        else None
    )

    # Fast path for requests that have already succeeded.
    existing_order = Order.objects.filter(
        idempotency_key=idempotency_key
    ).first()

    if existing_order:
        return existing_order_response(
            existing_order,
            request_hash,
            customer,
            guest_session_hash
        )

    try:
        with transaction.atomic():
            subtotal = Decimal('0.00')
            order_items = []

            items = sorted(
                data['items'],
                key=lambda item: item['variant_id']
            )

            for item in items:
                variant_id = item['variant_id']
                quantity = item['quantity']

                try:
                    variant = (
                        ProductVariant.objects
                        .select_related('product', 'colour')
                        .select_for_update()
                        .get(id=variant_id)
                    )
                except ProductVariant.DoesNotExist:
                    raise CheckoutError(
                        f'Product variant {variant_id} does not exist.'
                    )

                if (
                    not variant.is_active
                    or not variant.product.is_active
                ):
                    raise CheckoutError(
                        f'{variant.product.name} is currently unavailable.'
                    )

                if variant.stock < quantity:
                    raise CheckoutError(
                        f'Insufficient stock for '
                        f'{variant.product.name} '
                        f'({variant.colour.name}, {variant.size}).'
                    )

                unit_price = (
                    variant.sale_price
                    if variant.sale_price is not None
                    else variant.price
                )

                total_price = unit_price * quantity
                subtotal += total_price

                order_items.append({
                    'product_id': variant.product.id,
                    'variant_id': variant.id,
                    'product_name': variant.product.name,
                    'colour': variant.colour.name,
                    'size': variant.size,
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'total_price': total_price,
                })

                variant.stock -= quantity
                variant.save(update_fields=['stock'])

            shipping_charge = Decimal('0.00')
            total_amount = subtotal + shipping_charge

            # The unique database constraint ensures that
            # concurrent requests cannot create duplicate orders.
            order = Order.objects.create(
                customer=customer,
                guest_session_hash=guest_session_hash,
                idempotency_key=idempotency_key,
                checkout_request_hash=request_hash,
                full_name=data['full_name'],
                email=data['email'],
                phone=data['phone'],
                address=data['address'],
                apartment=data.get('apartment', ''),
                city=data['city'],
                state=data['state'],
                pincode=data['pincode'],
                subtotal=subtotal,
                shipping_charge=shipping_charge,
                total_amount=total_amount,
                status='confirmed',
                payment_method='cod',
                payment_status='pending',
            )

            OrderItem.objects.bulk_create([
                OrderItem(order=order, **item)
                for item in order_items
            ])

        return order_response(order)

    except IntegrityError:
        # A simultaneous request may have created this order.
        # The failed transaction has rolled back stock changes.
        existing_order = Order.objects.filter(
            idempotency_key=idempotency_key
        ).first()

        if existing_order:
            return existing_order_response(
                existing_order,
                request_hash,
                customer,
                guest_session_hash
            )

        logger.exception('Checkout database integrity error')

        return Response(
            {'error': 'Unable to complete checkout. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    except CheckoutError as error:
        return Response(
            {'error': str(error)},
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception:
        logger.exception('Unexpected checkout error')

        return Response(
            {
                'error': (
                    'Unable to place your order. '
                    'Please try again.'
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def cancel_order(request, order_id):
    """
    Cancel a COD order and restore inventory exactly once.
    Only authenticated staff can perform this action.
    """

    try:
        with transaction.atomic():

            # Lock the order to prevent simultaneous cancellation.
            try:
                order = (
                    Order.objects
                    .select_for_update()
                    .get(id=order_id)
                )
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Order not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Prevent stock from being restored twice.
            if order.status == 'cancelled':
                return Response(
                    {
                        'message': 'Order is already cancelled.',
                        'order_id': order.id,
                        'status': order.status,
                        'already_cancelled': True,
                    },
                    status=status.HTTP_200_OK
                )

            # Only confirmed or processing COD orders can be cancelled.
            if (
                order.payment_method != 'cod'
                or order.status not in ['confirmed', 'processing']
            ):
                return Response(
                    {
                        'error': (
                            'Only confirmed or processing '
                            'COD orders can be cancelled.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Restore inventory using the shared helper.
            restore_cancelled_order_stock(order)

            # Update order status in the same transaction.
            order.status = 'cancelled'
            order.save(
                update_fields=['status', 'updated_at']
            )

        return Response(
            {
                'message': 'Order cancelled successfully.',
                'order_id': order.id,
                'status': order.status,
                'stock_restored': True,
                'already_cancelled': False,
            },
            status=status.HTTP_200_OK
        )

    except CheckoutError as error:
        return Response(
            {'error': str(error)},
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception:
        logger.exception(
            'Unexpected cancellation error for order %s',
            order_id
        )

        return Response(
            {'error': 'Unable to cancel order.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def customer_cancel_order(request, order_id):
    """
    Allow a registered customer or guest to cancel
    their own unpaid COD order before processing.
    """
    # Enforce CSRF for guests as well as logged-in customers.
    enforce_checkout_csrf(request)

    # Staff must use the administrator cancellation endpoint.
    if request.user.is_authenticated and (
        request.user.is_staff or request.user.is_superuser
    ):
        return Response(
            {'detail': 'Not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Determine which orders belong to this customer/session.
    if request.user.is_authenticated:
        owned_orders = Order.objects.filter(
            customer=request.user
        )
    else:
        guest_id = request.session.get('guest_checkout_id')

        if not guest_id:
            return Response(
                {'detail': 'Not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        guest_hash = hashlib.sha256(
            guest_id.encode('utf-8')
        ).hexdigest()

        owned_orders = Order.objects.filter(
            customer__isnull=True,
            guest_session_hash=guest_hash
        )

    try:
        with transaction.atomic():
            # Lock the order to prevent duplicate stock restoration.
            order = (
                owned_orders
                .select_for_update()
                .filter(id=order_id)
                .first()
            )

            if order is None:
                return Response(
                    {'detail': 'Not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if order.status == 'cancelled':
                return Response(
                    {
                        'message': 'Order is already cancelled.',
                        'order_id': order.id,
                        'status': order.status,
                        'already_cancelled': True,
                    },
                    status=status.HTTP_200_OK
                )

            # Customers may cancel only unpaid COD orders
            # that have not entered processing.
            if (
                order.payment_method != 'cod'
                or order.payment_status != 'pending'
                or order.status not in ['pending', 'confirmed']
            ):
                return Response(
                    {
                        'error': (
                            'This order can no longer be cancelled '
                            'from the storefront.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Restore inventory and update status atomically.
            restore_cancelled_order_stock(order)

            order.status = 'cancelled'
            order.save(
                update_fields=['status', 'updated_at']
            )

        return Response(
            {
                'message': 'Order cancelled successfully.',
                'order_id': order.id,
                'status': order.status,
                'stock_restored': True,
                'already_cancelled': False,
            },
            status=status.HTTP_200_OK
        )

    except CheckoutError as error:
        return Response(
            {'error': str(error)},
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception:
        logger.exception(
            'Customer cancellation failed for order %s',
            order_id
        )
        return Response(
            {'error': 'Unable to cancel order.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_orders(request):
    """
    Retrieve customer orders for authenticated staff.
    Newest orders appear first.
    """

    orders = (
        Order.objects
        .prefetch_related('items')
        .order_by('-created_at', '-id')
    )

    serializer = OrderManagementSerializer(
        orders,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


def get_allowed_next_statuses(current_status):
    """
    Return the statuses an order can move to.
    Cancellation is handled separately by cancel_order.
    """

    transitions = {
        'pending': ['confirmed'],
        'confirmed': ['processing'],
        'processing': ['shipped'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': [],
    }

    return transitions.get(current_status, [])



@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_status(request, order_id):
    """
    Allow staff to update an order's delivery status.
    Only permitted status transitions are accepted.
    """

    new_status = request.data.get('status')

    if not isinstance(new_status, str):
        return Response(
            {'error': 'A valid status is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            try:
                order = (
                    Order.objects
                    .select_for_update()
                    .get(id=order_id)
                )
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Order not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            allowed_statuses = get_allowed_next_statuses(
                order.status
            )

            if new_status not in allowed_statuses:
                return Response(
                    {
                        'error': (
                            f'Cannot change order status from '
                            f'{order.status} to {new_status}.'
                        ),
                        'allowed_statuses': allowed_statuses,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            previous_status = order.status
            order.status = new_status
            order.save(
                update_fields=['status', 'updated_at']
            )

        return Response(
            {
                'message': 'Order status updated successfully.',
                'order_id': order.id,
                'previous_status': previous_status,
                'status': order.status,
            },
            status=status.HTTP_200_OK
        )

    except Exception:
        logger.exception(
            'Unable to update status for order %s',
            order_id
        )

        return Response(
            {'error': 'Unable to update order status.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def order_history(request):
    """
    Return orders belonging to the current customer
    or the original guest checkout session.
    """

    if (
        request.user.is_authenticated
        and not request.user.is_staff
        and not request.user.is_superuser
    ):
        orders = Order.objects.filter(
            customer=request.user
        )

    else:
        guest_id = request.session.get(
            'guest_checkout_id'
        )

        if not guest_id:
            return Response(
                {'orders': []},
                status=status.HTTP_200_OK
            )

        guest_hash = hashlib.sha256(
            guest_id.encode('utf-8')
        ).hexdigest()

        orders = Order.objects.filter(
            customer__isnull=True,
            guest_session_hash=guest_hash
        )

    orders = orders.prefetch_related(
        'items'
    ).order_by('-created_at')

    serializer = OrderManagementSerializer(
        orders,
        many=True
    )

    return Response(
        {'orders': serializer.data},
        status=status.HTTP_200_OK
    )

from django.shortcuts import get_object_or_404


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def customer_order_detail(request, order_id):
    """
    Retrieve an order only if it belongs to the
    authenticated customer or current guest session.
    """

    if (
        request.user.is_authenticated
        and not request.user.is_staff
        and not request.user.is_superuser
    ):
        orders = Order.objects.filter(
            customer=request.user
        )

    else:
        guest_id = request.session.get(
            'guest_checkout_id'
        )

        if not guest_id:
            return Response(
                {'detail': 'Not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        guest_hash = hashlib.sha256(
            guest_id.encode('utf-8')
        ).hexdigest()

        orders = Order.objects.filter(
            customer__isnull=True,
            guest_session_hash=guest_hash
        )

    order = get_object_or_404(
        orders.prefetch_related('items'),
        id=order_id
    )

    serializer = CustomerOrderSerializer(order)

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )