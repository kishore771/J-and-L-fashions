
from django.urls import path

from .views import (
    create_checkout,
    cancel_order,
    list_orders,
    update_order_status,
    order_history,
    customer_order_detail,
    customer_cancel_order,
)

urlpatterns = [
    path(
        'checkout/',
        create_checkout,
        name='create-checkout'
    ),

    path(
        'manage/',
        list_orders,
        name='list-orders'
    ),

    path(
        '<int:order_id>/cancel/',
        cancel_order,
        name='cancel-order'
    ),

    path(
        '<int:order_id>/status/',
        update_order_status,
        name='update-order-status'
    ),
    path(
        'history/',
        order_history,
        name='order-history'
    ),
    path(
        '<int:order_id>/',
        customer_order_detail,
        name='customer-order-detail'
    ),
    path(
        '<int:order_id>/customer-cancel/',
        customer_cancel_order,
        name='customer-cancel-order'
    ),
]
