-- Add locations column to trips table
alter table trips
add column if not exists locations jsonb default '[]'::jsonb;

-- Migrate existing location data if column exists
do $$
begin
    if exists(select 1 from information_schema.columns where table_name = 'trips' and column_name = 'location') then
        -- Update locations array with existing location value if present
        execute 'update trips set locations = jsonb_build_array(location) where location is not null and (locations is null or locations = ''[]''::jsonb)';
    end if;
end $$;

-- Drop location column if it exists (commented out for safety compatibility, uncomment to enforce)
-- alter table trips drop column if exists location;
