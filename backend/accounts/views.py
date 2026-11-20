from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework.authtoken.models import Token
from rest_framework.authentication import SessionAuthentication
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

from .serializers import CustomerRegistrationSerializer
from orders.models import Order
from orders.serializers import OrderManagementSerializer
from django.contrib.auth import authenticate, login, logout

from django.views.decorators.csrf import ensure_csrf_cookie


@api_view(['POST'])
@permission_classes([AllowAny])
def register_customer(request):
    serializer = CustomerRegistrationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    customer = serializer.save()

    return Response(
        {
            'message': 'Customer account created successfully.',
            'user': {
                'id': customer.id,
                'username': customer.username,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'email': customer.email,
            }
        },
        status=status.HTTP_201_CREATED
    )


@require_POST
@csrf_protect
def login_customer(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {'error': 'Invalid JSON data.'},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {'error': 'Invalid request data.'},
            status=400
        )

    email = data.get('email')
    password = data.get('password')

    if (
        not isinstance(email, str)
        or not email.strip()
        or not isinstance(password, str)
        or not password
    ):
        return JsonResponse(
            {'error': 'Email and password are required.'},
            status=400
        )

    email = email.strip().lower()

    customer = (
        User.objects
        .filter(email__iexact=email)
        .order_by('id')
        .first()
    )

    user = None

    if customer is not None:
        user = authenticate(
            request,
            username=customer.get_username(),
            password=password
        )

    if (
        user is None
        or not user.is_active
        or user.is_staff
        or user.is_superuser
    ):
        return JsonResponse(
            {
                'error': (
                    "We couldn't sign you in. "
                    "Please check your email and password "
                    "or create an account."
                )
            },
            status=401
        )

    login(request, user)

    return JsonResponse({
        'message': 'Login successful.',
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    })
    email = request.data.get('email')
    password = request.data.get('password')

    if (
        not isinstance(email, str)
        or not email.strip()
        or not isinstance(password, str)
        or not password
    ):
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = email.strip().lower()

    # Look up the account using its registered email.
    customer = (
        User.objects
        .filter(email__iexact=email)
        .order_by('id')
        .first()
    )

    # Keep the error generic to avoid revealing registered emails.
    user = None

    if customer is not None:
        user = authenticate(
            request,
            username=customer.get_username(),
            password=password
        )

    if (
        user is None
        or not user.is_active
        or user.is_staff
        or user.is_superuser
    ):
        return Response(
            {
                'error': (
                    "We couldn't sign you in. "
                    "Please check your email and password "
                    "or create an account."
                )
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Create a Django session for the customer.
    login(request._request, user)

    return Response({
        'message': 'Login successful.',
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    })


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def customer_profile(request):
    user = request.user

    if user.is_staff or user.is_superuser:
        return Response(
            {'error': 'Customer access only.'},
            status=status.HTTP_403_FORBIDDEN
        )

    return Response({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
    })

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def customer_order_history(request):

    # Prevent admin accounts from accessing customer endpoints
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {'error': 'Customer access only.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Retrieve only the logged-in customer's orders
    orders = (
        Order.objects
        .filter(customer=request.user)
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

@ensure_csrf_cookie
def customer_csrf(request):
    if request.method != 'GET':
        return JsonResponse(
            {'error': 'Method not allowed.'},
            status=405
        )

    return JsonResponse({
        'message': 'CSRF cookie initialized.'
    })

@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def logout_customer(request):
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {'error': 'Customer access only.'},
            status=status.HTTP_403_FORBIDDEN
        )

    logout(request._request)

    return Response(
        {'message': 'Logged out successfully.'},
        status=status.HTTP_200_OK
    )