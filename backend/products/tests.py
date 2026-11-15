from .models import Product, Department, Category, Subcategory, Pattern, ProductVariant, Colour
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

class ProductListAPITests(APITestCase):

    def test_product_list_returns_200(self):
        response = self.client.get('/api/products/')

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)


    def setUp(self):
        self.department = Department.objects.create(
            name='Men',
            slug='men'
        )

        self.category = Category.objects.create(
            department=self.department,
            name='Clothing',
            slug='clothing'
        )

        self.subcategory = Subcategory.objects.create(
            category=self.category,
            name='T-Shirts',
            slug='t-shirts'
        )

        self.pattern = Pattern.objects.create(
            name='Solid'
        )

        self.product = Product.objects.create(
            name='Test T-Shirt',
            sku='TEST-TSH-001',
            short_description='Test product description',
            description='Test product for API testing',
            subcategory=self.subcategory,
            slug='test-t-shirt',
            pattern=self.pattern
        )

        self.colour = Colour.objects.create(
            name='Black'
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku='TEST-TSH-001-BLK-M',
            size='M',
            colour=self.colour,
            price=599,
            stock=20
        )

        User = get_user_model()

        self.admin_user = User.objects.create_user(
            username='test_admin',
            password='test_password123',
            is_staff=True
        )

    def test_filter_products_by_pattern(self):
        response = self.client.get(
            f'/api/products/?pattern={self.pattern.id}'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_search_products_by_name(self):
        response = self.client.get(
            '/api/products/?search=Test T-Shirt'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['name'],
            'Test T-Shirt'
        )

    def test_product_detail_returns_correct_product(self):
        response = self.client.get(
            f'/api/products/{self.product.id}/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data['id'],
            self.product.id
        )

        self.assertEqual(
            response.data['name'],
            'Test T-Shirt'
        )

    def test_products_are_ordered_by_name(self):
        Product.objects.create(
            name='A Test T-Shirt',
            sku='TEST-TSH-002',
            short_description='Another test product',
            description='Second test product',
            subcategory=self.subcategory,
            slug='a-test-t-shirt',
            pattern=self.pattern
        )

        response = self.client.get(
            '/api/products/?ordering=name'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data['results'][0]['name'],
            'A Test T-Shirt'
        )

    def test_filter_products_by_minimum_price(self):
        response = self.client.get(
            '/api/products/?min_price=500'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_filter_products_by_maximum_price(self):
        response = self.client.get(
            '/api/products/?max_price=700'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_filter_products_by_price_range(self):
        response = self.client.get(
            '/api/products/?min_price=500&max_price=700'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_product_list_pagination(self):
        for number in range(2, 12):
            Product.objects.create(
                name=f'Test Product {number}',
                sku=f'TEST-PROD-{number}',
                short_description='Pagination test',
                description='Product for pagination testing',
                subcategory=self.subcategory,
                slug=f'test-product-{number}',
                pattern=self.pattern
            )

        response = self.client.get('/api/products/')

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 11)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])

    def test_inactive_products_are_excluded(self):
        self.product.is_active = False
        self.product.save()

        response = self.client.get('/api/products/')

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 0)

    def test_filter_products_by_colour(self):
        response = self.client.get(
            f'/api/products/?variants__colour={self.variant.colour.id}'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_filter_products_by_size(self):
        response = self.client.get(
            '/api/products/?variants__size=M'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data['count'], 1)

        self.assertEqual(
            response.data['results'][0]['id'],
            self.product.id
        )

    def test_products_are_ordered_by_lowest_variant_price(self):
        second_product = Product.objects.create(
            name='Second Test T-Shirt',
            sku='TEST-TSH-003',
            short_description='Another test product',
            description='Product for price ordering',
            subcategory=self.subcategory,
            slug='second-test-t-shirt',
            pattern=self.pattern
        )

        ProductVariant.objects.create(
            product=second_product,
            sku='TEST-TSH-003-BLK-M',
            size='M',
            colour=self.colour,
            price=399,
            stock=10
        )

        response = self.client.get(
            '/api/products/?ordering=lowest_variant_price'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data['results'][0]['id'],
            second_product.id
        )

    def test_product_detail_returns_404_for_invalid_id(self):
        response = self.client.get('/api/products/999999/')

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'name': 'Created Test Product',
            'sku': 'TEST-CREATE-001',
            'short_description': 'Product created through API',
            'description': 'Testing product creation endpoint',
            'subcategory': self.subcategory.id,
            'slug': 'created-test-product',
            'pattern': self.pattern.id
        }

        response = self.client.post(
            '/api/admin/products/create/',
            payload,
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            response.data['name'],
            'Created Test Product'
        )

        self.assertTrue(
            Product.objects.filter(
                sku='TEST-CREATE-001'
            ).exists()
        )

    def test_admin_can_update_product(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'name': 'Updated Test T-Shirt'
        }

        response = self.client.patch(
            f'/api/admin/products/{self.product.id}/update/',
            payload,
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data['name'],
            'Updated Test T-Shirt'
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.name,
            'Updated Test T-Shirt'
        )

    def test_admin_can_deactivate_product(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/admin/products/{self.product.id}/deactivate/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.product.refresh_from_db()

        self.assertFalse(self.product.is_active)

        self.assertEqual(
            response.data['message'],
            'Product deactivated successfully.'
        )

    def test_deactivated_product_detail_returns_404(self):
        self.product.is_active = False
        self.product.save()

        response = self.client.get(
            f'/api/products/{self.product.id}/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_unauthenticated_user_cannot_create_product(self):
        payload = {
            'name': 'Unauthorized Product',
            'sku': 'TEST-UNAUTH-001',
            'short_description': 'Unauthorized test',
            'description': 'Testing admin permissions',
            'subcategory': self.subcategory.id,
            'slug': 'unauthorized-product',
            'pattern': self.pattern.id
        }

        response = self.client.post(
            '/api/admin/products/create/',
            payload,
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_unauthenticated_user_cannot_update_product(self):
        payload = {
            'name': 'Unauthorized Update'
        }

        response = self.client.patch(
            f'/api/admin/products/{self.product.id}/update/',
            payload,
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_unauthenticated_user_cannot_deactivate_product(self):
        response = self.client.patch(
            f'/api/admin/products/{self.product.id}/deactivate/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

        self.product.refresh_from_db()

        self.assertTrue(self.product.is_active)

    def test_logged_out_token_cannot_access_admin_api(self):
        token = Token.objects.create(user=self.admin_user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )

        # Log out using the token.
        logout_response = self.client.post('/api/auth/logout/')

        self.assertEqual(logout_response.status_code, 200)

        # Try using the same token again.
        response = self.client.post('/api/admin/products/create/', {})

        self.assertEqual(response.status_code, 401)