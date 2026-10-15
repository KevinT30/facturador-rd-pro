import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CrudPage } from "@/components/crud-page";

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  rnc_cedula: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .refine((s) => /^(\d{9}|\d{11})$/.test(s), "Debe tener 9 dígitos (RNC) u 11 dígitos (Cédula)"),
  cuenta_contable: z.string().trim().max(50, "Máximo 50 caracteres"),
});

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · FacturaPro" },
      { name: "description", content: "Gestión de clientes con RNC o Cédula y cuenta contable." },
      { property: "og:title", content: "Clientes · FacturaPro" },
      { property: "og:description", content: "Gestión de clientes con RNC o Cédula y cuenta contable." },
    ],
  }),
  component: () => (
    <CrudPage
      table="clientes"
      title="Clientes"
      singular="Cliente"
      description="Empresas y personas a las que se les factura."
      schema={schema}
      searchKeys={["nombre", "rnc_cedula", "cuenta_contable"]}
      defaults={{ nombre: "", rnc_cedula: "", cuenta_contable: "" }}
      fields={[
        { key: "nombre", label: "Nombre comercial o Razón social" },
        { key: "rnc_cedula", label: "RNC o Cédula", placeholder: "9 u 11 dígitos", inputMode: "numeric" },
        { key: "cuenta_contable", label: "Cuenta contable", placeholder: "Ej: 1101-001" },
      ]}
      columns={[
        { key: "nombre", label: "Nombre / Razón social" },
        {
          key: "rnc_cedula",
          label: "RNC / Cédula",
          className: "font-mono text-sm whitespace-nowrap",
          render: (r) => {
            const v = String(r.rnc_cedula);
            return v.length === 11 ? `${v.slice(0, 3)}-${v.slice(3, 10)}-${v.slice(10)}` : v;
          },
        },
        { key: "cuenta_contable", label: "Cuenta contable" },
      ]}
    />
  ),
});
