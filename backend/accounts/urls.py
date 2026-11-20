from django.urls import path



from .views import (
    register_customer,
    login_customer,
    logout_customer,
    customer_profile,
    customer_order_history,
    customer_csrf,
)

urlpatterns = [
    path('register/', register_customer, name='customer-register'),
    path('login/', login_customer, name='customer-login'),
    path('profile/', customer_profile, name='customer-profile'),
    path('orders/', customer_order_history, name='customer-order-history'),
    path('csrf/', customer_csrf, name='customer-csrf'),
    path('logout/', logout_customer, name='customer-logout'),
]