import unittest
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import post_process


class CaptionSequenceFieldTests(unittest.TestCase):
    def test_formats_semantic_cover_like_the_approved_report(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}" xmlns:wp="{post_process.WP_NS}" xmlns:a="{post_process.A_NS}">
          <w:body>
            <w:p><w:pPr><w:pStyle w:val="CoverLogo"/></w:pPr><w:r><w:drawing><wp:inline><wp:extent cx="1" cy="1"/><a:xfrm><a:ext cx="1" cy="1"/></a:xfrm></wp:inline></w:drawing></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="CoverTitle"/></w:pPr><w:r><w:t>Tiêu đề</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="CoverInfo"/></w:pPr><w:r><w:t>Tên Học Viên:	Doãn Văn An</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="CoverInfo"/></w:pPr><w:r><w:t>Mã số học viên:	20252778M</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="CoverPlaceYear"/></w:pPr><w:r><w:t>Hà Nội – 2026</w:t></w:r></w:p>
            <w:sectPr/>
          </w:body>
        </w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        body = result.find(f"./{post_process._w('body')}")
        table = body.find(f"./{post_process._w('tbl')}")
        self.assertIsNotNone(table)
        self.assertEqual(len(table.findall(f"./{post_process._w('tr')}")), 2)
        table_style = table.find(f"./{post_process._w('tblPr')}/{post_process._w('tblStyle')}")
        self.assertIsNotNone(table_style)
        self.assertEqual(table_style.get(post_process._w("val")), "TableNormal")
        borders = table.find(f"./{post_process._w('tblPr')}/{post_process._w('tblBorders')}")
        self.assertIsNotNone(borders)
        self.assertEqual(
            {
                child.tag.split("}")[-1]: child.get(post_process._w("val"))
                for child in borders
            },
            {
                "top": "nil",
                "left": "nil",
                "bottom": "nil",
                "right": "nil",
                "insideH": "nil",
                "insideV": "nil",
            },
        )
        for cell in table.findall(f".//{post_process._w('tc')}"):
            cell_borders = cell.find(
                f"./{post_process._w('tcPr')}/{post_process._w('tcBorders')}"
            )
            self.assertIsNotNone(cell_borders)
            self.assertEqual(
                {
                    child.tag.split("}")[-1]: child.get(post_process._w("val"))
                    for child in cell_borders
                },
                {
                    "top": "nil",
                    "left": "nil",
                    "bottom": "nil",
                    "right": "nil",
                    "insideH": "nil",
                    "insideV": "nil",
                },
            )

        logo = body.find(f"./{post_process._w('p')}[1]")
        extent = logo.find(f".//{{{post_process.WP_NS}}}extent")
        self.assertEqual((extent.get("cx"), extent.get("cy")), ("4267200", "3699400"))
        title = next(
            p for p in body.findall(f"./{post_process._w('p')}")
            if (p.find(f"./{post_process._w('pPr')}/{post_process._w('pStyle')}") is not None
                and p.find(f"./{post_process._w('pPr')}/{post_process._w('pStyle')}").get(post_process._w("val")) == "CoverTitle")
        )
        self.assertEqual(title.find(f".//{post_process._w('sz')}").get(post_process._w("val")), "52")
        self.assertEqual(title.find(f"./{post_process._w('pPr')}/{post_process._w('jc')}").get(post_process._w("val")), "center")

    def test_disables_automatic_field_updates_after_fields_are_precomputed(self):
        result = ET.fromstring(post_process._enable_automatic_field_updates(b"<ignored/>"))
        update = result.find(f"./{post_process._w('updateFields')}")
        self.assertIsNone(update)

    def test_cover_section_enrichment_is_idempotent(self):
        document = rf'''<w:document xmlns:w="{post_process.W_NS}"><w:body>
          <w:p><w:pPr><w:pStyle w:val="CoverPlaceYear"/><w:sectPr/></w:pPr><w:r><w:t>Hà Nội – 2026</w:t></w:r></w:p>
          <w:sectPr/>
        </w:body></w:document>'''.encode()
        relationships = rf'''<Relationships xmlns="{post_process.PKG_REL_NS}"/>'''.encode()
        content_types = rf'''<Types xmlns="{post_process.CT_NS}"/>'''.encode()

        first = post_process._add_footer_and_sections(document, relationships, content_types, None)
        second = post_process._add_footer_and_sections(*first)
        result = ET.fromstring(second[0])
        cover_section = result.find(
            f".//{post_process._w('pPr')}/{post_process._w('sectPr')}"
        )
        for tag in ("type", "pgSz", "pgMar", "pgBorders"):
            self.assertEqual(len(cover_section.findall(f"./{post_process._w(tag)}")), 1)

    def test_footer_paragraphs_remain_centered_with_global_spacing(self):
        xml = rf'''<w:ftr xmlns:w="{post_process.W_NS}"><w:p><w:r><w:t>1</w:t></w:r></w:p></w:ftr>'''.encode()
        result = ET.fromstring(post_process._process_footer_xml(xml))
        paragraph = result.find(f"./{post_process._w('p')}")
        spacing = paragraph.find(f"./{post_process._w('pPr')}/{post_process._w('spacing')}")
        alignment = paragraph.find(f"./{post_process._w('pPr')}/{post_process._w('jc')}")
        self.assertEqual(
            tuple(spacing.get(post_process._w(attr)) for attr in ("before", "after", "line", "lineRule")),
            ("120", "120", "360", "auto"),
        )
        self.assertEqual(alignment.get(post_process._w("val")), "center")

    def test_starts_content_on_new_page_after_all_word_indexes(self):
        xml = rf'''<w:document xmlns:w="{post_process.W_NS}"><w:body>
          <w:sdt><w:sdtContent><w:p><w:r><w:t>Mục lục</w:t></w:r></w:p></w:sdtContent></w:sdt>
          <w:sdt><w:sdtContent><w:p><w:r><w:t>Danh mục bảng</w:t></w:r></w:p></w:sdtContent></w:sdt>
          <w:sdt><w:sdtContent><w:p><w:r><w:t>Danh mục hình</w:t></w:r></w:p></w:sdtContent></w:sdt>
          <w:p><w:pPr/><w:r/></w:p>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Tóm tắt</w:t></w:r></w:p>
          <w:sectPr/>
        </w:body></w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        body = result.find(f"./{post_process._w('body')}")
        paragraphs = body.findall(f"./{post_process._w('p')}")
        empty = next(paragraph for paragraph in paragraphs if not post_process._paragraph_text(paragraph).strip())
        summary = next(paragraph for paragraph in paragraphs if post_process._paragraph_text(paragraph) == "Tóm tắt")
        self.assertIsNone(empty.find(f"./{post_process._w('pPr')}/{post_process._w('pageBreakBefore')}"))
        self.assertIsNotNone(summary.find(f"./{post_process._w('pPr')}/{post_process._w('pageBreakBefore')}"))

    def test_package_relationships_keep_default_namespaces_for_office_compatibility(self):
        document = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}"><w:body><w:p/><w:sectPr/></w:body></w:document>'''.encode()
        relationships = rf'''<?xml version="1.0" encoding="utf-8"?>
        <Relationships xmlns="{post_process.PKG_REL_NS}"></Relationships>'''.encode()
        content_types = rf'''<?xml version="1.0" encoding="utf-8"?>
        <Types xmlns="{post_process.CT_NS}">
          <Default Extension="xml" ContentType="application/xml"/>
        </Types>'''.encode()

        _, result_relationships, result_content_types, _ = post_process._add_footer_and_sections(
            document, relationships, content_types, None
        )

        self.assertIn(f'<Relationships xmlns="{post_process.PKG_REL_NS}"'.encode(), result_relationships)
        self.assertIn(f'<Types xmlns="{post_process.CT_NS}"'.encode(), result_content_types)
        self.assertNotIn(b"ns0:", result_relationships)
        self.assertNotIn(b"ns0:", result_content_types)

    def test_sets_document_default_text_to_13_points(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:styles xmlns:w="{post_process.W_NS}">
          <w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>
        </w:styles>'''.encode()

        result = ET.fromstring(post_process._process_styles_xml(xml))
        rpr = result.find(f".//{post_process._w('rPr')}")
        self.assertEqual(rpr.find(f"./{post_process._w('sz')}").get(post_process._w("val")), "26")
        self.assertEqual(rpr.find(f"./{post_process._w('szCs')}").get(post_process._w("val")), "26")

    def test_sets_all_non_heading_text_to_13_points_including_tables(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}">
          <w:body>
            <w:p><w:pPr><w:pStyle w:val="FirstParagraph"/></w:pPr><w:r><w:t>Mở đầu</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Tiêu đề</w:t></w:r></w:p>
            <w:tbl>
              <w:tblPr><w:tblW w:w="1000" w:type="dxa"/></w:tblPr>
              <w:tblGrid><w:gridCol w:w="1000"/></w:tblGrid>
              <w:tr><w:tc><w:p><w:r><w:t>Nội dung bảng</w:t></w:r></w:p></w:tc></w:tr>
            </w:tbl>
          </w:body>
        </w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        paragraphs = result.findall(f".//{post_process._w('p')}")
        size = post_process._w("sz")
        self.assertEqual(paragraphs[0].find(f".//{size}").get(post_process._w("val")), "26")
        self.assertIsNone(paragraphs[1].find(f".//{size}"))
        self.assertEqual(paragraphs[2].find(f".//{size}").get(post_process._w("val")), "26")

    def test_justifies_body_text_but_left_aligns_table_text(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}">
          <w:body>
            <w:p><w:pPr><w:pStyle w:val="BodyText"/></w:pPr><w:r><w:t>Nội dung thường</w:t></w:r></w:p>
            <w:tbl>
              <w:tblPr><w:tblW w:w="1000" w:type="dxa"/></w:tblPr>
              <w:tblGrid><w:gridCol w:w="1000"/></w:tblGrid>
              <w:tr><w:tc><w:p><w:pPr><w:pStyle w:val="Compact"/></w:pPr><w:r><w:t>Nội dung bảng</w:t></w:r></w:p></w:tc></w:tr>
            </w:tbl>
          </w:body>
        </w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        paragraphs = result.findall(f".//{post_process._w('p')}")
        alignments = [
            paragraph.find(f"./{post_process._w('pPr')}/{post_process._w('jc')}").get(post_process._w("val"))
            for paragraph in paragraphs
        ]

        self.assertEqual(alignments, ["both", "left"])

    def test_converts_caption_numbers_to_seq_fields(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}">
          <w:body>
            <w:p><w:pPr><w:pStyle w:val="ImageCaption"/></w:pPr><w:r><w:t>Hình 7. Sơ đồ</w:t></w:r></w:p>
            <w:p><w:r><w:t>[Hình 7] là tham chiếu nội dung</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="TableCaption"/></w:pPr><w:r><w:t>Bảng 3. Dữ liệu</w:t></w:r></w:p>
          </w:body>
        </w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        fields = result.findall(f".//{post_process._w('fldSimple')}")

        self.assertEqual(
            [field.get(post_process._w("instr")) for field in fields],
            [r"SEQ Hình \* ARABIC", r"SEQ Bảng \* ARABIC"],
        )
        self.assertEqual(
            ["".join(p.itertext()) for p in result.findall(f".//{post_process._w('p')}")],
            ["Hình 7. Sơ đồ", "[Hình 7] là tham chiếu nội dung", "Bảng 3. Dữ liệu"],
        )

    def test_preserves_an_existing_simple_sequence_field(self):
        xml = rf'''<?xml version="1.0" encoding="utf-8"?>
        <w:document xmlns:w="{post_process.W_NS}">
          <w:body>
            <w:p>
              <w:pPr><w:pStyle w:val="ImageCaption"/></w:pPr>
              <w:r><w:t xml:space="preserve">Hình </w:t></w:r>
              <w:fldSimple w:instr="SEQ Hình \* ARABIC">
                <w:r><w:rPr><w:b/></w:rPr><w:t>4</w:t></w:r>
              </w:fldSimple>
              <w:r><w:t>. Kiến trúc</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>'''.encode()

        result = ET.fromstring(post_process._process_document_xml(xml))
        fields = result.findall(f".//{post_process._w('fldSimple')}")

        self.assertEqual(len(fields), 1)
        self.assertIsNotNone(fields[0].find(f".//{post_process._w('b')}"))


if __name__ == "__main__":
    unittest.main()
