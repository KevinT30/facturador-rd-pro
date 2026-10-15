export const formatRD = (n: number) =>
  "RD$ " +
  Number(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Accepts "YYYY-MM-DD" (treated as a calendar date) or a Date/timestamp. */
export const formatFecha = (d: string | Date | null | undefined) => {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

export const toISODate = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

export const todayISO = () => toISODate(new Date());

export const addDaysISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y!, m! - 1, d! + days));
};

export const padId = (id: number) => String(id).padStart(4, "0");

export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
