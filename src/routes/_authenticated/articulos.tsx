import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CrudPage } from "@/components/crud-page";
import { formatRD } from "@/lib/format";

const schema = z.object({
  descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(200, "Máximo 200 caracteres"),
  precio_unitario: z.coerce
    .number({ message: "Precio inválido" })
    .gt(0, "El precio debe ser mayor que 0")
    .max(999999999, "Precio demasiado alto")
    .transform((n) => Math.round(n * 100) / 100),
});

export const Route = createFileRoute("/_authenticated/articulos")({
  head: () => ({
    meta: [
      { title: "Artículos facturables · FacturaPro" },
      { name: "description", content: "Catálogo de artículos facturables con precios en RD$." },
      { property: "og:title", content: "Artículos facturables · FacturaPro" },
      { property: "og:description", content: "Catálogo de artículos facturables con precios en RD$." },
    ],
  }),
  component: () => (
    <CrudPage
      table="articulos"
      title="Artículos facturables"
      singular="Artículo"
      description="Productos y servicios que se pueden incluir en una factura."
      schema={schema}
      searchKeys={["descripcion"]}
      defaults={{ descripcion: "", precio_unitario: "" }}
      fields={[
        { key: "descripcion", label: "Descripción", placeholder: "Ej: Servicio de consultoría" },
        { key: "precio_unitario", label: "Precio unitario (RD$)", type: "number", step: "0.01", inputMode: "decimal" },
      ]}
      columns={[
        { key: "descripcion", label: "Descripción" },
        {
          key: "precio_unitario",
          label: "Precio unitario",
          className: "text-right whitespace-nowrap",
          render: (r) => formatRD(Number(r.precio_unitario)),
        },
      ]}
    />
  ),
});
