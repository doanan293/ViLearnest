import zipfile
import os
import sys
import re
import argparse
from copy import deepcopy
from xml.etree import ElementTree as ET

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{W_NS}}}"
XML_NS = "http://www.w3.org/XML/1998/namespace"

ET.register_namespace("w", W_NS)
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
ET.register_namespace("r", DOC_REL_NS)


def _w(tag):
    return f"{W}{tag}"


def _paragraph_text(paragraph):
    return "".join(node.text or "" for node in paragraph.findall(f".//{_w('t')}"))


def _contains_field_result(paragraph):
    return (
        paragraph.find(f".//{_w('instrText')}") is not None
        or paragraph.find(f".//{_w('fldChar')}") is not None
        or paragraph.find(f".//{_w('fldSimple')}") is not None
    )


def _run_with_text(text, preserve_space=True):
    run = ET.Element(_w("r"))
    text_node = ET.SubElement(run, _w("t"))
    if preserve_space:
        text_node.set(f"{{{XML_NS}}}space", "preserve")
    text_node.text = text
    return run


def _simple_field(instruction, result):
    field = ET.Element(_w("fldSimple"))
    field.set(_w("instr"), instruction)
    field.append(_run_with_text(result, preserve_space=False))
    return field


def _get_or_add(parent, tag, insert_at=None):
    child = parent.find(f"./{_w(tag)}")
    if child is not None:
        return child

    child = ET.Element(_w(tag))
    if insert_at is None:
        parent.append(child)
    else:
        parent.insert(insert_at, child)
    return child


def _get_or_add_spacing(parent):
    child = parent.find(f"./{_w('spacing')}")
    if child is not None:
        return child
    child = ET.Element(_w("spacing"))
    for index, existing in enumerate(list(parent)):
        if existing.tag == _w("pPrChange"):
            parent.insert(index, child)
            return child
    parent.append(child)
    return child


def _normalize_spacing_order(ppr, spacing):
    children = list(ppr)
    index = children.index(spacing)
    target = len(children)
    for marker in ("sectPr", "jc", "ind", "contextualSpacing", "outlineLvl", "divId", "cnfStyle", "rPr", "pPrChange"):
        for candidate_index, child in enumerate(children):
            if child.tag == _w(marker):
                target = min(target, candidate_index)
                break
    if index != target:
        ppr.remove(spacing)
        ppr.insert(target, spacing)


def _normalize_paragraph_property_order(root):
    order = [
        "pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl",
        "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens",
        "kinsoku", "wordWrap", "overflowPunct", "topLinePunct", "autoSpaceDE", "autoSpaceDN",
        "bidi", "adjustRightInd", "snapToGrid", "spacing", "ind", "contextualSpacing",
        "mirrorIndents", "suppressOverlap", "jc", "textDirection", "textAlignment",
        "textboxTightWrap", "outlineLvl", "divId", "cnfStyle", "rPr", "sectPr", "pPrChange",
    ]
    for ppr in root.findall(f".//{_w('pPr')}"):
        ppr[:] = sorted(
            list(ppr),
            key=lambda child: order.index(child.tag.split("}")[-1])
            if child.tag.split("}")[-1] in order
            else len(order),
        )


def _remove_compatibility_ignorable(root):
    # ElementTree drops unused namespace declarations when serializing. Keeping
    # LibreOffice's mc:Ignorable tokens would therefore leave undeclared prefixes.
    root.attrib.pop(f"{{{MC_NS}}}Ignorable", None)


def _remove_bookmarks(root):
    bookmark_tags = {_w("bookmarkStart"), _w("bookmarkEnd")}
    for parent in root.iter():
        for child in list(parent):
            if child.tag in bookmark_tags:
                name = child.get(_w("name")) or ""
                if name.startswith("_Toc") or name.startswith("hinh") or name.startswith("bang"):
                    continue
                parent.remove(child)


