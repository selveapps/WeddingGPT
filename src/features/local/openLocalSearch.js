import { Linking, Platform } from 'react-native';

import { localSearchQuery, venueSearchQuery, venueStyleQuery } from '@/models';
import { analytics, AnalyticsEvents } from '@/services/analytics';

/** Apple Maps on iOS, Google Maps everywhere else - both search by free text. */
export function mapSearchUrl(query) {
  const q = encodeURIComponent(query);
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Open a free-text map search. Resolves to false if the maps app could not be opened. */
export async function openMapQuery(query) {
  if (!query) return false;
  try {
    await Linking.openURL(mapSearchUrl(query));
    return true;
  } catch {
    return false;
  }
}

/** Open one famous venue in maps. */
export function openVenue(venue, source = 'local') {
  analytics.track(AnalyticsEvents.VENUE_SEARCH_OPENED, { kind: 'venue', metro: venue.metro, source });
  return openMapQuery(venueSearchQuery(venue));
}

/** Open a map search for a style of venue ("barn wedding venues") near `city`. */
export function openVenueStyle(style, city, source = 'local') {
  analytics.track(AnalyticsEvents.VENUE_SEARCH_OPENED, { kind: 'style', style: style.key, source });
  return openMapQuery(venueStyleQuery(style, city));
}

/**
 * Open a map search for one vendor category near `city`. Resolves to false
 * when there is nothing to search or the maps app could not be opened, so the
 * caller can show its own toast.
 */
export async function openLocalSearch(categoryKey, city, source = 'local') {
  const query = localSearchQuery(categoryKey, city);
  if (!query) return false;
  analytics.track(AnalyticsEvents.LOCAL_SEARCH_OPENED, { category: categoryKey, source });
  return openMapQuery(query);
}
