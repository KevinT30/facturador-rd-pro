import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CrudPage } from "@/components/crud-page";

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Máximo 150 caracteres"),
  comision: z.coerce
    .number({ message: "Porcentaje inválido" })
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100")
    .transform((n) => Math.round(n * 100) / 100),
});

export const Route = createFileRoute("/_authenticated/vendedores")({
  head: () => ({
    meta: [
      { title: "Vendedores · FacturaPro" },
      { name: "description", content: "Vendedores de la empresa y su porcentaje de comisión." },
      { property: "og:title", content: "Vendedores · FacturaPro" },
      { property: "og:description", content: "Vendedores de la empresa y su porcentaje de comisión." },
    ],
  }),
  component: () => (
    <CrudPage
      table="vendedores"
      title="Vendedores"
      singular="Vendedor"
      description="Empleados que realizan ventas y su porciento de comisión."
      schema={schema}
      searchKeys={["nombre"]}
      defaults={{ nombre: "", comision: "0" }}
      fields={[
        { key: "nombre", label: "Nombre" },
        { key: "comision", label: "Porciento de comisión (%)", type: "number", step: "0.01", inputMode: "decimal" },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "comision", label: "Comisión", className: "text-right", render: (r) => `${Number(r.comision)}%` },
      ]}
    />
  ),
});