def _unwrap_toc_fields(root):
    for paragraph in root.findall(f".//{_w('p')}"):
        for index, child in enumerate(list(paragraph)):
            if child.tag != _w("r"):
                continue

            run_children = list(child)
            if len(run_children) != 1 or run_children[0].tag != _w("fldSimple"):
                continue

            field = run_children[0]
            instr = field.get(_w("instr")) or ""
            if not instr.startswith("TOC "):
                continue

            child.remove(field)
            paragraph.remove(child)
            paragraph.insert(index, field)

    for field in root.findall(f".//{_w('fldSimple')}"):
        instr = field.get(_w("instr")) or ""
        if instr.startswith("TOC ") and _w("dirty") in field.attrib:
            del field.attrib[_w("dirty")]


def _add_caption_sequence_fields(root):
    caption_pattern = re.compile(r"^(Bảng|Hình)\s+(\d+)\.(.*)$")
    for paragraph in root.findall(f".//{_w('p')}"):
        if _contains_field_result(paragraph):
            continue

        text = _paragraph_text(paragraph)
        match = caption_pattern.match(text)
        if not match:
            continue

        label, number, suffix = match.groups()
        pstyle = paragraph.find(f"./{_w('pPr')}/{_w('pStyle')}")
        if pstyle is None:
            pPr = _get_or_add(paragraph, "pPr", 0)
            pstyle = ET.SubElement(pPr, _w("pStyle"))
        pstyle.set(_w("val"), "TableCaption" if label == "Bảng" else "ImageCaption")

        paragraph_properties = paragraph.find(f"./{_w('pPr')}")
        for child in list(paragraph):
            if child is not paragraph_properties:
                paragraph.remove(child)

        paragraph.append(_run_with_text(f"{label} "))
        paragraph.append(_simple_field(rf"SEQ {label} \* ARABIC", number))
        paragraph.append(_run_with_text(f".{suffix}"))


def _enforce_page_margins(root):
    # A4 Portrait: Top/Bottom 2cm, Left 3cm, Right 1.5cm.
    body = root.find(f"./{_w('body')}")
    if body is None:
        return

    sectPr = _get_or_add(body, "sectPr")
    pgSz = _get_or_add(sectPr, "pgSz")
    pgSz.set(_w("w"), "11906")
    pgSz.set(_w("h"), "16838")

    pgMar = _get_or_add(sectPr, "pgMar")
    pgMar.set(_w("top"), "1134")
    pgMar.set(_w("bottom"), "1134")
    pgMar.set(_w("left"), "1701")
    pgMar.set(_w("right"), "850")
    pgMar.set(_w("header"), "0")
    pgMar.set(_w("footer"), "0")
    pgMar.set(_w("gutter"), "0")


def _enforce_global_font_and_paragraphs(root):
    # Times New Roman for all runs
    for run in root.findall(f".//{_w('r')}"):
        rPr = _get_or_add(run, "rPr", 0)
        rFonts = _get_or_add(rPr, "rFonts", 0)
        rFonts.set(_w("ascii"), "Times New Roman")
        rFonts.set(_w("hAnsi"), "Times New Roman")
        rFonts.set(_w("cs"), "Times New Roman")

    # Every paragraph uses 1.5 line spacing and 6pt before/after.
    for paragraph in root.findall(f".//{_w('p')}"):
        pPr = paragraph.find(f"./{_w('pPr')}")
        pstyle = pPr.find(f"./{_w('pStyle')}") if pPr is not None else None
        style_val = pstyle.get(_w("val")) if pstyle is not None else ""
        if pPr is None:
            pPr = _get_or_add(paragraph, "pPr", 0)
        spacing = _get_or_add_spacing(pPr)
        for attr, value in (("before", "120"), ("after", "120"), ("line", "360"), ("lineRule", "auto"), ("beforeAutospacing", "0"), ("afterAutospacing", "0")):
            spacing.set(_w(attr), value)
        _normalize_spacing_order(pPr, spacing)
        if style_val not in {"Title", "Heading1", "Heading2", "Heading3", "TOCHeading", "CoverLogo", "CoverTitle", "CoverInfo", "CoverPlaceYear"} and not style_val.startswith("Heading"):
            jc = _get_or_add(pPr, "jc")
            jc.set(_w("val"), "both")
            for run in paragraph.findall(f".//{_w('r')}"):
                rPr = _get_or_add(run, "rPr", 0)
                for tag in ("sz", "szCs"):
                    _get_or_add(rPr, tag).set(_w("val"), "26")


