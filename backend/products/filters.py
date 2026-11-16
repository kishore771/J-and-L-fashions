
import django_filters

from .models import Product


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class ProductFilter(django_filters.FilterSet):

    department = django_filters.CharFilter(
        field_name='subcategory__category__department__slug',
        lookup_expr='iexact'
    )

    category = django_filters.NumberFilter(
        field_name='subcategory__category__id'
    )

    subcategory = django_filters.NumberFilter(
        field_name='subcategory__id'
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

    tags = CharInFilter(
        field_name='tags__slug',
        lookup_expr='in',
        distinct=True
    )

    colour = django_filters.NumberFilter(
        field_name='variants__colour__id',
        distinct=True
    )

    size = django_filters.CharFilter(
        field_name='variants__size',
        lookup_expr='iexact',
        distinct=True
    )

    class Meta:
        model = Product
        fields = []
