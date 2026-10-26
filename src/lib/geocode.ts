export type VenueCoordinates = {
  lat: number;
  lng: number;
};

const geocodeCache = new Map<string, Promise<VenueCoordinates | null>>();

export function geocodeVenue(
  venue: string,
  prefecture?: string,
): Promise<VenueCoordinates | null> {
  const address = [venue.trim(), prefecture?.trim(), "Japan"].filter(Boolean).join(", ");
  const key = address.toLocaleLowerCase("ja-JP");
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const request = new Promise<VenueCoordinates | null>((resolve, reject) => {
    new window.google.maps.Geocoder().geocode({ address }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
        resolve(null);
        return;
      }
      if (status !== window.google.maps.GeocoderStatus.OK || !results?.[0]) {
        reject(new Error(`Google Maps could not geocode this venue (${status}).`));
        return;
      }

      const location = results[0].geometry.location;
      resolve({ lat: location.lat(), lng: location.lng() });
    });
  }).catch((error: unknown) => {
    geocodeCache.delete(key);
    throw error;
  });

  geocodeCache.set(key, request);
  return request;
}
