local function meta_text(meta, key)
  local value = meta[key]
  if value == nil then return "" end
  return pandoc.utils.stringify(value)
end

local function styled_para(style, text)
  return pandoc.Div(
    {pandoc.Para({pandoc.Str(text)})},
    pandoc.Attr("", {}, { ["custom-style"] = style })
  )
end

function Pandoc(doc)
  local meta = doc.meta
  local cover_title = meta_text(meta, "title")

  local function transform_div(el)
    if el.classes:includes("markdown-only") then
      return {}
    end

    if el.classes:includes("report-cover") then
      local blocks = {}
      local logo = meta_text(meta, "cover-logo")
      if logo ~= "" then
        local image = pandoc.Image({pandoc.Str("Logo HUST")}, logo, "")
        blocks[#blocks + 1] = pandoc.Div(
          {pandoc.Para({image})},
          pandoc.Attr("", {}, { ["custom-style"] = "CoverLogo" })
        )
      end
      blocks[#blocks + 1] = styled_para("CoverTitle", cover_title)
      for _, item in ipairs({
        {"Tên Học Viên:", "student-name"},
        {"Mã số học viên:", "student-id"},
        {"Mã học phần:", "course-code"},
        {"Giảng viên:", "lecturer"},
      }) do
        blocks[#blocks + 1] = styled_para("CoverInfo", item[1] .. "\t" .. meta_text(meta, item[2]))
      end
      blocks[#blocks + 1] = styled_para("CoverPlaceYear", meta_text(meta, "place-year"))
      return blocks
    end

    if el.classes:includes("word-contents") then
      return pandoc.RawBlock("openxml", [[
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent>
<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Mục lục</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="TableofFigures"/></w:pPr><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">TOC \o &quot;1-3&quot; \h \z \u</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p>
</w:sdtContent></w:sdt>
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Figures"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent>
<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Danh mục bảng biểu</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="TableofFigures"/></w:pPr><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">TOC \h \z \c &quot;Bảng&quot;</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p>
</w:sdtContent></w:sdt>
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Figures"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent>
<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Danh mục hình vẽ</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="TableofFigures"/></w:pPr><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">TOC \h \z \c &quot;Hình&quot;</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p>
</w:sdtContent></w:sdt>]])
    end
  end

  local function remove_legacy_toc(el)
    if el.format == "openxml" and el.text:match("TOC") then
      return {}
    end
  end

  doc.meta.title = nil
  return doc:walk({Div = transform_div, RawBlock = remove_legacy_toc})
end