def _table_borders():
    borders = ET.Element(_w("tblBorders"))
    for tag in ("top", "left", "bottom", "right", "insideH", "insideV"):
        border = ET.SubElement(borders, _w(tag))
        border.set(_w("val"), "single")
        border.set(_w("sz"), "4")
        border.set(_w("space"), "0")
        border.set(_w("color"), "auto")
    return borders


def _format_dynamic_tables(root):
    # Total printable width = A4 minus 3cm left and 1.5cm right = 9355 dxa.
    TOTAL_WIDTH = 9355

    tables = root.findall(f".//{_w('tbl')}")
    for table in tables:
        tblPr = _get_or_add(table, "tblPr", 0)

        # Add borders if missing
        if tblPr.find(f"./{_w('tblBorders')}") is None:
            insert_at = 0
            for index, child in enumerate(list(tblPr)):
                if child.tag == _w("tblStyle"):
                    insert_at = index + 1
                    break
            tblPr.insert(insert_at, deepcopy(_table_borders()))

        # Set 100% table width (9072 dxa)
        tblW = _get_or_add(tblPr, "tblW")
        properties_order = ["tblStyle", "tblpPr", "tblOverlap", "bidiVisual", "tblStyleRowBandSize", "tblStyleColBandSize", "tblW", "jc", "tblCellSpacing", "tblInd", "tblBorders", "shd", "tblLayout", "tblCellMar", "tblLook", "tblCaption", "tblDescription", "tblPrChange"]
        tblPr[:] = sorted(list(tblPr), key=lambda child: properties_order.index(child.tag.split("}")[-1]) if child.tag.split("}")[-1] in properties_order else len(properties_order))
        tblW.set(_w("w"), str(TOTAL_WIDTH))
        tblW.set(_w("type"), "dxa")

        # Table content remains left-aligned even though ordinary body text is justified.
        for paragraph in table.findall(f".//{_w('p')}"):
            pPr = _get_or_add(paragraph, "pPr", 0)
            jc = _get_or_add(pPr, "jc")
            jc.set(_w("val"), "left")

        # Table font size: 13pt (sz=26), matching ordinary report text.
        for run in table.findall(f".//{_w('r')}"):
            rPr = _get_or_add(run, "rPr", 0)
            sz = _get_or_add(rPr, "sz")
            sz.set(_w("val"), "26")
            szCs = _get_or_add(rPr, "szCs")
            szCs.set(_w("val"), "26")

        # Dynamic Grid Columns if grid is empty or mismatching
        grid = table.find(f"./{_w('tblGrid')}")
        rows = table.findall(f"./{_w('tr')}")
        if rows:
            first_row_cells = rows[0].findall(f"./{_w('tc')}")
            col_count = len(first_row_cells)
            if col_count > 0:
                col_width = TOTAL_WIDTH // col_count
                if grid is None:
                    grid = ET.Element(_w("tblGrid"))
                    table.insert(1 if tblPr is not None else 0, grid)
                else:
                    for child in list(grid):
                        grid.remove(child)

                for _ in range(col_count):
                    col = ET.SubElement(grid, _w("gridCol"))
                    col.set(_w("w"), str(col_width))

                # Update cell widths
                for row in rows:
                    cells = row.findall(f"./{_w('tc')}")
                    for cell in cells:
                        tcPr = _get_or_add(cell, "tcPr", 0)
                        tcW = _get_or_add(tcPr, "tcW", 0)
                        tcW.set(_w("w"), str(col_width))
                        tcW.set(_w("type"), "dxa")


