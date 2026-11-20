
from django.db import models
from django.conf import settings


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('razorpay', 'Razorpay'),
    ]

    # Identifies the browser session that created a guest order.
    # Stores a hash rather than the raw Django session key.
    guest_session_hash = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        editable=False,
        db_index=True
    )

    # Registered customer (optional for guest checkout)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )

    # Customer information
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=15)

    # Delivery address
    address = models.TextField()
    apartment = models.CharField(
        max_length=255,
        blank=True
    )
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)

    # Order information
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )

    # Payment references
    razorpay_order_id = models.CharField(
        max_length=100,
        blank=True
    )

    razorpay_payment_id = models.CharField(
        max_length=100,
        blank=True
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='cod'
    )

    idempotency_key = models.UUIDField(
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    checkout_request_hash = models.CharField(
        max_length=64,
        blank=True,
        default='',
        editable=False
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )

    # Store purchased product details
    product_id = models.PositiveIntegerField()
    variant_id = models.PositiveIntegerField()

    product_name = models.CharField(max_length=255)
    colour = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)

    quantity = models.PositiveIntegerField()

    # Price at the time of purchase
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
