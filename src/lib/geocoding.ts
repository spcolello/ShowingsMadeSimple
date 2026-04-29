export type GeocodedAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
};

const knownMockLocations: Record<string, Omit<GeocodedAddress, "address">> = {
  "12010": { city: "Amsterdam", state: "NY", zip: "12010", lat: 42.9387, lng: -74.1882 },
  "33130": { city: "Miami", state: "FL", zip: "33130", lat: 25.765, lng: -80.194 },
  "33131": { city: "Miami", state: "FL", zip: "33131", lat: 25.765, lng: -80.19 },
};

export async function geocodeAddress(rawAddress: string): Promise<GeocodedAddress> {
  const address = rawAddress.trim().replace(/\s+/g, " ");
  const zip = address.match(/\b\d{5}\b/)?.[0] ?? "12010";
  const location = knownMockLocations[zip] ?? knownMockLocations["12010"];
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);

  return {
    address: parts[0] ?? address,
    city: parts[1] ?? location.city,
    state: parts[2]?.slice(0, 2).toUpperCase() ?? location.state,
    zip,
    lat: location.lat,
    lng: location.lng,
  };
}

export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}
