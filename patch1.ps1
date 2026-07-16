$ErrorActionPreference = 'Stop'
$files = @{
  'src/App.jsx' = $true
  'src/components/RevisionView.jsx' = $true
  'src/components/AccountBar.jsx' = $true
}

# ---- 1) App.jsx: exclude checked from activeItems ----
$p = 'src/App.jsx'
$t = [System.IO.File]::ReadAllText($p)
$old1 = "    () => allItems.filter((i) => !skipped[i.id]),`r`n    [allItems, skipped]"
$new1 = "    () => allItems.filter((i) => !skipped[i.id] && !checked[i.id]),`r`n    [allItems, skipped, checked]"
if ($t.Contains($old1)) { $t = $t.Replace($old1, $new1); Write-Host 'App.jsx activeItems: patched' } else { Write-Host 'App.jsx activeItems: NO MATCH' }
[System.IO.File]::WriteAllText($p, $t)
Write-Host 'done app'
