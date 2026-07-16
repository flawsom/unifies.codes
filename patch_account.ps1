$ErrorActionPreference = 'Stop'
$p = 'src/components/AccountBar.jsx'
$t = [System.IO.File]::ReadAllText($p)

# 1) Rename button + add class + show error
$oldBtn = '              <button
                className="raw-btn"
                disabled={!authConfigured ? "" : undefined}
                onClick={signInWithGoogle}
                title={authConfigured ? "Sign in with your Google account" : "Supabase keys missing — add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"}
              >
                Sign in with Google
              </button>'
$newBtn = '              <button
                className="raw-btn"
                disabled={!authConfigured ? "" : undefined}
                onClick={() => signInWithGoogle()}
                title={authConfigured ? "Continue with your Google account" : "Supabase keys missing — add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"}
              >
                Continue with Google
              </button>
              {authError && (
                <p className="text-danger text-xs mt-2" role="alert">
                  {authError}
                </p>
              )}'

if ($t.Contains($oldBtn)) { $t = $t.Replace($oldBtn, $newBtn); Write-Host 'AccountBar button: patched' } else { Write-Host 'AccountBar button: NO MATCH' }

# 2) Guest banner wording tweak (optional, keep concise)
$oldGuest = '            <span className="text-xs text-muted">
              Guest mode — saved on this device. Add Supabase keys to enable
              sign-in &amp; sync.
            </span>'
$newGuest = '            <span className="text-xs text-muted">
              Guest mode — your plan is saved on this device only. Continue with
              Google to sync across devices.
            </span>'
if ($t.Contains($oldGuest)) { $t = $t.Replace($oldGuest, $newGuest); Write-Host 'AccountBar guest: patched' } else { Write-Host 'AccountBar guest: NO MATCH' }

[System.IO.File]::WriteAllText($p, $t)
Write-Host 'accountbar done'
