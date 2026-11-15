
from openpyxl import load_workbook
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from decimal import Decimal, InvalidOperation
from django.utils.text import slugify

from .models import (
    Product,
    ProductVariant,
    Department,
    Category,
    Subcategory,
    Colour,
    Pattern,
    Fit,
    SleeveLength,
    Occasion,
)


class BulkProductUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        excel_file = request.FILES.get('file')

        if not excel_file:
            return Response(
                {'error': 'Please upload an Excel file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not excel_file.name.lower().endswith('.xlsx'):
            return Response(
                {'error': 'Only .xlsx files are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            workbook = load_workbook(
                excel_file,
                read_only=True,
                data_only=True
            )
        except Exception:
            return Response(
                {'error': 'Invalid or corrupted Excel file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            required_sheets = {'Products', 'Variants'}

            if not required_sheets.issubset(workbook.sheetnames):
                return Response(
                    {
                        'error': (
                            'Excel file must contain Products '
                            'and Variants worksheets.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            products_sheet = workbook['Products']
            variants_sheet = workbook['Variants']

            # STEP 1: Validate Excel column headers

            required_product_columns = [
                'sku',
                'name',
                'department',
                'category',
                'subcategory',
                'short_description',
                'description',
                'pattern',
                'fit',
                'sleeve_length',
                'occasion',
                'meta_title',
                'meta_description'
            ]

            required_variant_columns = [
                'product_sku',
                'variant_sku',
                'size',
                'colour',
                'price',
                'sale_price',
                'stock',
                'low_stock_threshold'
            ]

            product_headers = [
                cell.value for cell in products_sheet[1]
            ]

            variant_headers = [
                cell.value for cell in variants_sheet[1]
            ]

            if product_headers != required_product_columns:
                return Response(
                    {'error': 'Invalid Products worksheet columns.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if variant_headers != required_variant_columns:
                return Response(
                    {'error': 'Invalid Variants worksheet columns.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # STEP 2: Read Excel rows

            products_rows = list(
                products_sheet.iter_rows(values_only=True)
            )

            variants_rows = list(
                variants_sheet.iter_rows(values_only=True)
            )

            # STEP 3: Validate product SKUs and categories

            product_skus = set()
            product_slugs = set()
            validation_errors = []

            for row_number, row in enumerate(
                products_rows[1:],
                start=2
            ):
                sku = (
                    str(row[0]).strip()
                    if row[0] is not None
                    else ''
                )

                # Check missing SKU
                if not sku:
                    validation_errors.append(
                        f'Products row {row_number}: SKU is required.'
                    )
                    continue


                # Validate product SKU length
                if len(sku) > 50:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        'SKU cannot exceed 50 characters.'
                    )
                    continue


                # Check duplicate SKU in Excel
                if sku in product_skus:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'Duplicate SKU "{sku}".'
                    )
                    continue

                product_skus.add(sku)

                # Generate and validate product slug
                product_slug = slugify(sku)

                if product_slug:
                    if product_slug in product_slugs:
                        validation_errors.append(
                            f'Products row {row_number}: '
                            f'Duplicate generated slug "{product_slug}".'
                        )
                    else:
                        product_slugs.add(product_slug)


                if not product_slug:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        'Cannot generate a valid slug from SKU.'
                    )
                elif len(product_slug) > 50:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        'Generated slug exceeds 50 characters.'
                    )
                elif Product.objects.filter(
                    slug=product_slug
                ).exists():
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'Slug "{product_slug}" already exists.'
                    )


                # Validate product name
                product_name = str(row[1] or '').strip()

                if not product_name:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        'Product name is required.'
                    )

                elif len(product_name) > 200:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        'Product name cannot exceed 200 characters.'
                    )


                # Validate product description fields
                text_fields = [
                    (5, 'Short description', 255),
                    (11, 'Meta title', 255),
                    (12, 'Meta description', 255),
                ]

                for column_index, field_name, max_length in text_fields:
                    value = str(row[column_index] or '').strip()

                    if len(value) > max_length:
                        validation_errors.append(
                            f'Products row {row_number}: '
                            f'{field_name} cannot exceed '
                            f'{max_length} characters.'
                        )


                # Check duplicate SKU in database
                if Product.objects.filter(sku=sku).exists():
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'SKU "{sku}" already exists in the database.'
                    )


                # Validate optional product attributes
                optional_attributes = [
                    (7, 'Pattern', Pattern),
                    (8, 'Fit', Fit),
                    (9, 'Sleeve length', SleeveLength),
                    (10, 'Occasion', Occasion),
                ]

                for column_index, field_name, model_class in optional_attributes:
                    attribute_name = str(row[column_index] or '').strip()

                    # Empty optional attributes are allowed
                    if not attribute_name:
                        continue

                    if not model_class.objects.filter(
                        name__iexact=attribute_name,
                        is_active=True
                    ).exists():
                        validation_errors.append(
                            f'Products row {row_number}: '
                            f'Invalid {field_name.lower()} '
                            f'"{attribute_name}".'
                        )
                short_description = str(row[5] or '').strip()
                description = str(row[6] or '').strip()

                if not short_description:
                    validation_errors.append(
                        f'Products row {row_number}: Short description is required.'
                    )

                if not description:
                    validation_errors.append(
                        f'Products row {row_number}: Description is required.'
                    )

                # STEP 4: Validate department, category, subcategory

                department_name = str(row[2] or '').strip()
                category_name = str(row[3] or '').strip()
                subcategory_name = str(row[4] or '').strip()

                # Validate department
                department = Department.objects.filter(
                    name__iexact=department_name,
                    is_active=True
                ).first()

                if not department:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'Invalid department "{department_name}".'
                    )
                    continue

                # Validate category within department
                category = Category.objects.filter(
                    name__iexact=category_name,
                    department=department,
                    is_active=True
                ).first()

                if not category:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'Invalid category "{category_name}" '
                        f'for department "{department_name}".'
                    )
                    continue

                # Validate subcategory within category
                subcategory = Subcategory.objects.filter(
                    name__iexact=subcategory_name,
                    category=category,
                    is_active=True
                ).first()

                if not subcategory:
                    validation_errors.append(
                        f'Products row {row_number}: '
                        f'Invalid subcategory "{subcategory_name}" '
                        f'for category "{category_name}".'
                    )
                    continue


            # Return all product and variant validation errors


# STEP 5: Validate variant SKUs and product references

            variant_skus = set()
            variant_combinations = set()

            for row_number, row in enumerate(variants_rows[1:], start=2):
                product_sku = str(row[0] or '').strip()
                variant_sku = str(row[1] or '').strip()

                # Check whether the parent product exists in the Excel file
                if product_sku not in product_skus:
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        f'Product SKU "{product_sku}" was not found '
                        f'in the Products worksheet.'
                    )

                # Check missing variant SKU
                if not variant_sku:
                    validation_errors.append(
                        f'Variants row {row_number}: Variant SKU is required.'
                    )
                    continue


                # Validate variant SKU length
                if len(variant_sku) > 50:
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        'Variant SKU cannot exceed 50 characters.'
                    )
                    continue


                # Check duplicate variant SKU within Excel
                if variant_sku in variant_skus:
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        f'Duplicate variant SKU "{variant_sku}".'
                    )
                    continue

                variant_skus.add(variant_sku)

                # Validate variant size
                size = str(row[2] or '').strip()
                colour_name = str(row[3] or '').strip()

                if not size:
                    validation_errors.append(
                        f'Variants row {row_number}: Size is required.'
                    )
                elif len(size) > 50:
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        'Size cannot exceed 50 characters.'
                    )

                # Check duplicate size and colour for the same product
                combination = (
                    product_sku.casefold(),
                    size.casefold(),
                    colour_name.casefold()
                )

                if size and colour_name:
                    if combination in variant_combinations:
                        validation_errors.append(
                            f'Variants row {row_number}: '
                            f'Duplicate size "{size}" and colour '
                            f'"{colour_name}" for product "{product_sku}".'
                        )
                    else:
                        variant_combinations.add(combination)


                # Check existing variant SKU in Django
                if ProductVariant.objects.filter(sku=variant_sku).exists():
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        f'Variant SKU "{variant_sku}" already exists '
                        f'in the database.'
                    )


                # Validate variant colour
                colour_name = str(row[3] or '').strip()

                if not colour_name:
                    validation_errors.append(
                        f'Variants row {row_number}: Colour is required.'
                    )
                elif not Colour.objects.filter(
                    name__iexact=colour_name,
                    is_active=True
                ).exists():
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        f'Invalid colour "{colour_name}".'
                    )


                # Validate regular price and sale price
                try:
                    price = Decimal(str(row[4]))

                    if not price.is_finite() or price <= 0:
                        raise ValueError()

                    if price.as_tuple().exponent < -2:
                        raise ValueError()

                    if price > Decimal('99999999.99'):
                        raise ValueError()


                except (InvalidOperation, ValueError, TypeError):
                    validation_errors.append(
                        f'Variants row {row_number}: '
                        'Price must be a positive number '
                        'with at most 2 decimal places.'
                    )
                    continue

                # Sale price is optional
                if row[5] is not None and str(row[5]).strip() != '':
                    try:
                        sale_price = Decimal(str(row[5]))

                        if (
                            not sale_price.is_finite()
                            or sale_price <= 0
                            or sale_price >= price

                            or sale_price > Decimal('99999999.99')

                            or sale_price.as_tuple().exponent < -2
                        ):
                            raise ValueError()

                    except (InvalidOperation, ValueError, TypeError):
                        validation_errors.append(
                            f'Variants row {row_number}: '
                            'Sale price must be positive, '
                            'lower than regular price, '
                            'and have at most 2 decimal places.'
                        )

                # STEP 2.31: Validate stock and low-stock threshold

                stock_fields = [
                    (6, 'Stock'),
                    (7, 'Low-stock threshold')
                ]

                for column_index, field_name in stock_fields:
                    value = row[column_index]

                    try:
                        if value is None or str(value).strip() == '':
                            raise ValueError()

                        number = Decimal(str(value))

                        if (
                            not number.is_finite()
                            or number < 0
                            or number != number.to_integral_value()
                            or number > 2147483647
                        ):
                            raise ValueError()

                    except (InvalidOperation, ValueError, TypeError):
                        validation_errors.append(
                            f'Variants row {row_number}: '
                            f'{field_name} must be a non-negative whole number.'
                        )


            # Return all validation errors before database insertion
            if validation_errors:
                return Response(
                    {'errors': validation_errors},
                    status=status.HTTP_400_BAD_REQUEST
                )


            # STEP 6: Create products in an atomic transaction
            with transaction.atomic():
                created_products = {}

                for row in products_rows[1:]:
                    sku = str(row[0]).strip()

                    department = Department.objects.get(
                        name__iexact=str(row[2]).strip()
                    )

                    category = Category.objects.get(
                        name__iexact=str(row[3]).strip(),
                        department=department
                    )

                    subcategory = Subcategory.objects.get(
                        name__iexact=str(row[4]).strip(),
                        category=category
                    )

                    def get_optional_attribute(model_class, value):
                        name = str(value or '').strip()

                        if not name:
                            return None

                        return model_class.objects.get(
                            name__iexact=name,
                            is_active=True
                        )

                    product = Product.objects.create(
                        sku=sku,
                        name=str(row[1]).strip(),
                        slug=slugify(sku),
                        short_description=str(row[5]).strip(),
                        description=str(row[6]).strip(),
                        subcategory=subcategory,
                        pattern=get_optional_attribute(Pattern, row[7]),
                        fit=get_optional_attribute(Fit, row[8]),
                        sleeve_length=get_optional_attribute(
                            SleeveLength, row[9]
                        ),
                        occasion=get_optional_attribute(Occasion, row[10]),
                        meta_title=str(row[11] or '').strip(),
                        meta_description=str(row[12] or '').strip()
                    )

                    created_products[sku] = product


                # STEP 7: Create variants for imported products
                for row in variants_rows[1:]:
                    product_sku = str(row[0]).strip()
                    variant_sku = str(row[1]).strip()
                    size = str(row[2]).strip()
                    colour_name = str(row[3]).strip()

                    colour = Colour.objects.get(
                        name__iexact=colour_name,
                        is_active=True
                    )

                    sale_price = None

                    if row[5] is not None and str(row[5]).strip():
                        sale_price = Decimal(str(row[5]))

                    ProductVariant.objects.create(
                        product=created_products[product_sku],
                        sku=variant_sku,
                        size=size,
                        colour=colour,
                        price=Decimal(str(row[4])),
                        sale_price=sale_price,
                        stock=int(Decimal(str(row[6]))),
                        low_stock_threshold=int(Decimal(str(row[7])))
                    )




            # STEP 8: Return successful import response

            return Response(
                    {
                        'message': 'Products and variants imported successfully.',
                        'products_created': len(created_products),
                        'variants_created': len(variants_rows) - 1,
                    },
                    status=status.HTTP_201_CREATED
                )

        finally:
            workbook.close()
