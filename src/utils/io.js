// Export / import real progress. No demo data — only the user's actual state.
// Format: { version, startDate, checked, checkedAt, exportedAt }.

export function exportProgress({ startDate, checked, checkedAt }) {
  const payload = {
    version: 1,
    kind: "fde-tracker-progress",
    exportedAt: new Date().toISOString(),
    startDate: startDate || "",
    checked: checked || {},
    checkedAt: checkedAt || {},
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fde-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv({ checked, checkedAt, itemsById }) {
  const header = "id,text,checked,checked_at\n";
  const rows = Object.keys(itemsById || {}).map((id) => {
    const item = itemsById[id];
    const text = (item?.text || "").replace(/"/g, '""');
    const at = checkedAt?.[id] || "";
    return `"${id}","${text}",${checked[id] ? 1 : 0},"${at}"`;
  });
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fde-progress-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse an imported JSON file. Returns null if invalid.
export function parseImport(text) {
  const data = JSON.parse(text);
  if (data.kind !== "fde-tracker-progress") return null;
  return {
    startDate: data.startDate || "",
    checked: data.checked || {},
    checkedAt: data.checkedAt || {},
  };
}
