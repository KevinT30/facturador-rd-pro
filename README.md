# Facturador Rd Pro

Crea una aplicación web completa llamada "FacturaPro", un Sistema de Facturación en español (República Dominicana, moneda RD$, formato de fecha DD/MM/AAAA). Debe ser fácil de usar, con diseño limpio y profesional, responsive, con barra lateral de navegación y tema claro. Usa Supabase (PostgreSQL + Auth) para base de datos y autenticación.



## 1. CONTROL DE ACCESO

- Pantalla de login y registro con email y contraseña (Supabase Auth). Ninguna ruta es accesible sin iniciar sesión.

- Dos roles: "admin" (acceso total, incluida la gestión de usuarios) y "facturador" (puede facturar, consultar y ver reportes, pero no crear ni editar catálogos). Guarda los roles en una tabla separada user_roles y aplica Row Level Security (RLS) en todas las tablas.

- El primer usuario registrado se asigna como admin. Incluye un botón de cerrar sesión y muestra el nombre y rol del usuario en la barra lateral.



## 2. MÓDULOS DE MANTENIMIENTO (CRUD completo)

Cada módulo tiene: tabla con búsqueda y paginación, formulario en modal para crear/editar, validaciones, y cambio de estado Activo/Inactivo. NUNCA se eliminan registros, solo se inactivan, para no dañar facturas históricas. Los identificadores se generan automáticamente (secuenciales). Solo los registros Activos aparecen en los selectores de la factura.



**a) Artículos Facturables**: Identificador, Descripción, Precio Unitario (decimal, > 0), Estado.

**b) Clientes**: Identificador, Nombre Comercial o Razón Social, RNC o Cédula (valida 9 dígitos para RNC u 11 para cédula, y que sea único), Cuenta Contable, Estado.

**c) Condiciones de Pago**: Identificador, Descripción (ej: Al contado, A crédito 30 días, Cheque), Cantidad de Días (0 para contado), Estado. Precarga: Al contado (0), A crédito 15 días, A crédito 30 días, Cheque (0).

**d) Vendedores** (empleados de la empresa): Identificador, Nombre, Porciento de Comisión (0-100), Estado.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://facturador-rd-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b1e74527-c2cf-4f23-8254-281183a8de2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
