import hashlib

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Order
from django.test import override_settings
from django.middleware.csrf import _get_new_csrf_string

from products.models import (
    Department,
    Category,
    Subcategory,
    Product,
    ProductVariant,
    Colour,
)

from .models import OrderItem

User = get_user_model()


class CustomerCancellationTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            username='cancel_customer',
            password='TestPassword123!'
        )

        self.other_customer = User.objects.create_user(
            username='other_cancel_customer',
            password='TestPassword123!'
        )

        self.client = APIClient()
        self.client.force_login(self.customer)

        self.order = Order.objects.create(
            customer=self.customer,
            full_name='Test Customer',
            email='customer@example.com',
            phone='9876543210',
            address='Test Address',
            city='Hyderabad',
            state='Telangana',
            pincode='500001',
            payment_method='cod',
            payment_status='pending',
            status='confirmed'
        )

    def cancel_url(self, order):
        return f'/api/orders/{order.id}/customer-cancel/'

    def test_customer_can_cancel_own_order(self):
        response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 200)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'cancelled')

    def test_customer_cannot_cancel_another_customers_order(self):
        self.client.force_login(self.other_customer)

        response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 404)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')

    def test_processing_order_cannot_be_cancelled(self):
        self.order.status = 'processing'
        self.order.save(update_fields=['status'])

        response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 400)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'processing')

    def test_paid_order_cannot_be_cancelled(self):
        self.order.payment_status = 'paid'
        self.order.save(update_fields=['payment_status'])

        response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 400)

    def test_duplicate_cancellation_is_safe(self):
        first = self.client.post(
            self.cancel_url(self.order)
        )

        second = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.data['already_cancelled'])

    def test_guest_cannot_cancel_customer_order(self):
        self.client.logout()

        response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 404)

    def test_guest_can_cancel_own_order(self):
        self.client.logout()

        guest_id = 'guest-cancellation-session'
        guest_hash = hashlib.sha256(
            guest_id.encode('utf-8')
        ).hexdigest()

        guest_order = Order.objects.create(
            customer=None,
            guest_session_hash=guest_hash,
            full_name='Guest Customer',
            email='guest@example.com',
            phone='9876543210',
            address='Guest Address',
            city='Hyderabad',
            state='Telangana',
            pincode='500001',
            payment_method='cod',
            payment_status='pending',
            status='confirmed'
        )

        session = self.client.session
        session['guest_checkout_id'] = guest_id
        session.save()

        response = self.client.post(
            self.cancel_url(guest_order)
        )

        self.assertEqual(response.status_code, 200)

        guest_order.refresh_from_db()
        self.assertEqual(guest_order.status, 'cancelled')

    def test_guest_cannot_cancel_another_guest_order(self):
        self.client.logout()

        guest_hash = hashlib.sha256(
            b'original-guest-session'
        ).hexdigest()

        guest_order = Order.objects.create(
            customer=None,
            guest_session_hash=guest_hash,
            full_name='Guest Customer',
            email='guest@example.com',
            phone='9876543210',
            address='Guest Address',
            city='Hyderabad',
            state='Telangana',
            pincode='500001',
            payment_method='cod',
            payment_status='pending',
            status='confirmed'
        )

        session = self.client.session
        session['guest_checkout_id'] = 'different-guest-session'
        session.save()

        response = self.client.post(
            self.cancel_url(guest_order)
        )

        self.assertEqual(response.status_code, 404)

        guest_order.refresh_from_db()
        self.assertEqual(guest_order.status, 'confirmed')

    def test_cancellation_without_csrf_is_rejected(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.force_login(self.customer)

        response = csrf_client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(response.status_code, 403)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')

    def test_customer_cancellation_restores_stock_exactly_once(self):
        # Create a test product hierarchy.
        department = Department.objects.create(
            name='Men',
            slug='men-cancellation-test'
        )

        category = Category.objects.create(
            name='Clothing',
            slug='clothing-cancellation-test',
            department=department
        )

        subcategory = Subcategory.objects.create(
            name='T-Shirts',
            slug='tshirts-cancellation-test',
            category=category
        )

        product = Product.objects.create(
            name='Cancellation Test T-Shirt',
            sku='JLF-CANCEL-001',
            short_description='Test product',
            description='Product used for cancellation testing.',
            subcategory=subcategory,
            slug='cancellation-test-tshirt'
        )

        colour = Colour.objects.create(
            name='Cancellation Test Black'
        )

        # Simulate stock remaining after checkout.
        variant = ProductVariant.objects.create(
            product=product,
            colour=colour,
            size='M',
            sku='JLF-CANCEL-001-BLK-M',
            price='999.00',
            stock=7
        )

        # The customer previously purchased 3 units.
        OrderItem.objects.create(
            order=self.order,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            colour=colour.name,
            size='M',
            quantity=3,
            unit_price='999.00',
            total_price='2997.00'
        )

        # First cancellation.
        first_response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(first_response.status_code, 200)

        variant.refresh_from_db()
        self.order.refresh_from_db()

        self.assertEqual(variant.stock, 10)
        self.assertEqual(self.order.status, 'cancelled')

        # Repeating cancellation must not restore stock again.
        second_response = self.client.post(
            self.cancel_url(self.order)
        )

        self.assertEqual(second_response.status_code, 200)
        self.assertTrue(
            second_response.data['already_cancelled']
        )

        variant.refresh_from_db()

        # Stock must still be 10, not 13.
        self.assertEqual(variant.stock, 10)