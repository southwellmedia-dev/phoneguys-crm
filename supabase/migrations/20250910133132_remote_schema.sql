alter table "public"."appointments" drop constraint "appointments_source_check";

alter table "public"."appointments" drop constraint "appointments_urgency_check";

alter table "public"."customer_devices" drop constraint "customer_devices_condition_check";

alter table "public"."device_models" drop constraint "device_models_device_type_check";

alter table "public"."devices" drop constraint "devices_device_type_check";

alter table "public"."devices" drop constraint "devices_parts_availability_check";

alter table "public"."services" drop constraint "services_category_check";

alter table "public"."services" drop constraint "services_skill_level_check";

alter table "public"."devices" add column "brand" text;

alter table "public"."devices" add column "colors" jsonb default '[]'::jsonb;

alter table "public"."devices" add column "model" text;

alter table "public"."devices" add column "popularity_score" integer default 0;

alter table "public"."devices" add column "release_date" date;

alter table "public"."devices" add column "storage_sizes" jsonb default '[]'::jsonb;

CREATE INDEX idx_devices_popularity ON public.devices USING btree (popularity_score DESC);

CREATE INDEX idx_devices_release_date ON public.devices USING btree (release_date DESC);

alter table "public"."appointments" add constraint "appointments_source_check" CHECK (((source)::text = ANY ((ARRAY['website'::character varying, 'phone'::character varying, 'walk-in'::character varying, 'email'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_source_check";

alter table "public"."appointments" add constraint "appointments_urgency_check" CHECK (((urgency)::text = ANY ((ARRAY['walk-in'::character varying, 'scheduled'::character varying, 'emergency'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_urgency_check";

alter table "public"."customer_devices" add constraint "customer_devices_condition_check" CHECK (((condition)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying, 'broken'::character varying])::text[]))) not valid;

alter table "public"."customer_devices" validate constraint "customer_devices_condition_check";

alter table "public"."device_models" add constraint "device_models_device_type_check" CHECK (((device_type)::text = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."device_models" validate constraint "device_models_device_type_check";

alter table "public"."devices" add constraint "devices_device_type_check" CHECK (((device_type)::text = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'earbuds'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."devices" validate constraint "devices_device_type_check";

alter table "public"."devices" add constraint "devices_parts_availability_check" CHECK (((parts_availability)::text = ANY ((ARRAY['readily_available'::character varying, 'available'::character varying, 'limited'::character varying, 'scarce'::character varying, 'discontinued'::character varying])::text[]))) not valid;

alter table "public"."devices" validate constraint "devices_parts_availability_check";

alter table "public"."services" add constraint "services_category_check" CHECK (((category)::text = ANY ((ARRAY['screen_repair'::character varying, 'battery_replacement'::character varying, 'charging_port'::character varying, 'water_damage'::character varying, 'diagnostic'::character varying, 'software_issue'::character varying, 'camera_repair'::character varying, 'speaker_repair'::character varying, 'button_repair'::character varying, 'motherboard_repair'::character varying, 'data_recovery'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_category_check";

alter table "public"."services" add constraint "services_skill_level_check" CHECK (((skill_level)::text = ANY ((ARRAY['basic'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_skill_level_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_device_brands()
 RETURNS TABLE(brand text, device_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(d.brand, m.name) as brand,
    COUNT(*) as device_count
  FROM devices d
  LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
  WHERE d.is_active = true
  GROUP BY COALESCE(d.brand, m.name)
  ORDER BY COUNT(*) DESC, COALESCE(d.brand, m.name);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_devices(search_query text DEFAULT NULL::text, brand_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, brand text, model text, name text, release_date date, image_url text, colors jsonb, storage_sizes jsonb, popularity_score integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    COALESCE(d.brand, m.name) as brand,
    COALESCE(d.model, d.model_name) as model,
    d.model_name as name,
    d.release_date,
    d.image_url,
    d.colors,
    d.storage_sizes,
    d.popularity_score
  FROM devices d
  LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
  WHERE 
    d.is_active = true
    AND (search_query IS NULL OR (
      d.model_name ILIKE '%' || search_query || '%' OR
      d.model_number ILIKE '%' || search_query || '%' OR
      COALESCE(d.brand, m.name) ILIKE '%' || search_query || '%'
    ))
    AND (brand_filter IS NULL OR COALESCE(d.brand, m.name) = brand_filter)
  ORDER BY 
    d.popularity_score DESC,
    d.release_date DESC NULLS LAST
  LIMIT limit_count;
END;
$function$
;


