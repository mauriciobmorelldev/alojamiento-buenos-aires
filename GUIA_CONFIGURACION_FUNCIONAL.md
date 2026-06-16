# Guia de configuracion funcional

## 1. Supabase

Variables requeridas en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INMO_STATE_WRITE_SECRET=
NEXT_PUBLIC_SITE_URL=
```

Ejecutar `supabase.sql` completo en el SQL Editor de Supabase. Como minimo deben existir:

- `platform_settings.tokko_config`
- `platform_settings.email_config`
- `platform_settings.filter_groups`
- `admin_otp_challenges`
- `tokko_sync_logs`

Verificacion:

```txt
/api/supabase/status
```

Debe devolver `ok: true` y `writeReady: true`.

## 2. Usuario owner

Crear un admin owner en `profiles`.

Campos clave:

- `kind`: `admin`
- `role`: `owner`
- `active`: `true`

El login owner habilita todo el panel. El rol `colaborador` solo gestiona propiedades propias.

## 3. OTP administrador

El login admin usa dos pasos:

1. Email y contrasena.
2. Codigo OTP de 6 digitos.

El OTP:

- expira en 10 minutos.
- se guarda hasheado en `admin_otp_challenges` si Supabase esta configurado.
- usa fallback local solo para desarrollo si falta la tabla.

Configuracion desde:

```txt
/admin/integraciones
```

Opciones de email:

- `Preview sin enviar`: no requiere email empresarial. El codigo OTP aparece en pantalla y logs.
- `Enviar con Resend`: requiere API key de Resend y remitente verificado.

## 4. Email transaccional

Configurable desde `/admin/integraciones`.

Campos:

- `Modo`: `Preview sin enviar` o `Enviar con Resend`.
- `Remitente`: ejemplo `Connexa <no-reply@tudominio.com>`.
- `API key Resend`: solo si se usa Resend.

Variables opcionales si se prefiere configurar por `.env.local`:

```env
RESEND_API_KEY=
EMAIL_FROM=
```

Prueba:

- ir a `/admin/integraciones`
- tocar `Probar` en Email transaccional.

## 5. WhatsApp

Configurable desde:

```txt
/admin/branding
```

Campos:

- `WhatsApp del sitio`: usar formato internacional sin signos. Ejemplo: `5491123456789`.
- `Mensaje inicial`: texto que abre WhatsApp.

Impacto:

- globo flotante del front.
- consulta general desde la web.
- no expone telefonos privados de colaboradores si no se cargan publicamente.

## 6. Tokko

Configurable desde:

```txt
/admin/integraciones
```

Base URL principal si ya importo propiedades correctamente:

```txt
https://www.tokkobroker.com/api/v1
```

Base URL alternativa del feed para portales documentado por Tokko:

```txt
https://www.tokkobroker.com/portals/simple_portal/api/v1/freeportals/
```

No cambiar la URL si la actual ya trae propiedades reales. Usar la alternativa solo si Tokko/soporte confirma que esa API key corresponde al feed de portales.

Campos:

- `Base URL API`
- `API key`
- `Secreto para cron/webhook`

Botones:

- `Probar API`: consulta una muestra y no modifica propiedades.
- `Sincronizar ahora`: importa/actualiza propiedades en Connexa.

La sincronizacion:

- lee desde Tokko.
- no escribe nada en Tokko.
- pagina de a 100 propiedades.
- soporta mas de 100 propiedades.
- guarda logs en `tokko_sync_logs`.

## 7. Automatizacion Tokko

Tokko no confirma webhook en la pagina `/property`; la documentacion recomienda consulta incremental.

Opcion recomendada:

Crear un cron que haga:

```http
POST /api/tokko/sync
x-tokko-sync-secret: TU_SECRETO
```

Frecuencia sugerida:

- cada 5 minutos si necesitan alta frescura.
- cada 15 minutos para uso normal.

## 8. Sesion admin

La sesion admin:

- usa `sessionStorage`, no `localStorage`.
- borra sesiones legacy en cache local.
- expira por inactividad a los 10 minutos.
- expira de forma absoluta a las 8 horas.

Si un admin queda logueado de antes, cerrar sesion o limpiar storage del navegador.

## 9. Checklist de prueba

1. `/api/supabase/status` responde OK.
2. Owner puede entrar con email, password y OTP.
3. Email en modo preview muestra codigo OTP.
4. Email con Resend envia prueba.
5. WhatsApp abre con numero correcto.
6. Tokko `Probar API` responde OK.
7. Tokko `Sincronizar ahora` importa propiedades.
8. Una propiedad importada muestra descripcion, imagenes, precio y ficha.
9. Dashboard actualiza metricas con leads/favoritos/vistas reales.
