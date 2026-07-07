---
title: "[Tiêu đề bài báo]"
---

::: {.markdown-only}

# Mục lục
- [[Heading cấp 1 không đánh số]](#heading-cap-1-khong-danh-so)
- [1. [Tên chương 1]](#1-ten-chuong-1)
- [2. [Tên chương 2]](#2-ten-chuong-2)
  - [2.1. [Tên mục 2.1]](#21-ten-muc-21)
  - [2.2. [Tên mục 2.2]](#22-ten-muc-22)
- [3. [Tên chương 3]](#3-ten-chuong-3)
  - [3.1. [Tên mục 3.1]](#31-ten-muc-31)
  - [3.2. [Tên mục 3.2]](#32-ten-muc-32)
  - [3.3. [Tên mục 3.3]](#33-ten-muc-33)
- [4. [Tên chương 4]](#4-ten-chuong-4)
  - [4.1. [Tên mục 4.1]](#41-ten-muc-41)
  - [4.2. [Tên mục 4.2]](#42-ten-muc-42)
- [5. [Tên chương 5]](#5-ten-chuong-5)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

# Danh mục bảng biểu
- [Bảng 1. [Tên bảng 1]](#bang-1)
- [Bảng 2. [Tên bảng 2]](#bang-2)
- [Bảng 3. [Tên bảng 3]](#bang-3)

# Danh mục hình vẽ
- [Hình 1. [Tên hình 1]](#hinh-1)
- [Hình 2. [Tên hình 2]](#hinh-2)

:::
```{=openxml}
<w:p>
  <w:pPr>
    <w:pStyle w:val="TOCHeading"/>
  </w:pPr>
  <w:r>
    <w:t>Mục lục</w:t>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="TableofFigures"/>
  </w:pPr>
  <w:r>
    <w:fldSimple w:instr="TOC \o &quot;1-3&quot; \h \z \u"/>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="TOCHeading"/>
  </w:pPr>
  <w:r>
    <w:t>Danh mục bảng biểu</w:t>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="TableofFigures"/>
  </w:pPr>
  <w:r>
    <w:fldSimple w:instr="TOC \h \z \c &quot;Bảng&quot;"/>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="TOCHeading"/>
  </w:pPr>
  <w:r>
    <w:t>Danh mục hình vẽ</w:t>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="TableofFigures"/>
  </w:pPr>
  <w:r>
    <w:fldSimple w:instr="TOC \h \z \c &quot;Hình&quot;"/>
  </w:r>
</w:p>
```


# [Heading cấp 1 không đánh số]

[Đoạn văn.]


# [Heading cấp 1 không đánh số]

[Đoạn văn.]


# 1. [Tên chương 1]

[Đoạn văn] [1, 2].

[Đoạn văn] [3].

[Đoạn văn.]


# 2. [Tên chương 2]


## 2.1. [Tên mục 2.1]

[Đoạn văn] [4, 5].


## 2.2. [Tên mục 2.2]

[Đoạn văn] [6, 7].


# 3. [Tên chương 3]


## 3.1. [Tên mục 3.1]

[Đoạn văn. Tham chiếu bảng: Bảng 1.]

<a id="bang-1"></a>

Table: Bảng 1. [Tên bảng 1]

[Cột 1] | [Cột 2] | [Cột 3] | [Cột 4] | Giá trị p
--- | --- | --- | --- | ---
[Biến liên tục] | ? [? - ?] | ? [? - ?] | ? [? - ?] | ?
[Biến nhị phân]: Có | ?; ?% | ?; ?% | ?; ?% | ?
[Biến phân loại] | | | | ?
  [Mức 1] | ?; ?% | ?; ?% | ?; ?% |
  [Mức 2] | ?; ?% | ?; ?% | ?; ?% |


## 3.2. [Tên mục 3.2]

[Đoạn văn. Tham chiếu hình: Hình 1.]

<a id="hinh-1"></a>

![Hình 1. [Tên hình 1]](../output/images/[ten_hinh].png){width=5.0in height=4.0in}

[Đoạn văn. Tham chiếu bảng: Bảng 2.]

$$[Công thức nếu cần]$$

<a id="bang-2"></a>

Table: Bảng 2. [Tên bảng 2]

[Cột 1] | [Cột 2] | [Cột 3] | [Cột 4]
--- | --- | --- | ---
[Dòng 1] | [tham_so_1]: ?;<br>[tham_so_2]: ? | [Diễn giải]
[Dòng 2] | [tham_so_1]: ?;<br>[tham_so_2]: ? | [Diễn giải]


## 3.3. [Tên mục 3.3]

[Đoạn văn. Dùng $[công thức inline]$ hoặc display:]

$$[Công thức]$$


# 4. [Tên chương 4]


## 4.1. [Tên mục 4.1]

[Đoạn văn.]


## 4.2. [Tên mục 4.2]

[Đoạn văn. Tham chiếu bảng: Bảng 3 và hình: Hình 2.]

<a id="bang-3"></a>

Table: Bảng 3. [Tên bảng 3]

[Cột 1] | [Cột 2] | [Cột 3] | [Cột 4] | [Cột 5]
--- | --- | --- | --- | ---
[Dòng 1] | ? | ? | ? | ?
[Dòng 2] | ? | ? | ? | ?

<a id="hinh-2"></a>

![Hình 2. [Tên hình 2]](../output/images/[ten_hinh].jpg){width=5.0in height=4.0in}

[Đoạn văn phân tích kết quả.]


# 5. [Tên chương 5]

[Đoạn văn.]


# Tài liệu tham khảo

[1] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[2] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[3] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[4] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[5] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[6] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]

[7] [Tác giả]. [Tiêu đề]. *[Tên tạp chí]*. ([Năm]) [Tập]:[Trang]. doi: [DOI]
