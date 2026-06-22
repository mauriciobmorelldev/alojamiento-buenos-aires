-- Connexa / Inmobiliaria - diagnostico y limpieza de peso en Supabase
-- Ejecutar por bloques desde Supabase SQL Editor.
-- Recomendacion: correr primero los SELECT de diagnostico y revisar resultados.

-- 1) Ranking de tablas por tamano total.
select
  schemaname,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_indexes_size(relid)) as index_size,
  n_live_tup,
  n_dead_tup
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc;

-- 2) Peso estimado de columnas donde pueden haberse guardado imagenes/base64.
select
  'platform_settings.theme' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(theme)), 0)) as total_size,
  count(*) as rows
from platform_settings
union all
select
  'platform_settings.home_content' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(home_content)), 0)) as total_size,
  count(*) as rows
from platform_settings
union all
select
  'properties.description' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(description)), 0)) as total_size,
  count(*) as rows
from properties
union all
select
  'properties.videos' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(videos)), 0)) as total_size,
  count(*) as rows
from properties
union all
select
  'property_images.url' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(url)), 0)) as total_size,
  count(*) as rows
from property_images
union all
select
  'agents.photo' as source,
  pg_size_pretty(coalesce(sum(pg_column_size(photo)), 0)) as total_size,
  count(*) as rows
from agents;

-- 3) Imagenes embebidas en base64 dentro de property_images.
select
  count(*) as base64_images,
  pg_size_pretty(coalesce(sum(pg_column_size(url)), 0)) as base64_total_size,
  pg_size_pretty(coalesce(avg(pg_column_size(url)), 0)::bigint) as avg_size
from property_images
where url like 'data:image/%';

-- 4) Top 50 imagenes mas pesadas.
select
  id,
  property_id,
  sort_order,
  pg_size_pretty(pg_column_size(url)::bigint) as url_size,
  left(url, 80) as preview
from property_images
order by pg_column_size(url) desc
limit 50;

-- 5) Detectar JSON pesado con data:image en configuracion.
select
  id,
  pg_size_pretty(pg_column_size(theme)::bigint) as theme_size,
  pg_size_pretty(pg_column_size(home_content)::bigint) as home_content_size,
  (theme::text like '%data:image/%') as theme_has_base64,
  (home_content::text like '%data:image/%') as home_content_has_base64
from platform_settings;

-- 6) Logs y OTP antiguos.
select
  'tokko_sync_logs' as table_name,
  count(*) as rows,
  pg_size_pretty(coalesce(sum(pg_column_size(message)), 0)) as message_size
from tokko_sync_logs
union all
select
  'admin_otp_challenges' as table_name,
  count(*) as rows,
  pg_size_pretty(coalesce(sum(pg_column_size(code_hash)), 0)) as message_size
from admin_otp_challenges;

-- 7) Limpieza segura de registros temporales.
-- Descomentar cuando ya se revisaron los SELECT anteriores.
-- delete from admin_otp_challenges where expires_at < now() - interval '1 day';
-- delete from tokko_sync_logs where started_at < now() - interval '30 days';

-- 8) Limpieza de imagenes base64 MUY pesadas.
-- Importante: esto elimina referencias base64 en DB. Hacerlo solo si ya fueron
-- reemplazadas por URLs reales de Supabase Storage/Tokko/externas.
-- delete from property_images
-- where url like 'data:image/%'
--   and pg_column_size(url) > 900000;

-- 9) Limpieza de imagenes huerfanas.
-- delete from property_images pi
-- where not exists (
--   select 1 from properties p where p.id = pi.property_id
-- );

-- 10) Compactacion logica. ANALYZE actualiza estadisticas del planner.
-- VACUUM recupera espacio interno para reutilizar; no siempre baja el numero
-- de storage del proyecto inmediatamente si hubo TOAST/bloat muy grande.
-- Indices recomendados para acelerar catalogo/admin si todavia no existen.
create index if not exists idx_properties_updated_at_desc on properties(updated_at desc);
create index if not exists idx_properties_attributes_gin on properties using gin(attributes);
create index if not exists idx_properties_status_updated_at_desc on properties(status, updated_at desc);
create index if not exists idx_property_images_property_sort_order on property_images(property_id, sort_order);
analyze platform_settings;
analyze properties;
analyze property_images;
analyze agents;
analyze profiles;
analyze leads;
analyze property_metrics;
-- vacuum (analyze) platform_settings;
-- vacuum (analyze) properties;
-- vacuum (analyze) property_images;
-- vacuum (analyze) agents;
-- vacuum (analyze) tokko_sync_logs;
-- vacuum (analyze) admin_otp_challenges;

-- 11) Revisar bloat/dead tuples despues de limpiar.
select
  relname as table_name,
  n_live_tup,
  n_dead_tup,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
order by n_dead_tup desc;
