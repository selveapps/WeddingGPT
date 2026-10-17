import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Where the couple is, as a place name.
 *
 * The app never stores coordinates - only the city, region and country a
 * reverse geocode returns - because a city is all local recommendations need
 * and it is far less sensitive than a position. Permission is asked for only
 * when someone taps "Use my location", never on launch.
 *
 * Every failure resolves to `{ error }` rather than throwing, with copy that
 * tells the person what to do next (usually: type the city instead).
 */

export const LocationError = {
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
};

const ERROR_COPY = {
  [LocationError.DENIED]: 'Location is turned off for WeddingGPT. Type your city instead.',
  [LocationError.UNAVAILABLE]: 'Could not find where you are. Type your city instead.',
};

export function locationErrorMessage(code) {
  return ERROR_COPY[code] ?? ERROR_COPY[LocationError.UNAVAILABLE];
}

/** "Austin, TX" in the US and Canada, "City, Region" elsewhere, or just the city. */
export function formatPlace({ city, region, isoCountryCode }) {
  if (!city) return region ?? '';
  if (!region || region === city) return city;
  const short = ['US', 'CA'].includes(isoCountryCode) && region.length > 3 ? abbreviate(region) : region;
  return `${city}, ${short}`;
}

/**
 * Look up the current place. Resolves to
 * `{ place: { label, city, region, country } }` or `{ error }`.
 */
export async function getCurrentPlace() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { error: LocationError.DENIED };

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });

    // Reverse geocoding needs a Google key on web, so web stops here.
    if (Platform.OS === 'web') return { error: LocationError.UNAVAILABLE };

    const [match] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    if (!match) return { error: LocationError.UNAVAILABLE };

    const city = match.city ?? match.subregion ?? match.district ?? '';
    const region = match.region ?? '';
    const label = formatPlace({ city, region, isoCountryCode: match.isoCountryCode });
    if (!label) return { error: LocationError.UNAVAILABLE };

    return { place: { label, city, region, country: match.country ?? '' } };
  } catch {
    return { error: LocationError.UNAVAILABLE };
  }
}

const US_STATES = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID',
  Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR',
  Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
  'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
};

function abbreviate(region) {
  return US_STATES[region] ?? region;
}
