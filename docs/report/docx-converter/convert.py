#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


KIT_DIR = Path(__file__).resolve().parent
REPORT_DIR = KIT_DIR.parent


def _finalize_word_fields(docx_path: Path) -> None:
    powershell = shutil.which("powershell.exe") or shutil.which("powershell")
    if powershell is None:
        raise OSError(
            "Không tìm thấy Microsoft Word automation (PowerShell). "
            "Hãy chạy converter trong Windows/WSL trên máy có Microsoft Word."
        )

    word_path = str(docx_path)
    if powershell.lower().endswith("powershell.exe") and shutil.which("wslpath"):
        word_path = subprocess.run(
            ["wslpath", "-w", str(docx_path)],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    subprocess.run(
        [
            powershell,
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(KIT_DIR / "update_fields.ps1"),
            "-DocxPath",
            word_path,
        ],
        check=True,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Convert report Markdown to Word DOCX")
    parser.add_argument("input", nargs="?", type=Path, help="Markdown input (default: docs/report/report.md)")
    parser.add_argument("--output", type=Path, help="DOCX output (default: beside input)")
    args = parser.parse_args(argv)

    input_md = (args.input or REPORT_DIR / "report.md").resolve()
    output_docx = (args.output or input_md.with_suffix(".docx")).resolve()
    defaults = KIT_DIR / "defaults.yaml"
    post_processor = KIT_DIR / "post_process.py"
    reference = KIT_DIR / "reference.docx"
    filter_file = KIT_DIR / "filter.lua"
    field_updater = KIT_DIR / "update_fields.ps1"

    for required in (input_md, defaults, post_processor, reference, filter_file, field_updater):
        if not required.exists():
            print(f"Lỗi: Không tìm thấy tệp bắt buộc: {required}", file=sys.stderr)
            return 1
    if shutil.which("pandoc") is None:
        print("Lỗi: Không tìm thấy lệnh 'pandoc' trên hệ thống.", file=sys.stderr)
        return 1

    output_docx.parent.mkdir(parents=True, exist_ok=True)
    print(f"=== Bắt đầu chuyển đổi: {input_md} -> {output_docx} ===")
    with tempfile.TemporaryDirectory(prefix="andv-report-convert-") as temp_dir:
        temp_docx = Path(temp_dir) / output_docx.name
        try:
            subprocess.run(
                ["pandoc", "--defaults", str(defaults), str(input_md), "-o", str(temp_docx)],
                check=True,
                cwd=str(KIT_DIR),
            )
            subprocess.run([sys.executable, str(post_processor), str(temp_docx)], check=True)
            _finalize_word_fields(temp_docx)
            subprocess.run(["unzip", "-t", str(temp_docx)], check=True, stdout=subprocess.DEVNULL)
            os.replace(temp_docx, output_docx)
        except (subprocess.CalledProcessError, OSError) as exc:
            print(f"Lỗi khi chuyển đổi báo cáo: {exc}", file=sys.stderr)
            return 1
    print(f"=== Thành công! Tệp xuất bản: {output_docx} ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