def _style_paragraph(paragraph, *, alignment="center", size="26", before="120", after="120"):
    ppr = _get_or_add(paragraph, "pPr", 0)
    spacing = _get_or_add_spacing(ppr)
    for attr, value in (
        ("before", before),
        ("after", after),
        ("line", "360"),
        ("lineRule", "auto"),
        ("beforeAutospacing", "0"),
        ("afterAutospacing", "0"),
    ):
        spacing.set(_w(attr), value)
    _normalize_spacing_order(ppr, spacing)
    _get_or_add(ppr, "jc").set(_w("val"), alignment)
    for run in paragraph.findall(f".//{_w('r')}"):
        rpr = _get_or_add(run, "rPr", 0)
        for tag in ("sz", "szCs"):
            _get_or_add(rpr, tag).set(_w("val"), size)


def _cover_info_table(info_paragraphs):
    table = ET.Element(_w("tbl"))
    tblpr = ET.SubElement(table, _w("tblPr"))
    ET.SubElement(tblpr, _w("tblStyle"), {_w("val"): "TableNormal"})
    ET.SubElement(tblpr, _w("tblW"), {_w("w"): "7200", _w("type"): "dxa"})
    ET.SubElement(tblpr, _w("jc"), {_w("val"): "center"})
    borders = ET.SubElement(tblpr, _w("tblBorders"))
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        ET.SubElement(
            borders,
            _w(edge),
            {_w("val"): "nil", _w("sz"): "0", _w("space"): "0", _w("color"): "auto"},
        )
    grid = ET.SubElement(table, _w("tblGrid"))
    ET.SubElement(grid, _w("gridCol"), {_w("w"): "2467"})
    ET.SubElement(grid, _w("gridCol"), {_w("w"): "4733"})

    for info in info_paragraphs:
        label, _, value = _paragraph_text(info).partition("\t")
        row = ET.SubElement(table, _w("tr"))
        rowpr = ET.SubElement(row, _w("trPr"))
        ET.SubElement(rowpr, _w("trHeight"), {_w("val"): "600"})
        for text, width in ((label, "2467"), (value, "4733")):
            cell = ET.SubElement(row, _w("tc"))
            cellpr = ET.SubElement(cell, _w("tcPr"))
            ET.SubElement(cellpr, _w("tcW"), {_w("w"): width, _w("type"): "dxa"})
            cell_borders = ET.SubElement(cellpr, _w("tcBorders"))
            for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
                ET.SubElement(
                    cell_borders,
                    _w(edge),
                    {
                        _w("val"): "nil",
                        _w("sz"): "0",
                        _w("space"): "0",
                        _w("color"): "auto",
                    },
                )
            paragraph = ET.SubElement(cell, _w("p"))
            paragraph.append(_run_with_text(text, preserve_space=False))
            _style_paragraph(paragraph, alignment="left")
    return table


