# Bộ chuyển đổi báo cáo Markdown → Word

Thư mục này chứa toàn bộ công cụ và quy tắc để tạo `docs/report/report.docx` từ `docs/report/report.md`. README này vừa là hướng dẫn chạy converter, vừa là quy chuẩn viết báo cáo cho người viết và AI Agent.

## Chạy nhanh

Từ bất kỳ thư mục nào:

```bash
python3 docs/report/docx-converter/convert.py
```

Lệnh mặc định đọc `docs/report/report.md` và ghi `docs/report/report.docx`. Có thể chọn nguồn và đích khác:

```bash
python3 docs/report/docx-converter/convert.py path/to/report.md
python3 docs/report/docx-converter/convert.py path/to/report.md --output path/to/report.docx
```

Converter chạy Pandoc, hậu xử lý WordprocessingML, chèn ba mục lục native của Microsoft Word, kiểm tra gói DOCX rồi mới thay file đích. Nếu có lỗi chuyển đổi, file DOCX cũ được giữ nguyên. Converter không dùng LibreOffice để ghi nội dung mục lục vì Writer có thể thay field và layout native của Word.

Yêu cầu hệ thống: `python3`, `pandoc`, `unzip`, PowerShell và Microsoft Word. Converter tự động dùng Word ở chế độ nền để phân trang, cập nhật mục lục chính, danh mục bảng và danh mục hình trước khi xuất file.

## Cấu trúc

```text
docs/report/
├── report.md                 # nguồn nội dung duy nhất
├── report.docx               # file xuất bản
├── images/                   # ảnh nội dung báo cáo
└── docx-converter/
    ├── convert.py            # CLI
    ├── defaults.yaml         # cấu hình Pandoc
    ├── filter.lua            # biến đổi Markdown/Pandoc
    ├── post_process.py       # chuẩn hóa OOXML
    ├── reference.docx        # style reference, không chứa nội dung
    ├── README.md             # tài liệu này
    ├── assets/logo-hust.png  # asset của trang bìa
    └── tests/                # kiểm thử converter
```

Không sửa trực tiếp `report.docx` để điều chỉnh layout. Mọi thay đổi phải được đưa vào Markdown, `reference.docx` hoặc post-processor rồi convert lại.

## Viết `report.md`

### Metadata trang bìa

Đặt YAML front matter ở đầu file. Các trường dưới đây được dùng để dựng trang bìa:

```yaml
---
title: "Kiểm thử API tự động với Bruno trên hệ thống LMS"
student-name: "Doãn Văn An"
student-id: "20252778M"
course-code: ""
lecturer: ""
place-year: "Hà Nội – 2026"
cover-logo: "assets/logo-hust.png"
---
```

### Thứ tự nội dung

Sau front matter, giữ thứ tự:

1. Khối `.markdown-only` cho mục lục điều hướng trên GitHub (nếu cần).
2. Khối `.report-cover` và `.word-contents`.
3. `Tóm tắt`, `Đóng góp chính`, `Từ khóa`.
4. Các chương được đánh số.
5. `Kết luận`.
6. `Tài liệu tham khảo`.

Mẫu tối thiểu:

```markdown
::: {.markdown-only}
Mục lục dành cho bản Markdown.
:::

::: {.report-cover}
:::

::: {.word-contents}
:::

# Tóm tắt

Nội dung tóm tắt viết thành đoạn văn hoàn chỉnh.

# 1. Tổng quan kiểm thử API

## 1.1. Bối cảnh ứng dụng trong LMS

Nội dung học thuật.
```

Converter tự bỏ `.markdown-only`, dựng bìa và chèn ba field Word cho mục lục chính, danh mục bảng và danh mục hình. Không chèn raw OpenXML dài vào `report.md`.

### Heading và văn phong

- Tự đánh số heading trong Markdown: `# 1. ...`, `## 1.1. ...`, `### 1.1.1. ...`.
- Heading không đánh số như `# Tóm tắt`, `# Kết luận`, `# Tài liệu tham khảo` được giữ nguyên.
- Dùng đoạn văn học thuật hoàn chỉnh; tránh biến phần diễn giải thành danh sách gạch đầu dòng.
- Không dùng `**bold**` hoặc `__bold__` trong nội dung báo cáo nếu không có yêu cầu riêng.
- Không để nội dung học thuật chỉ tồn tại trong DOCX; Markdown phải là nguồn đầy đủ.

