
from pathlib import Path

from django.core.management.base import BaseCommand
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment


class Command(BaseCommand):
    help = "Generate the J&L Fashions bulk product upload template"

    def handle(self, *args, **options):
        workbook = Workbook()

        products_sheet = workbook.active
        products_sheet.title = "Products"

        variants_sheet = workbook.create_sheet("Variants")

        product_columns = [
            "sku",
            "name",
            "department",
            "category",
            "subcategory",
            "short_description",
            "description",
            "pattern",
            "fit",
            "sleeve_length",
            "occasion",
            "meta_title",
            "meta_description",
        ]

        variant_columns = [
            "product_sku",
            "variant_sku",
            "size",
            "colour",
            "price",
            "sale_price",
            "stock",
            "low_stock_threshold",
        ]

        for sheet, columns in [
            (products_sheet, product_columns),
            (variants_sheet, variant_columns),
        ]:
            sheet.append(columns)
            sheet.freeze_panes = "A2"
            sheet.auto_filter.ref = (
                f"A1:{sheet.cell(1, len(columns)).coordinate}"
            )

            for cell in sheet[1]:
                cell.font = Font(
                    bold=True,
                    color="FFFFFF"
                )
                cell.fill = PatternFill(
                    fill_type="solid",
                    fgColor="17365D"
                )
                cell.alignment = Alignment(
                    horizontal="center"
                )

            for column in sheet.columns:
                letter = column[0].column_letter
                sheet.column_dimensions[letter].width = 24

        output_path = (
            Path.cwd() / "product_upload_template.xlsx"
        )

        workbook.save(output_path)

        self.stdout.write(
            self.style.SUCCESS(
                f"Template created: {output_path}"
            )
        )
