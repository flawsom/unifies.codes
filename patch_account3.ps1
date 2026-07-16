$ErrorActionPreference = 'Stop'
$p = 'src/components/AccountBar.jsx'
$t = [System.IO.File]::ReadAllText($p)

$marker = '          Continue with Google' + [char]13 + [char]10 + '        </button>' + [char]13 + [char]10 + '        <span className="hidden md:inline'
$inject = '          Continue with Google' + [char]13 + [char]10 + '        </button>' + [char]13 + [char]10 + '        {authError && (' + [char]13 + [char]10 + '          <p className="text-danger text-xs mt-1" role="alert">' + [char]13 + [char]10 + '            {authError}' + [char]13 + [char]10 + '          </p>' + [char]13 + [char]10 + '        )}' + [char]13 + [char]10 + '        <span className="hidden md:inline'

if ($t.Contains($marker)) { $t = $t.Replace($marker, $inject); Write-Host 'error-inject: patched' } else { Write-Host 'error-inject: NO MATCH' }

[System.IO.File]::WriteAllText($p, $t)
Write-Host 'done'
