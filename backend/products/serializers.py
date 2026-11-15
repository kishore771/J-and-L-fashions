from rest_framework import serializers

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
    VariantFabric,
    ProductImage,
    ProductVideo,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = Category
        fields = '__all__'

class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Subcategory
        fields = '__all__'


class BaseAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'

class PatternSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Pattern

class FitSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Fit


class SleeveLengthSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = SleeveLength


class OccasionSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Occasion


class ColourSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Colour


class FabricSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Fabric

class TagSerializer(BaseAttributeSerializer):
    class Meta(BaseAttributeSerializer.Meta):
        model = Tag

class VariantFabricSerializer(serializers.ModelSerializer):
    fabric = FabricSerializer(read_only=True)

    class Meta:
        model = VariantFabric
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    colour = ColourSerializer(read_only=True)
    fabric_compositions = VariantFabricSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = ProductVariant
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class ProductVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVideo
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    subcategory = SubcategorySerializer(read_only=True)

    pattern = PatternSerializer(read_only=True)
    fit = FitSerializer(read_only=True)
    sleeve_length = SleeveLengthSerializer(read_only=True)
    occasion = OccasionSerializer(read_only=True)

    tags = TagSerializer(many=True, read_only=True)

    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    videos = ProductVideoSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductWriteSerializer(serializers.ModelSerializer):

    subcategory = serializers.PrimaryKeyRelatedField(
        queryset=Subcategory.objects.filter(is_active=True)
    )

    pattern = serializers.PrimaryKeyRelatedField(
        queryset=Pattern.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    fit = serializers.PrimaryKeyRelatedField(
        queryset=Fit.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    sleeve_length = serializers.PrimaryKeyRelatedField(
        queryset=SleeveLength.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    occasion = serializers.PrimaryKeyRelatedField(
        queryset=Occasion.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.filter(is_active=True),
        many=True,
        required=False
    )

    class Meta:
        model = Product

        fields = [
            'id',
            'name',
            'sku',
            'short_description',
            'description',
            'subcategory',
            'slug',
            'pattern',
            'fit',
            'sleeve_length',
            'occasion',
            'dimensions',
            'tags',
            'meta_title',
            'meta_description',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        subcategory = attrs.get(
            'subcategory',
            getattr(self.instance, 'subcategory', None)
        )

        if subcategory and not subcategory.category.is_active:
            raise serializers.ValidationError({
                'subcategory': 'The selected category is inactive.'
            })

        if subcategory and not subcategory.category.department.is_active:
            raise serializers.ValidationError({
                'subcategory': 'The selected department is inactive.'
            })

        return attrs

class ProductVariantWriteSerializer(serializers.ModelSerializer):

    colour = serializers.PrimaryKeyRelatedField(
        queryset=Colour.objects.filter(is_active=True)
    )

    class Meta:
        model = ProductVariant

        fields = [
            'id',
            'sku',
            'size',
            'colour',
            'price',
            'sale_price',
            'stock',
            'low_stock_threshold',
            'is_active',
        ]

        read_only_fields = ['id']

    def validate(self, attrs):
        price = attrs.get(
            'price',
            getattr(self.instance, 'price', None)
        )

        sale_price = attrs.get(
            'sale_price',
            getattr(self.instance, 'sale_price', None)
        )

        if sale_price is not None and price is not None:
            if sale_price >= price:
                raise serializers.ValidationError({
                    'sale_price': 'Sale price must be lower than regular price.'
                })

        return attrs


class ProductImageWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage

        fields = [
            'id',
            'image',
            'is_primary',
            'image_order',
            'alt_text',
        ]

        read_only_fields = ['id']