
from decimal import Decimal

from rest_framework import serializers

from products.models import Product
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(
        source='product.id',
        read_only=True,
    )

    name = serializers.CharField(
        source='product.name',
        read_only=True,
    )

    image = serializers.SerializerMethodField()

    starting_price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem

        fields = [
            'id',
            'product_id',
            'name',
            'image',
            'starting_price',
            'original_price',
            'discount_percentage',
            'created_at',
        ]

    def get_image(self, obj):
        images = obj.product.images.all()

        primary_image = next(
            (
                image
                for image in images
                if image.is_primary
            ),
            None,
        )

        selected_image = (
            primary_image or images.first()
        )

        if not selected_image:
            return ''

        image_url = selected_image.image.url

        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(
                image_url
            )

        return image_url

    def _get_starting_variant(self, obj):
        """
        Return the lowest-priced active,
        in-stock variant.

        Sale prices are used when available.
        """

        variants = [
            variant
            for variant in obj.product.variants.all()
            if variant.is_active and variant.stock > 0
        ]

        if not variants:
            return None

        return min(
            variants,
            key=lambda variant: (
                variant.sale_price
                if variant.sale_price is not None
                else variant.price
            ),
        )

    def get_starting_price(self, obj):
        variant = self._get_starting_variant(obj)

        if not variant:
            return None

        price = (
            variant.sale_price
            if variant.sale_price is not None
            else variant.price
        )

        return str(price)

    def get_original_price(self, obj):
        variant = self._get_starting_variant(obj)

        if not variant:
            return None

        if variant.sale_price is None:
            return None

        return str(variant.price)

    def get_discount_percentage(self, obj):
        variant = self._get_starting_variant(obj)

        if not variant:
            return 0

        if variant.sale_price is None:
            return 0

        original = variant.price
        sale = variant.sale_price

        if original <= Decimal('0'):
            return 0

        discount = (
            (original - sale) / original
        ) * Decimal('100')

        return round(discount)


class WishlistAddSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(
            is_active=True
        ),
        source='product',
    )