def _format_cover(root):
    """Reproduce the approved cover layout from semantic Cover* paragraph styles."""
    body = root.find(f"./{_w('body')}")
    if body is None:
        return

    styled = {}
    info_paragraphs = []
    for paragraph in body.findall(f"./{_w('p')}"):
        style = paragraph.find(f"./{_w('pPr')}/{_w('pStyle')}")
        style_name = style.get(_w("val")) if style is not None else ""
        if style_name == "CoverInfo":
            info_paragraphs.append(paragraph)
        elif style_name.startswith("Cover"):
            styled[style_name] = paragraph

    logo = styled.get("CoverLogo")
    title = styled.get("CoverTitle")
    place_year = styled.get("CoverPlaceYear")
    if logo is None or title is None or place_year is None or not info_paragraphs:
        return

    _style_paragraph(logo)
    # Match the approved cover image size: 4.67 x 4.05 inches.
    for extent in logo.findall(f".//{{{WP_NS}}}extent"):
        extent.set("cx", "4267200")
        extent.set("cy", "3699400")
    for extent in logo.findall(f".//{{{A_NS}}}xfrm/{{{A_NS}}}ext"):
        extent.set("cx", "4267200")
        extent.set("cy", "3699400")

    _style_paragraph(title, size="52")
    _style_paragraph(place_year)

    title_index = list(body).index(title)
    spacer_after_title = ET.Element(_w("p"))
    _style_paragraph(spacer_after_title)
    body.insert(title_index + 1, spacer_after_title)

    table = _cover_info_table(info_paragraphs)
    info_index = min(list(body).index(paragraph) for paragraph in info_paragraphs)
    for paragraph in info_paragraphs:
        body.remove(paragraph)
    body.insert(info_index, table)

    place_index = list(body).index(place_year)
    for _ in range(3):
        spacer = ET.Element(_w("p"))
        _style_paragraph(spacer)
        body.insert(place_index, spacer)
        place_index += 1


def _add_page_break_after_word_indexes(root):
    body = root.find(f"./{_w('body')}")
    if body is None:
        return

    children = list(body)
    index_positions = [
        index for index, child in enumerate(children) if child.tag == _w("sdt")
    ]
    if not index_positions:
        return

    for child in children[index_positions[-1] + 1 :]:
        if child.tag != _w("p") or not _paragraph_text(child).strip():
            continue
        ppr = _get_or_add(child, "pPr", 0)
        _get_or_add(ppr, "pageBreakBefore")
        return


