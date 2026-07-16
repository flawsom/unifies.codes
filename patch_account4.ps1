$ErrorActionPreference = 'Stop'
$p = 'src/components/AccountBar.jsx'
$t = [System.IO.File]::ReadAllText($p)
$old = 'const { user, profile, authConfigured, signInWithGoogle, signOut } = useAuth();'
$new = 'const { user, profile, authConfigured, signInWithGoogle, signOut, authError } = useAuth();'
if ($t.Contains($old)) { $t = $t.Replace($old, $new); Write-Host 'authError destructured' } else { Write-Host 'NO MATCH for destructure' }
[System.IO.File]::WriteAllText($p, $t)
