$ErrorActionPreference = 'Stop'
$p = 'src/App.jsx'
$t = [System.IO.File]::ReadAllText($p)
$CRLF = [char]13 + [char]10

# Remove the later declaration (lines 127-128)
$oldLate = '  const [checked, setChecked] = useState({});' + $CRLF + '  const [checkedAt, setCheckedAt] = useState({});' + $CRLF
if ($t.Contains($oldLate)) { $t = $t.Replace($oldLate, ''); Write-Host 'removed late decl' } else { Write-Host 'NO MATCH late decl' }

# Add early declaration after skipped line
$oldEarly = '  const [skipped, setSkipped] = useState({}); // revision skips: id -> true' + $CRLF
$newEarly = '  const [skipped, setSkipped] = useState({}); // revision skips: id -> true' + $CRLF + '  const [checked, setChecked] = useState({});' + $CRLF + '  const [checkedAt, setCheckedAt] = useState({});' + $CRLF
if ($t.Contains($oldEarly)) { $t = $t.Replace($oldEarly, $newEarly); Write-Host 'added early decl' } else { Write-Host 'NO MATCH early decl' }

[System.IO.File]::WriteAllText($p, $t)

# sanity: count occurrences of checked decl
$c = ([regex]::Matches($t, 'const \[checked, setChecked\]')).Count
Write-Host ("checked decls now: $c")
