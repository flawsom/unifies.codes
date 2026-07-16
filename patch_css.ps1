$ErrorActionPreference = 'Stop'
$p = 'src/index.css'
$t = [System.IO.File]::ReadAllText($p)

$append = @"

/* ---------- Revision & skip modal ---------- */
.revision-modal {
  @apply fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8;
  background: rgb(var(--bg) / 0.7);
  backdrop-filter: blur(2px);
}
.revision-modal__card {
  @apply w-full max-w-2xl border-2 border-fg bg-surface shadow-hard;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.revision-modal__head {
  @apply flex items-start justify-between gap-4 border-b-2 border-line p-4 sm:p-5;
}
.revision-modal__body {
  @apply overflow-y-auto p-4 sm:p-5;
}
.revision-modal__foot {
  @apply border-t-2 border-line p-4 sm:p-5;
}
.revision-group { @apply mb-6 last:mb-0; }
.revision-group__title {
  @apply mb-2 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide text-muted;
}
.revision-list { @apply list-none; }
.revision-row {
  @apply flex items-center justify-between gap-4 border-b border-line py-2;
}
.revision-row__label {
  @apply flex-1 text-left text-sm font-medium text-fg hover:text-accent hover:underline;
  text-align: left;
}
.revision-row__skip { @apply shrink-0; }
.revision-row__skip--locked { @apply italic; }
.revision-row__confirm {
  @apply flex shrink-0 items-center gap-2;
}

/* ---------- Small buttons ---------- */
.btn-sm {
  @apply border-2 border-fg bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg transition-colors hover:bg-fg hover:text-bg;
}
.btn-danger-sm {
  @apply border-2 border-fg bg-fg px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-danger hover:border-danger;
}

/* ---------- Alerts ---------- */
.alert-warn {
  @apply border-2 border-fg bg-warn/15 p-3 text-fg;
}
.alert-info {
  @apply border-2 border-line bg-elevated p-3 text-fg;
}
"@

[System.IO.File]::WriteAllText($p, $t + $append)
Write-Host 'index.css appended'
