$b = [System.IO.File]::ReadAllBytes('src/App.jsx')
Write-Host ("BOM: " + ($b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF))
$txt = [System.IO.File]::ReadAllText('src/App.jsx')
$crlf = ([regex]::Matches($txt, "`r`n")).Count
$lfOnly = ([regex]::Matches($txt, "(?<!\r)\n")).Count
Write-Host ("CRLF: $crlf  LF-only: $lfOnly")
$lines = $txt.Split("`n")
Write-Host ("Line97: [" + $lines[96].TrimEnd() + "]")
Write-Host ("Line98: [" + $lines[97].TrimEnd() + "]")
