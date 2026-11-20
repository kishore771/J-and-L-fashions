
from django.test import SimpleTestCase
from .views import get_allowed_next_statuses
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import Order
import uuid

from products.models import (
    Department,
    Category,
    Subcategory,
    Product,
    ProductVariant,
    Colour,
)

from .models import OrderItem


class OrderStatusTests(SimpleTestCase):

    def test_allowed_status_transitions(self):
        self.assertEqual(
            get_allowed_next_statuses('confirmed'),
            ['processing']
        )

        self.assertEqual(
            get_allowed_next_statuses('processing'),
            ['shipped']
        )

        self.assertEqual(
            get_allowed_next_statuses('shipped'),
            ['delivered']
        )

        self.assertEqual(
            get_allowed_next_statuses('delivered'),
            []
        )

        self.assertEqual(
            get_allowed_next_statuses('cancelled'),
            []
        )


class OrderAuthenticationTests(SimpleTestCase):

    def test_guest_cannot_update_order_status(self):
        client = APIClient()

        response = client.patch(
            '/api/orders/8/status/',
            {'status': 'processing'},
            format='json'
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )



class OrderStatusAPITests(APITestCase):

    def setUp(self):
        User = get_user_model()

        self.staff_user = User.objects.create_user(
            username='test_staff',
            password='TestPassword123!',
            is_staff=True
        )

        self.client.force_authenticate(
            user=self.staff_user
        )

        self.order = Order.objects.create(
            full_name='Automated Test Customer',
            email='automated@example.com',
            phone='9999999999',
            address='Test Address',
            city='Hyderabad',
            state='Telangana',
            pincode='500001',
            subtotal=Decimal('500.00'),
            shipping_charge=Decimal('0.00'),
            total_amount=Decimal('500.00'),
            status='confirmed',
            payment_method='cod',
            payment_status='pending'
        )

    def test_staff_can_update_order_status(self):
        response = self.client.patch(
            f'/api/orders/{self.order.id}/status/',
            {'status': 'processing'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'processing'
        )


    def test_staff_cannot_skip_order_status(self):
        response = self.client.patch(
            f'/api/orders/{self.order.id}/status/',
            {'status': 'delivered'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data['allowed_statuses'],
            ['processing']
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'confirmed'
        )


    def test_cancelled_order_cannot_be_reactivated(self):
        self.order.status = 'cancelled'
        self.order.save(update_fields=['status'])

        response = self.client.patch(
            f'/api/orders/{self.order.id}/status/',
            {'status': 'confirmed'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data['allowed_statuses'],
            []
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'cancelled'
        )

    def test_delivered_order_cannot_move_backward(self):
        self.order.status = 'delivered'
        self.order.save(update_fields=['status'])

        response = self.client.patch(
            f'/api/orders/{self.order.id}/status/',
            {'status': 'processing'},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data['allowed_statuses'],
            []
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'delivered'
        )


    def test_shipped_order_cannot_be_cancelled(self):
        self.order.status = 'shipped'
        self.order.save(update_fields=['status'])

        response = self.client.post(
            f'/api/orders/{self.order.id}/cancel/',
            format='json'
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data['error'],
            'Only confirmed or processing COD orders can be cancelled.'
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'shipped'
        )
    def test_staff_can_cancel_confirmed_cod_order(self):
        response = self.client.post(
            f'/api/orders/{self.order.id}/cancel/',
            format='json'
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data['status'],
            'cancelled'
        )

        self.assertTrue(
            response.data['stock_restored']
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            'cancelled'
        )

    def test_cancellation_restores_inventory(self):
        department = Department.objects.create(
            name='Men',
            slug='men-test'
        )

        category = Category.objects.create(
            name='Clothing',
            slug='clothing-test',
            department=department
        )

        subcategory = Subcategory.objects.create(
            name='T-Shirts',
            slug='tshirts-test',
            category=category
        )

        product = Product.objects.create(
            name='Test Cotton T-Shirt',
            short_description='Test product',
            description='Product for inventory testing',
            subcategory=subcategory
        )

        colour = Colour.objects.create(
            name='Test Blue'
        )

        variant = ProductVariant.objects.create(
            product=product,
            colour=colour,
            size='M',
            price=Decimal('500.00'),
            stock=8
        )

        OrderItem.objects.create(
            order=self.order,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            colour=colour.name,
            size='M',
            quantity=2,
            unit_price=Decimal('500.00'),
            total_price=Decimal('1000.00')
        )

        response = self.client.post(
            f'/api/orders/{self.order.id}/cancel/',
            format='json'
        )

        self.assertEqual(response.status_code, 200)

        variant.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(variant.stock, 10)
        self.assertEqual(self.order.status, 'cancelled')
        self.assertTrue(response.data['stock_restored'])


    def test_duplicate_cancellation_does_not_restore_stock_twice(self):
        first_response = self.client.post(
            f'/api/orders/{self.order.id}/cancel/',
            format='json'
        )

        second_response = self.client.post(
            f'/api/orders/{self.order.id}/cancel/',
            format='json'
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)

        self.assertTrue(
            second_response.data['already_cancelled']
        )

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'cancelled')

class CheckoutCSRFTests(APITestCase):

    def test_guest_checkout_without_csrf_is_rejected(self):
        client = APIClient(enforce_csrf_checks=True)

        response = client.post(
            '/api/orders/checkout/',
            {},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_guest_checkout_with_valid_csrf_reaches_validation(self):
        client = APIClient(enforce_csrf_checks=True)

        csrf_response = client.get('/api/accounts/csrf/')
        self.assertEqual(csrf_response.status_code, 200)

        csrf_token = client.cookies['csrftoken'].value

        response = client.post(
            '/api/orders/checkout/',
            {},
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('items', response.data)

        self.assertEqual(Order.objects.count(), 0)

    def test_valid_guest_checkout_retry_does_not_reduce_stock_twice(self):
        department = Department.objects.create(
            name='Test Department',
            slug='checkout-test-department'
        )

        category = Category.objects.create(
            name='Test Category',
            slug='checkout-test-category',
            department=department
        )

        subcategory = Subcategory.objects.create(
            name='Test Subcategory',
            slug='checkout-test-subcategory',
            category=category
        )

        product = Product.objects.create(
            name='Checkout Test Product',
            short_description='Test product',
            description='Product for checkout testing',
            subcategory=subcategory
        )

        colour = Colour.objects.create(
            name='Checkout Test Blue'
        )

        variant = ProductVariant.objects.create(
            product=product,
            colour=colour,
            size='M',
            price=Decimal('500.00'),
            stock=10
        )

        client = APIClient(enforce_csrf_checks=True)

        csrf_response = client.get('/api/accounts/csrf/')
        self.assertEqual(csrf_response.status_code, 200)

        csrf_token = client.cookies['csrftoken'].value

        payload = {
            'full_name': 'Test Customer',
            'email': 'checkout-test@example.com',
            'phone': '9876543210',
            'address': '123 Test Street',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'pincode': '500001',
            'items': [
                {
                    'variant_id': variant.id,
                    'quantity': 2
                }
            ],
            'idempotency_key': str(uuid.uuid4())
        }

        first_response = client.post(
            '/api/orders/checkout/',
            payload,
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
            first_response.data
        )

        variant.refresh_from_db()

        self.assertEqual(variant.stock, 8)
        self.assertEqual(Order.objects.count(), 1)

        second_response = client.post(
            '/api/orders/checkout/',
            payload,
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
            second_response.data
        )

        self.assertEqual(
            first_response.data['order_id'],
            second_response.data['order_id']
        )

        self.assertTrue(
            second_response.data['already_exists']
        )

        variant.refresh_from_db()

        self.assertEqual(variant.stock, 8)
        self.assertEqual(Order.objects.count(), 1)