### Bảng

Đặt anchor trước caption nếu bảng được tham chiếu hoặc đưa vào danh mục:

```markdown
<a id="bang-1"></a>

Table: Bảng 1. Đặc điểm kỹ thuật của hệ thống thử nghiệm Andv-LMS

Thành phần | Công nghệ | Vai trò
--- | --- | ---
Frontend | Next.js | Giao diện người dùng
Backend | Fastify | API nghiệp vụ
```

Số bảng phải tăng liên tục. Caption phải bắt đầu bằng `Bảng N.`. Cột mô tả dài nên rộng hơn cột số thứ tự hoặc giá trị ngắn; post-processor đặt width DXA cố định cho bảng. Nội dung bảng được căn trái.

Khi một ô cần nhiều dòng, dùng `<br>`:

```markdown
Tên request | Cấu hình
--- | ---
Upload | `key`: `cover.png`<br>`contentType`: `image/png`
```

### Hình ảnh

Đường dẫn tính từ file Markdown, dùng anchor và kích thước rõ ràng:

```markdown
<a id="hinh-1"></a>

![Hình 1. Kiến trúc hệ thống Andv-LMS](images/hinh-1-kientruc-andv-lms.png){width=6.0in}
```

Caption trong `![...]` phải bắt đầu bằng `Hình N.` và khớp với tham chiếu trong nội dung.

### Công thức

Inline dùng `$...$`; công thức độc lập dùng `$$...$$`:

```markdown
Độ chính xác được tính bằng $Accuracy = (TP + TN) / N$.

$$
Coverage = \frac{\text{route đã kiểm thử}}{\text{tổng route}}
$$
```

### Trích dẫn và tài liệu tham khảo

Trong nội dung dùng `[1]`, `[1-3]` hoặc `[1, 2]`. Mỗi tài liệu tham khảo là một đoạn riêng bắt đầu bằng `[N]`; dùng định dạng Vancouver nhất quán và không biến danh mục thành bullet list.

## Chuẩn Word bắt buộc

- Khổ giấy A4, Portrait.
- Lề trên 2 cm, dưới 2 cm, trái 3 cm, phải 1.5 cm.
- Times New Roman.
- Chữ thường 13 pt.
- Line spacing 1.5.
- Before 6 pt, After 6 pt cho toàn bộ paragraph: bìa, heading, TOC, bảng, caption, references, footnote và endnote.
- Body text căn đều; nội dung trong bảng căn trái.
- Trang bìa là section riêng và không hiện số trang.
- Footer số trang căn giữa; trang sau bìa bắt đầu từ số 1.
- Mục lục chính lấy Heading 1–3; danh mục bảng/hình dùng field Word `TOC \\c` liên kết với nhãn caption `SEQ Bảng`/`SEQ Hình`.

Converter dựng sẵn nội dung và số trang cho mọi mục lục bằng Microsoft Word. File không yêu cầu cập nhật field khi mở và không cần thay đổi setting hoặc cài macro trong Word.

## Kiểm tra

Chạy unit tests:

```bash
python3 -m unittest discover -s docs/report/docx-converter/tests -p 'test_*.py' -v
```

Kiểm tra package và schema:

```bash
unzip -t docs/report/report.docx
uv run --with defusedxml --with lxml python \
  /mnt/c/Users/doan.van.an/.agents/skills/docx/scripts/office/validate.py \
  docs/report/report.docx
```

Render PDF để kiểm tra trực quan:

```bash
render_dir=$(mktemp -d /tmp/andv-report-render.XXXXXX)
python3 /mnt/c/Users/doan.van.an/.agents/skills/docx/scripts/office/soffice.py \
  --headless --convert-to pdf --outdir "$render_dir" docs/report/report.docx
pdfinfo "$render_dir/report.pdf"
pdftoppm -jpeg -r 100 "$render_dir/report.pdf" "$render_dir/page"
```

Phải kiểm tra trang bìa, trang mục lục, các trang có bảng/hình và trang tài liệu tham khảo. Không chấp nhận clipping, overlap, ảnh hỏng, footer sai vị trí hoặc field bị biến thành văn bản tĩnh.
