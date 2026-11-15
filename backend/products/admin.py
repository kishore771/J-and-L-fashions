from django.contrib import admin

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

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'slug', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('department', 'is_active')


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active')
    search_fields = ('name', 'category__name')
    list_filter = ('category', 'is_active')


@admin.register(Pattern, Fit, SleeveLength, Occasion)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Colour, Fabric, Tag)
class CatalogueAttributeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)



class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = (
        'image',
        'alt_text',
        'is_primary',
        'image_order',
    )


class ProductVideoInline(admin.TabularInline):
    model = ProductVideo
    extra = 0
    fields = (
        'video',
        'title',
        'video_order',
        'is_active',
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'sku',
        'subcategory',
        'is_active',
        'created_at',
    )
    search_fields = ('name', 'sku')
    list_filter = ('subcategory', 'is_active')
    prepopulated_fields = {'slug': ('name',)}

    inlines = [
        ProductImageInline,
        ProductVideoInline,
    ]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'sku',
        'product',
        'size',
        'colour',
        'price',
        'sale_price',
        'stock',
        'is_active',
    )
    search_fields = ('sku', 'product__name')
    list_filter = ('colour', 'is_active')


@admin.register(VariantFabric)
class VariantFabricAdmin(admin.ModelAdmin):
    list_display = (
        'variant',
        'fabric',
        'percentage',
    )
    search_fields = (
        'variant__sku',
        'variant__product__name',
        'fabric__name',
    )
    list_filter = ('fabric',)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'image_order',
        'is_primary',
        'created_at',
    )
    search_fields = ('product__name', 'alt_text')
    list_filter = ('is_primary',)


@admin.register(ProductVideo)
class ProductVideoAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'title',
        'video_order',
        'is_active',
        'created_at',
    )
    search_fields = ('product__name', 'title')
    list_filter = ('is_active',)