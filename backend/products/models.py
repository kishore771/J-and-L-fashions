from django.db import models

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    description = models.TextField(blank=True, null=True)

    department = models.ForeignKey(
        'Department',
        on_delete=models.PROTECT,
        related_name='categories'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"

        constraints = [
            models.UniqueConstraint(
                fields=['department', 'slug'],
                name='unique_category_slug_per_department'
            )
        ]

    def __str__(self):
        return f"{self.department.name} - {self.name}"

class Subcategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField()

    category = models.ForeignKey(
        'Category',
        on_delete=models.PROTECT,
        related_name='subcategories'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Subcategories"
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'slug'],
                name='unique_subcategory_slug_per_category'
            )
        ]

    def __str__(self):
        return f"{self.category.department.name} - {self.category.name} - {self.name}"




class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    short_description = models.CharField(max_length=255)
    description = models.TextField()

    subcategory = models.ForeignKey(
        'Subcategory',
        on_delete=models.PROTECT,
        related_name='products'
    )
    slug = models.SlugField(unique=True)

    pattern = models.ForeignKey(
        'Pattern',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )

    fit = models.ForeignKey(
        'Fit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )

    sleeve_length = models.ForeignKey(
        'SleeveLength',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )

    occasion = models.ForeignKey(
        'Occasion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )


    dimensions = models.JSONField(default=dict, blank=True)

    tags = models.ManyToManyField(
        'Tag',
        blank=True,
        related_name='products'
    )

    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=255, blank=True)



    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return self.name


class Pattern(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Fit(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class SleeveLength(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Occasion(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Colour(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Fabric(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='variants'
    )

    sku = models.CharField(max_length=50, unique=True)
    size = models.CharField(max_length=50)



    colour = models.ForeignKey(
        'Colour',
        on_delete=models.PROTECT,
        related_name='product_variants'
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)

    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    stock = models.PositiveIntegerField(default=0)

    low_stock_threshold = models.PositiveIntegerField(default=5)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'size', 'colour'],
                name='unique_product_variant'
            ),
            models.CheckConstraint(
                condition=models.Q(price__gt=0) &
                        (
                            models.Q(sale_price__isnull=True) |
                            models.Q(sale_price__lt=models.F('price'))
                        ),
                name='valid_variant_pricing'
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.colour.name if self.colour else 'No Colour'} - {self.size}"


class VariantFabric(models.Model):
    variant = models.ForeignKey(
        'ProductVariant',
        on_delete=models.CASCADE,
        related_name='fabric_compositions'
    )

    fabric = models.ForeignKey(
        'Fabric',
        on_delete=models.PROTECT,
        related_name='variant_compositions'
    )

    percentage = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['variant', 'fabric'],
                name='unique_fabric_per_variant'
            ),
            models.CheckConstraint(
                condition=models.Q(percentage__gte=1) &
                        models.Q(percentage__lte=100),
                name='valid_fabric_percentage'
            )
        ]


    def __str__(self):
        return f"{self.fabric.name} - {self.percentage}% ({self.variant.sku})"


class ProductImage(models.Model):
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='images'
    )

    image = models.ImageField(upload_to='products/images/')
    is_primary = models.BooleanField(default=False)
    image_order = models.PositiveIntegerField(default=0)
    alt_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['product'],
                condition=models.Q(is_primary=True),
                name='unique_primary_image_per_product'
            )
        ]

    def __str__(self):
        return f"{self.product.name} - Image {self.image_order}"


class ProductVideo(models.Model):
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='videos'
    )

    video = models.FileField(upload_to='products/videos/')
    title = models.CharField(max_length=200)
    video_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.title}"

class Department(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name