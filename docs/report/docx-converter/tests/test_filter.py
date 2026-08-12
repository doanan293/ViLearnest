import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


KIT_DIR = Path(__file__).resolve().parents[1]
REPORT_DIR = KIT_DIR.parent
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{W_NS}}}"


class CoverFilterIntegrationTests(unittest.TestCase):
    def test_full_converter_preserves_three_native_word_indexes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "report.docx"
            subprocess.run(
                ["python3", str(KIT_DIR / "convert.py"), "--output", str(output)],
                check=True,
                cwd=REPORT_DIR.parents[1],
            )

            with zipfile.ZipFile(output) as archive:
                root = ET.fromstring(archive.read("word/document.xml"))

            instructions = [
                node.text for node in root.findall(f".//{W}instrText")
                if (node.text or "").startswith("TOC ")
            ]
            self.assertEqual(len(root.findall(f".//{W}sdt")), 3)
            self.assertEqual(
                instructions,
                [
                    'TOC \\o "1-3" \\h \\z \\u',
                    'TOC \\h \\z \\c "Bảng"',
                    'TOC \\h \\z \\c "Hình"',
                ],
            )

    def test_report_cover_contains_metadata_and_hust_logo_without_default_title(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "report.docx"
            subprocess.run(
                [
                    "pandoc",
                    "--defaults",
                    str(KIT_DIR / "defaults.yaml"),
                    str(REPORT_DIR / "report.md"),
                    "-o",
                    str(output),
                ],
                check=True,
                cwd=KIT_DIR,
            )

            with zipfile.ZipFile(output) as archive:
                root = ET.fromstring(archive.read("word/document.xml"))
                media = [name for name in archive.namelist() if name.startswith("word/media/")]

            paragraphs = root.findall(f".//{W}p")
            texts = ["".join(node.text or "" for node in p.findall(f".//{W}t")) for p in paragraphs]
            styles = []
            for paragraph in paragraphs:
                style = paragraph.find(f"./{W}pPr/{W}pStyle")
                styles.append(style.get(f"{W}val") if style is not None else "")

            self.assertIn("Kiểm thử API tự động với Bruno trên hệ thống LMS", texts)
            self.assertIn("Tên Học Viên:\tDoãn Văn An", texts)
            self.assertIn("Mã số học viên:\t20252778M", texts)
            self.assertIn("Hà Nội – 2026", texts)
            self.assertIn("CoverLogo", styles)
            self.assertNotIn("Title", styles)
            self.assertEqual(len(media), 9)
            self.assertEqual(len(root.findall(f".//{W}sdt")), 3)
            instructions = [node.text for node in root.findall(f".//{W}instrText")]
            self.assertEqual(
                instructions,
                [
                    'TOC \\o "1-3" \\h \\z \\u',
                    'TOC \\h \\z \\c "Bảng"',
                    'TOC \\h \\z \\c "Hình"',
                ],
            )


if __name__ == "__main__":
    unittest.main()
