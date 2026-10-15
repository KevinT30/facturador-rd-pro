import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CrudPage } from "@/components/crud-page";

const schema = z.object({
  descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(100, "Máximo 100 caracteres"),
  dias: z.coerce
    .number({ message: "Cantidad inválida" })
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(3650, "Máximo 3650 días"),
});

export const Route = createFileRoute("/_authenticated/condiciones")({
  head: () => ({
    meta: [
      { title: "Condiciones de pago · FacturaPro" },
      { name: "description", content: "Condiciones de pago: contado, crédito y cheque." },
      { property: "og:title", content: "Condiciones de pago · FacturaPro" },
      { property: "og:description", content: "Condiciones de pago: contado, crédito y cheque." },
    ],
  }),
  component: () => (
    <CrudPage
      table="condiciones_pago"
      title="Condiciones de pago"
      singular="Condición"
      description="Plazos de pago disponibles al facturar. Usa 0 días para contado."
      schema={schema}
      searchKeys={["descripcion"]}
      defaults={{ descripcion: "", dias: "0" }}
      fields={[
        { key: "descripcion", label: "Descripción", placeholder: "Ej: A crédito 30 días" },
        { key: "dias", label: "Cantidad de días", type: "number", step: "1", inputMode: "numeric" },
      ]}
      columns={[
        { key: "descripcion", label: "Descripción" },
        {
          key: "dias",
          label: "Días",
          className: "text-right",
          render: (r) => (Number(r["dias"]) === 0 ? "Contado" : `${r["dias"]} días`),
        },
      ]}
    />
  ),
});
