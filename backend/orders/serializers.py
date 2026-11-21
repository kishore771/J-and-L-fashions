
from rest_framework import serializers
from .models import Order, OrderItem
import uuid

class CheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(
        min_value=1,
        max_value=100
    )


class CheckoutSerializer(serializers.Serializer):
    # Customer information
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.RegexField(
        regex=r'^[6-9]\d{9}$',
        error_messages={
            'invalid': 'Enter a valid 10-digit Indian mobile number.'
        }
    )

    # Delivery address
    address = serializers.CharField()
    apartment = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True
    )
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.RegexField(
        regex=r'^\d{6}$',
        error_messages={
            'invalid': 'Enter a valid 6-digit PIN code.'
        }
    )

    # Shopping cart
    items = CheckoutItemSerializer(many=True)
    idempotency_key = serializers.UUIDField(required=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError(
                'Your shopping cart cannot be empty.'
            )

        variant_ids = [
            item['variant_id']
            for item in items
        ]

        if len(variant_ids) != len(set(variant_ids)):
            raise serializers.ValidationError(
                'Duplicate product variants are not allowed.'
            )

        return items
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_id',
            'variant_id',
            'product_name',
            'colour',
            'size',
            'quantity',
            'unit_price',
            'total_price',
        ]


class OrderManagementSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'address',
            'apartment',
            'city',
            'state',
            'pincode',
            'subtotal',
            'shipping_charge',
            'total_amount',
            'status',
            'payment_method',
            'payment_status',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = fields

class CustomerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'full_name',
            'subtotal',
            'shipping_charge',
            'total_amount',
            'status',
            'payment_method',
            'payment_status',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = fields