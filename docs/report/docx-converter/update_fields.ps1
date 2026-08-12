param(
    [Parameter(Mandatory = $true)]
    [string]$DocxPath
)

$ErrorActionPreference = "Stop"
$localCopy = Join-Path $env:TEMP (([guid]::NewGuid().ToString()) + ".docx")
$word = $null
$document = $null

try {
    # Word cannot reliably edit a DOCX through a WSL UNC path, so work on a
    # Windows-local copy and copy the finalized package back afterwards.
    Copy-Item -LiteralPath $DocxPath -Destination $localCopy

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($localCopy)

    foreach ($contents in $document.TablesOfContents) {
        $contents.Update()
    }
    foreach ($figures in $document.TablesOfFigures) {
        $figures.Update()
    }

    $document.Repaginate()

    foreach ($contents in $document.TablesOfContents) {
        $contents.UpdatePageNumbers()
    }
    foreach ($figures in $document.TablesOfFigures) {
        $figures.UpdatePageNumbers()
    }

    $tocCount = $document.TablesOfContents.Count
    $tofCount = $document.TablesOfFigures.Count
    if ($tocCount -ne 1 -or $tofCount -ne 2) {
        throw "Expected 1 table of contents and 2 tables of figures; found TOC=$tocCount, TOF=$tofCount"
    }

    $pageCount = $document.ComputeStatistics(2)
    $document.Save()
    $document.Close(0)
    $document = $null

    Copy-Item -LiteralPath $localCopy -Destination $DocxPath -Force
    Write-Output "Updated Word fields: TOC=$tocCount, TOF=$tofCount, pages=$pageCount"
}
finally {
    if ($null -ne $document) {
        $document.Close(0)
    }
    if ($null -ne $word) {
        $word.Quit()
        [Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    Remove-Item -LiteralPath $localCopy -Force -ErrorAction SilentlyContinue
}
