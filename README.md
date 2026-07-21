# Alojamiento Buenos Aires

Plataforma Next.js basada en la base Connexa/Inmobiliaria para alquileres
amoblados de mediano plazo en CABA.

## Stack

- Next.js + TypeScript
- Supabase/Postgres
- Panel admin heredado de Connexa
- API routes de Next, sin Laravel ni backend separado

## Rutas principales

- `/`: home editorial con hero cinematográfico, propiedades, editorial y newsletter.
- `/departamentos`: catálogo filtrable.
- `/departamentos/[slug]`: ficha pública de departamento.
- `/vivir-buenos-aires`: índice editorial.
- `/vivir-buenos-aires/[slug]`: artículo/guía.
- `/contacto`: leads de inquilinos, propietarios y consultas generales.
- `/admin`: panel operativo.
- `/admin/editorial`: CMS simple para artículos.

## Supabase

Ejecutar `supabase.sql`. El schema reutiliza las tablas Connexa y suma:

- `editorial_posts`
- `newsletter_subscribers`
- `leads.lead_type`
- `leads.payload`

## Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INMO_STATE_WRITE_SECRET=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
EMAIL_FROM=
TOKKO_API_BASE_URL=
TOKKO_API_KEY=
TOKKO_SYNC_SECRET=
```

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

Si DonWeb no soporta Node persistente para Next.js, usar DonWeb solo como DNS y
desplegar la app en Vercel u otro hosting Node.
