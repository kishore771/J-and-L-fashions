import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):

    department = django_filters.CharFilter(
        field_name='subcategory__category__department__slug',
        lookup_expr='iexact'
    )

    min_price = django_filters.NumberFilter(
        field_name='variants__price',
        lookup_expr='gte',
        distinct=True
    )

    max_price = django_filters.NumberFilter(
        field_name='variants__price',
        lookup_expr='lte',
        distinct=True
    )

    class Meta:
        model = Product
        fields = []