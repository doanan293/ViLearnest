import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


KIT_DIR = Path(__file__).resolve().parents[1]
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{W_NS}}}"


class ConverterFieldUpdateTests(unittest.TestCase):
    def test_generated_docx_has_cached_index_page_numbers_without_open_update_request(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "report.docx"
            result = subprocess.run(
                ["python3", str(KIT_DIR / "convert.py"), "--output", str(output)],
                check=False,
                capture_output=True,
                text=True,
                cwd=KIT_DIR.parents[2],
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            with zipfile.ZipFile(output) as archive:
                document = ET.fromstring(archive.read("word/document.xml"))
                settings = ET.fromstring(archive.read("word/settings.xml"))

            instructions = [node.text or "" for node in document.findall(f".//{W}instrText")]
            toc_fields = [instruction for instruction in instructions if instruction.strip().startswith("TOC ")]
            page_references = [instruction for instruction in instructions if "PAGEREF" in instruction]

            self.assertEqual(len(toc_fields), 3)
            self.assertGreater(len(page_references), 3)
            self.assertIsNone(settings.find(f"./{W}updateFields"))


if __name__ == "__main__":
    unittest.main()
