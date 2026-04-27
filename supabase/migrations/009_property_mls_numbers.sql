alter table public.properties
  add column if not exists mls_number text;

create unique index if not exists properties_mls_number_key
on public.properties (mls_number)
where mls_number is not null;

update public.properties set mls_number = 'A11550101' where listing_url = 'https://example.com/listings/88-sw-7th-2101';
update public.properties set mls_number = 'A11550102' where listing_url = 'https://example.com/listings/1300-brickell-bay-2204';
update public.properties set mls_number = 'A11550103' where listing_url = 'https://example.com/listings/1010-brickell-3908';
update public.properties set mls_number = 'A11550104' where listing_url = 'https://example.com/listings/45-sw-9th-3706';
update public.properties set mls_number = 'A11550105' where listing_url = 'https://example.com/listings/801-s-miami-4602';
update public.properties set mls_number = 'A11550106' where listing_url = 'https://example.com/listings/55-sw-9th-3001';
update public.properties set mls_number = 'A11550107' where listing_url = 'https://example.com/listings/1451-brickell-1803';
update public.properties set mls_number = 'A11550108' where listing_url = 'https://example.com/listings/60-sw-13th-2416';
update public.properties set mls_number = 'A11550109' where listing_url = 'https://example.com/listings/200-biscayne-4308';
update public.properties set mls_number = 'A11550110' where listing_url = 'https://example.com/listings/485-brickell-3507';
