from rest_framework.generics import ListAPIView, RetrieveAPIView,CreateAPIView, UpdateAPIView, GenericAPIView, DestroyAPIView

from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAdminUser
from django.db import transaction

from .models import (
    Department,
    Category,
    Subcategory,
    Pattern,
    Fit,
    SleeveLength,
    Occasion,
    Colour,
    Fabric,
    Tag,
    Product,
    ProductVariant,
    ProductImage,
)

from .filters import ProductFilter

from rest_framework.filters import SearchFilter, OrderingFilter

from django.db.models import Min, Max, Q

from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .serializers import (
    DepartmentSerializer,
    CategorySerializer,
    SubcategorySerializer,
    PatternSerializer,
    FitSerializer,
    SleeveLengthSerializer,
    OccasionSerializer,
    ColourSerializer,
    FabricSerializer,
    TagSerializer,
    ProductSerializer,
    ProductWriteSerializer,
    ProductVariantWriteSerializer,
    ProductImageWriteSerializer,
)

class DepartmentListView(ListAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer

class CategoryListView(ListAPIView):
    queryset = Category.objects.filter(
        is_active=True,
        department__is_active=True
    ).select_related('department')

    serializer_class = CategorySerializer

class SubcategoryListView(ListAPIView):
    queryset = Subcategory.objects.filter(
        is_active=True,
        category__is_active=True,
        category__department__is_active=True
    ).select_related(
        'category',
        'category__department'
    )

    serializer_class = SubcategorySerializer


class AttributeListView(ListAPIView):
    model = None

    def get_queryset(self):
        return self.model.objects.filter(is_active=True)

class ProductListView(ListAPIView):
    queryset = Product.objects.filter(
        is_active=True,
        subcategory__is_active=True,
        subcategory__category__is_active=True,
        subcategory__category__department__is_active=True
    ).select_related(
        'subcategory',
        'subcategory__category',
        'subcategory__category__department',
        'pattern',
        'fit',
        'sleeve_length',
        'occasion'
    ).prefetch_related(
        'tags',
        'variants__colour',
        'variants__fabric_compositions__fabric',
        'images',
        'videos'
    ).annotate(
        lowest_variant_price=Min(
            'variants__price',
            filter=Q(variants__is_active=True)
        )
    )

    serializer_class = ProductSerializer
    ordering = ['id']
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]

    search_fields = [
        'name',
        'sku',
        'description',
        'short_description',
        'subcategory__name',
        'subcategory__category__name',
    ]
    ordering_fields = [
        'name',
        'created_at',
        'lowest_variant_price',
    ]

    filterset_class = ProductFilter



class AdminProductListView(ListAPIView):
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]


class ProductDetailView(RetrieveAPIView):
    queryset = Product.objects.filter(
        is_active=True,
        subcategory__is_active=True,
        subcategory__category__is_active=True,
        subcategory__category__department__is_active=True
    ).select_related(
        'subcategory',
        'subcategory__category',
        'subcategory__category__department',
        'pattern',
        'fit',
        'sleeve_length',
        'occasion'
    ).prefetch_related(
        'tags',
        'variants__colour',
        'variants__fabric_compositions__fabric',
        'images',
        'videos'
    )

    serializer_class = ProductSerializer

class ProductCreateView(CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductWriteSerializer
    permission_classes = [IsAdminUser]



class ProductUpdateView(UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductWriteSerializer
    permission_classes = [IsAdminUser]

class ProductVariantCreateView(CreateAPIView):
    serializer_class = ProductVariantWriteSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        product = get_object_or_404(
            Product,
            pk=self.kwargs['product_id']
        )

        serializer.save(product=product)

class ProductVariantUpdateView(UpdateAPIView):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantWriteSerializer
    permission_classes = [IsAdminUser]


class ProductVariantDeleteView(DestroyAPIView):
    queryset = ProductVariant.objects.all()
    permission_classes = [IsAdminUser]


class ProductImageCreateView(CreateAPIView):
    serializer_class = ProductImageWriteSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        product = get_object_or_404(
            Product,
            pk=self.kwargs['product_id']
        )

        serializer.save(product=product)

class ProductImageUpdateView(UpdateAPIView):
    queryset = ProductImage.objects.select_related('product')
    serializer_class = ProductImageWriteSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def perform_update(self, serializer):
        image = self.get_object()
        old_image = image.image

        # Only one primary image is allowed per product.
        if serializer.validated_data.get(
            'is_primary',
            image.is_primary
        ):
            ProductImage.objects.filter(
                product=image.product,
                is_primary=True
            ).exclude(
                pk=image.pk
            ).update(is_primary=False)

        updated_image = serializer.save()

        # Remove the old file if a replacement was uploaded.
        if (
            old_image
            and old_image.name != updated_image.image.name
        ):
            old_image.delete(save=False)

class ProductImageDeleteView(DestroyAPIView):
    queryset = ProductImage.objects.all()
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        image_file = instance.image

        instance.delete()

        if image_file:
            image_file.delete(save=False)

class ProductDeactivateView(GenericAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductWriteSerializer
    permission_classes = [IsAdminUser]

    def patch(self, request, *args, **kwargs):
        product = self.get_object()

        product.is_active = False
        product.save(update_fields=['is_active', 'updated_at'])

        return Response(
            {
                'message': 'Product deactivated successfully.'
            },
            status=status.HTTP_200_OK
        )
class AdminTokenObtainView(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        if not user.is_staff:
            return Response(
                {'detail': 'Admin access only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key
        })

class AdminLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()

        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK
        )