def _enable_automatic_field_updates(settings_xml):
    # Fields are finalized by update_fields.ps1 after pagination. Asking Word to
    # update them again while opening can cache every entry as page 1.
    root = ET.Element(_w("settings"))
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _process_numbering_xml(data):
    root = ET.fromstring(data)
    for nsid in root.findall(f".//{_w('nsid')}"):
        value = nsid.get(_w("val")) or ""
        if len(value) < 8:
            nsid.set(_w("val"), (value + "00000000")[:8])
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _process_styles_xml(data):
    root = ET.fromstring(data)
    _remove_compatibility_ignorable(root)
    doc_defaults = _get_or_add(root, "docDefaults", 0)
    rpr_default = _get_or_add(doc_defaults, "rPrDefault", 0)
    rpr = _get_or_add(rpr_default, "rPr", 0)
    for tag in ("sz", "szCs"):
        size = _get_or_add(rpr, tag)
        size.set(_w("val"), "26")
    default_ppr = root.find(f"./{_w('docDefaults')}/{_w('pPrDefault')}/{_w('pPr')}")
    if default_ppr is not None:
        spacing = _get_or_add_spacing(default_ppr)
        for attr, value in (("before", "120"), ("after", "120"), ("line", "360"), ("lineRule", "auto"), ("beforeAutospacing", "0"), ("afterAutospacing", "0")):
            spacing.set(_w(attr), value)
        _normalize_spacing_order(default_ppr, spacing)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _process_notes_xml(data):
    root = ET.fromstring(data)
    _remove_compatibility_ignorable(root)
    _enforce_global_font_and_paragraphs(root)
    _normalize_paragraph_property_order(root)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _process_footer_xml(data):
    root = ET.fromstring(data)
    _remove_compatibility_ignorable(root)
    _enforce_global_font_and_paragraphs(root)
    for paragraph in root.findall(f".//{_w('p')}"):
        _get_or_add(_get_or_add(paragraph, "pPr", 0), "jc").set(_w("val"), "center")
    _normalize_paragraph_property_order(root)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _footer_xml():
    root = ET.Element(_w("ftr"))
    paragraph = ET.SubElement(root, _w("p"))
    ppr = ET.SubElement(paragraph, _w("pPr"))
    ET.SubElement(ppr, _w("jc"), {_w("val"): "center"})
    paragraph.append(_simple_field("PAGE", "1"))
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _add_footer_and_sections(document_xml, rels_xml, content_types_xml, footer_xml):
    root = ET.fromstring(document_xml)
    body = root.find(f"./{_w('body')}")
    if body is None:
        return document_xml, rels_xml, content_types_xml, footer_xml
    paragraphs = body.findall(f"./{_w('p')}")
    last_cover = None
    for paragraph in paragraphs:
        style = paragraph.find(f"./{_w('pPr')}/{_w('pStyle')}")
        if style is not None and style.get(_w("val")) == "CoverPlaceYear":
            last_cover = paragraph
            break
    if last_cover is not None:
        ppr = _get_or_add(last_cover, "pPr", 0)
        cover_sect = ppr.find(f"./{_w('sectPr')}")
        if cover_sect is None:
            cover_sect = ET.SubElement(ppr, _w("sectPr"))
        _get_or_add(cover_sect, "type").set(_w("val"), "nextPage")
        page_size = _get_or_add(cover_sect, "pgSz")
        page_size.attrib.update({_w("w"): "11906", _w("h"): "16838"})
        page_margins = _get_or_add(cover_sect, "pgMar")
        page_margins.attrib.update({_w("top"): "1134", _w("bottom"): "1134", _w("left"): "1701", _w("right"): "850", _w("header"): "0", _w("footer"): "0", _w("gutter"): "0"})
        borders = _get_or_add(cover_sect, "pgBorders")
        borders.attrib.update({_w("display"): "firstPage", _w("offsetFrom"): "page"})
        for edge in ("top", "left", "bottom", "right"):
            border = _get_or_add(borders, edge)
            border.attrib.update({_w("val"): "single", _w("sz"): "4", _w("space"): "24", _w("color"): "auto"})

    final_sect = body.find(f"./{_w('sectPr')}")
    if final_sect is None:
        final_sect = ET.SubElement(body, _w("sectPr"))
    pgnum = _get_or_add(final_sect, "pgNumType")
    pgnum.set(_w("start"), "1")

    rels = ET.fromstring(rels_xml)
    existing = [rel for rel in rels if rel.get("Type", "").endswith("/footer")]
    if existing:
        rel_id = existing[0].get("Id")
    else:
        rel_ids = {rel.get("Id") for rel in rels}
        n = 1
        rel_id = f"rId{n}"
        while rel_id in rel_ids:
            n += 1
            rel_id = f"rId{n}"
        ET.SubElement(rels, f"{{{PKG_REL_NS}}}Relationship", {"Id": rel_id, "Type": f"{DOC_REL_NS}/footer", "Target": "footer1.xml"})
    footer_ref = final_sect.find(f"./{_w('footerReference')}")
    if footer_ref is None:
        footer_ref = ET.Element(_w("footerReference"), {_w("type"): "default", f"{{{DOC_REL_NS}}}id": rel_id})
        final_sect.append(footer_ref)
    order = ["headerReference", "footerReference", "footnotePr", "endnotePr", "type", "pgSz", "pgMar", "paperSrc", "pgBorders", "lnNumType", "pgNumType", "cols", "formProt", "vAlign", "noEndnotes", "titlePg", "textDirection", "bidi", "rtlGutter", "docGrid", "printerSettings", "sectPrChange"]
    ordered = sorted(list(final_sect), key=lambda child: order.index(child.tag.split("}")[-1]) if child.tag.split("}")[-1] in order else len(order))
    final_sect[:] = ordered

    cts = ET.fromstring(content_types_xml)
    if not any(node.get("PartName") == "/word/footer1.xml" for node in cts):
        ET.SubElement(cts, f"{{{CT_NS}}}Override", {"PartName": "/word/footer1.xml", "ContentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"})
    if not any(node.tag == f"{{{CT_NS}}}Default" and node.get("Extension") == "png" for node in cts):
        png_default = ET.Element(f"{{{CT_NS}}}Default", {"Extension": "png", "ContentType": "image/png"})
        insert_at = len(cts)
        for index, node in enumerate(list(cts)):
            if node.tag == f"{{{CT_NS}}}Override":
                insert_at = index
                break
        cts.insert(insert_at, png_default)
    ET.register_namespace("", PKG_REL_NS)
    serialized_rels = ET.tostring(rels, encoding="utf-8", xml_declaration=True)
    ET.register_namespace("", CT_NS)
    serialized_content_types = ET.tostring(cts, encoding="utf-8", xml_declaration=True)
    return (
        ET.tostring(root, encoding="utf-8", xml_declaration=True),
        serialized_rels,
        serialized_content_types,
        footer_xml or _footer_xml(),
    )


