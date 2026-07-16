$ErrorActionPreference = 'Stop'
$p = 'src/components/AccountBar.jsx'
$t = [System.IO.File]::ReadAllText($p)

# Rename button text
$t = $t.Replace('Sign in with Google', 'Continue with Google')
Write-Host ('rename: ' + ($t.Contains('Continue with Google')))

# Add error display: insert after the button's closing + before the conditional's end.
# Find the line with the button and inject error paragraph right after it.
$marker = '                Continue with Google' + [char]13 + [char]10 + '              </button>'
$inject = $marker + [char]13 + [char]10 + '              {authError && (' + [char]13 + [char]10 + '                <p className="text-danger text-xs mt-2" role="alert">' + [char]13 + [char]10 + '                  {authError}' + [char]13 + [char]10 + '                </p>' + [char]13 + [char]10 + '              )}'
if ($t.Contains($marker)) { $t = $t.Replace($marker, $inject); Write-Host 'error-inject: patched' } else { Write-Host 'error-inject: NO MATCH' }

[System.IO.File]::WriteAllText($p, $t)
Write-Host 'accountbar done'
