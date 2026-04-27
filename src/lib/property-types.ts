export type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mlsNumber: string | null;
  price: number;
  beds: number;
  baths: number;
  lat: number;
  lng: number;
  imageUrl: string | null;
  listingUrl: string | null;
  status: string;
};

export type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mls_number: string | null;
  price: number | string;
  beds: number;
  baths: number | string;
  lat: number | string;
  lng: number | string;
  image_url: string | null;
  listing_url: string | null;
  status: string;
};

export type ShowingRequestInsertResult = {
  id: string;
  propertyId: string;
  requestedTime: string;
  status: string;
};

export function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    mlsNumber: row.mls_number,
    price: Number(row.price),
    beds: row.beds,
    baths: Number(row.baths),
    lat: Number(row.lat),
    lng: Number(row.lng),
    imageUrl: row.image_url,
    listingUrl: row.listing_url,
    status: row.status,
  };
}