def _process_document_xml(data):
    root = ET.fromstring(data)
    _remove_compatibility_ignorable(root)
    _remove_bookmarks(root)
    _unwrap_toc_fields(root)
    _add_caption_sequence_fields(root)
    _enforce_page_margins(root)
    _enforce_global_font_and_paragraphs(root)
    _format_dynamic_tables(root)
    _format_cover(root)
    _add_page_break_after_word_indexes(root)
    _normalize_paragraph_property_order(root)
    body = root.find(f"./{_w('body')}")
    if body is not None:
        for sect in body.findall(f"./{_w('sectPr')}") + root.findall(f".//{_w('pPr')}/{_w('sectPr')}"):
            order = ["headerReference", "footerReference", "footnotePr", "endnotePr", "type", "pgSz", "pgMar", "paperSrc", "pgBorders", "lnNumType", "pgNumType", "cols", "formProt", "vAlign", "noEndnotes", "titlePg", "textDirection", "bidi", "rtlGutter", "docGrid", "printerSettings", "sectPrChange"]
            sect[:] = sorted(list(sect), key=lambda child: order.index(child.tag.split("}")[-1]) if child.tag.split("}")[-1] in order else len(order))
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def post_process(docx_path):
    if not os.path.exists(docx_path):
        print(f"Lỗi: Không tìm thấy tệp {docx_path}")
        sys.exit(1)

    temp_path = docx_path + ".tmp"

    with zipfile.ZipFile(docx_path, "r") as yin:
        files = {item.filename: yin.read(item.filename) for item in yin.infolist()}
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as yout:
            for item in yin.infolist():
                data = files[item.filename]
                if item.filename == "word/document.xml":
                    data = _process_document_xml(data)
                elif item.filename == "word/styles.xml":
                    data = _process_styles_xml(data)
                elif item.filename in {"word/footnotes.xml", "word/endnotes.xml"}:
                    data = _process_notes_xml(data)
                elif item.filename.startswith("word/footer") and item.filename.endswith(".xml"):
                    data = _process_footer_xml(data)
                elif item.filename == "word/settings.xml":
                    data = _enable_automatic_field_updates(data)
                elif item.filename == "word/numbering.xml":
                    data = _process_numbering_xml(data)
                files[item.filename] = data
            if "word/document.xml" in files and "word/_rels/document.xml.rels" in files and "[Content_Types].xml" in files:
                files["word/document.xml"], files["word/_rels/document.xml.rels"], files["[Content_Types].xml"], files["word/footer1.xml"] = _add_footer_and_sections(
                    files["word/document.xml"], files["word/_rels/document.xml.rels"], files["[Content_Types].xml"], files.get("word/footer1.xml")
                )
            for item in yin.infolist():
                data = files[item.filename]
                yout.writestr(item, data)
            if "word/footer1.xml" not in yin.namelist():
                yout.writestr("word/footer1.xml", files["word/footer1.xml"])

    os.replace(temp_path, docx_path)
    print(f"Đã hậu xử lý thành công (A4, lề 2-2-3-1.5cm, line 1.5, before/after 6pt): {docx_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chuẩn hóa OOXML cho báo cáo Word")
    parser.add_argument("docx_path")
    arguments = parser.parse_args()
    post_process(arguments.docx_path)
