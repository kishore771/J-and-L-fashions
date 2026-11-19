
from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'product_id',
        'variant_id',
        'product_name',
        'colour',
        'size',
        'quantity',
        'unit_price',
        'total_price',
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'full_name',
        'email',
        'phone',
        'total_amount',
        'status',
        'payment_status',
        'created_at',
    )

    list_filter = (
        'status',
        'payment_status',
        'created_at',
    )

    search_fields = (
        'full_name',
        'email',
        'phone',
        'razorpay_order_id',
    )

    readonly_fields = (
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
        'payment_status',
        'razorpay_order_id',
        'razorpay_payment_id',
        'created_at',
        'updated_at',
    )

    inlines = [OrderItemInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
