from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

class CustomerAuthenticationTests(TestCase):

    def setUp(self):
        self.password = "SecureTestPassword123!"

        self.customer = User.objects.create_user(
            username="testcustomer",
            email="customer@example.com",
            password=self.password,
        )

        self.client = Client(enforce_csrf_checks=True)

    def test_login_requires_csrf_token(self):
        response = self.client.post(
            reverse("customer-login"),
            data={
                "email": "customer@example.com",
                "password": self.password,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_customer_profile_requires_login(self):
        response = self.client.get(
            reverse("customer-profile")
        )

        self.assertIn(response.status_code, [401, 403])

    def test_customer_cannot_access_order_history_without_login(self):
        response = self.client.get(
            reverse("customer-order-history")
        )

        self.assertIn(response.status_code, [401, 403])

    def test_customer_login_and_logout(self):
        # Step 1: Initialize CSRF cookie
        response = self.client.get(
            reverse("customer-csrf")
        )
        self.assertEqual(response.status_code, 200)

        csrf_token = self.client.cookies["csrftoken"].value

        # Step 2: Log in
        response = self.client.post(
            reverse("customer-login"),
            data={
                "email": "customer@example.com",
                "password": self.password,
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)

        # Step 3: Verify customer profile
        response = self.client.get(
            reverse("customer-profile")
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["email"],
            "customer@example.com",
        )

        # Step 4: Get the updated CSRF token after login
        csrf_token = self.client.cookies["csrftoken"].value

        # Step 5: Log out
        response = self.client.post(
            reverse("customer-logout"),
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)

        # Step 6: Verify customer cannot access profile
        response = self.client.get(
            reverse("customer-profile")
        )
        self.assertIn(response.status_code, [401, 403])

    def test_customer_registration(self):
        response = self.client.post(
            reverse("customer-register"),
            data={
                "username": "newcustomer",
                "first_name": "New",
                "last_name": "Customer",
                "email": "newcustomer@example.com",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        user = User.objects.get(username="newcustomer")

        self.assertTrue(user.check_password("StrongPassword123!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.email, "newcustomer@example.com")

    def test_duplicate_email_registration_rejected(self):
        response = self.client.post(
            reverse("customer-register"),
            data={
                "username": "anothercustomer",
                "first_name": "Another",
                "last_name": "Customer",
                "email": "CUSTOMER@example.com",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            User.objects.filter(
                email__iexact="customer@example.com"
            ).count(),
            1
        )