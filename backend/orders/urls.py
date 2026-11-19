
from django.urls import path

from .views import (
    create_checkout,
    cancel_order,
    list_orders,
    update_order_status,
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
]
