export const formatRD = (n: number) =>
  "RD$ " +
  Number(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatFecha = (d: string | Date) => {
  const x = new Date(d);
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${x.getFullYear()}`;
};

export const padId = (id: number) => String(id).padStart(4, "0");
