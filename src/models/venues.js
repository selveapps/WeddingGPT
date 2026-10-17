/**
 * Famous wedding venues, by US metro area.
 *
 * There is no venue directory behind the app, so this is a short, hand-picked
 * list of long-established, widely known places that host weddings in each big
 * metro - the ones couples there tend to have heard of. It is a starting point
 * for inspiration, not a booking guarantee: every entry opens a map search so
 * the couple lands on the real listing (reviews, photos, hours, website), and
 * the UI says to check availability directly.
 *
 * A metro matches on its main city or any of its `aliases` (well-known
 * neighbourhoods and nearby cities), narrowed by state when one is given, so
 * "Brooklyn, NY" and "Santa Monica, CA" both find their metro. `states` lists
 * every state a metro spans (Jersey City is New York's, Arlington, VA is DC's).
 *
 * Anywhere without a curated list still gets `VENUE_STYLES` - map searches for
 * kinds of venue ("barn wedding venues near ...") that work in any town.
 */

const METROS = [
  {
    key: 'nyc',
    name: 'New York City',
    state: 'NY',
    states: ['NY', 'NJ'],
    aliases: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'long island city', 'jersey city', 'hoboken'],
    venues: [
      { name: 'The Plaza Hotel', area: 'Midtown Manhattan', style: 'Landmark hotel', blurb: 'Gilded ballrooms on Fifth Avenue, hosting weddings since 1907.' },
      { name: 'New York Public Library', area: 'Midtown Manhattan', style: 'Historic landmark', blurb: 'Beaux-Arts halls of the Stephen A. Schwarzman Building.' },
      { name: 'Cipriani 42nd Street', area: 'Midtown Manhattan', style: 'Grand hall', blurb: 'A former bank hall with soaring marble columns.' },
      { name: 'Brooklyn Botanic Garden', area: 'Brooklyn', style: 'Garden', blurb: 'Glass conservatory and gardens in Prospect Heights.' },
      { name: 'The Foundry', area: 'Long Island City', style: 'Industrial', blurb: 'A restored 1800s metal works with a vine-covered courtyard.' },
    ],
  },
  {
    key: 'la',
    name: 'Los Angeles',
    state: 'CA',
    aliases: ['los angeles', 'la', 'santa monica', 'beverly hills', 'pasadena', 'west hollywood', 'hollywood', 'burbank', 'glendale', 'long beach', 'malibu', 'culver city'],
    venues: [
      { name: 'Hotel Bel-Air', area: 'Bel Air', style: 'Luxury hotel', blurb: 'Swan Lake and lush gardens tucked into the hills.' },
      { name: 'Greystone Mansion', area: 'Beverly Hills', style: 'Historic estate', blurb: 'A Tudor mansion and formal gardens above the city.' },
      { name: 'The Ebell of Los Angeles', area: 'Mid-Wilshire', style: 'Historic club', blurb: 'A 1927 Italian Renaissance clubhouse and courtyard.' },
      { name: 'Vibiana', area: 'Downtown LA', style: 'Historic cathedral', blurb: 'A restored 1876 cathedral turned event space.' },
    ],
  },
  {
    key: 'chicago',
    name: 'Chicago',
    state: 'IL',
    aliases: ['chicago', 'evanston', 'oak park', 'lisle', 'naperville'],
    venues: [
      { name: 'Chicago Cultural Center', area: 'The Loop', style: 'Historic landmark', blurb: 'Preston Bradley Hall, under a vast Tiffany glass dome.' },
      { name: 'The Drake Hotel', area: 'Gold Coast', style: 'Landmark hotel', blurb: 'Classic 1920s ballrooms on the lakefront.' },
      { name: 'Galleria Marchetti', area: 'West Town', style: 'Old-world courtyard', blurb: 'Italian-inspired rooms around a cobblestone courtyard.' },
      { name: 'The Morton Arboretum', area: 'Lisle', style: 'Garden', blurb: 'Hundreds of acres of trees and gardens west of the city.' },
    ],
  },
  {
    key: 'sf',
    name: 'San Francisco',
    state: 'CA',
    aliases: ['san francisco', 'sf', 'oakland', 'berkeley', 'sausalito', 'presidio'],
    venues: [
      { name: 'San Francisco City Hall', area: 'Civic Center', style: 'Iconic landmark', blurb: 'The grand rotunda staircase - a classic for ceremonies.' },
      { name: 'Palace of Fine Arts', area: 'Marina District', style: 'Landmark', blurb: 'A Roman-style rotunda and lagoon from the 1915 expo.' },
      { name: 'Fairmont San Francisco', area: 'Nob Hill', style: 'Landmark hotel', blurb: 'Grand ballrooms with sweeping city views.' },
      { name: 'Golden Gate Club', area: 'The Presidio', style: 'Historic', blurb: 'Views of the Golden Gate Bridge from the Presidio.' },
    ],
  },
  {
    key: 'austin',
    name: 'Austin',
    state: 'TX',
    aliases: ['austin', 'round rock', 'dripping springs', 'lakeway'],
    venues: [
      { name: 'Laguna Gloria', area: 'West Austin', style: 'Garden estate', blurb: 'A lakeside Italianate villa and gardens.' },
      { name: 'The Driskill', area: 'Downtown', style: 'Landmark hotel', blurb: "Austin's grand 1886 hotel on Sixth Street." },
      { name: 'Barr Mansion', area: 'East Austin', style: 'Historic estate', blurb: 'An 1898 mansion with an artisan ballroom.' },
      { name: 'Umlauf Sculpture Garden', area: 'Zilker', style: 'Garden', blurb: 'A wooded sculpture garden near Zilker Park.' },
    ],
  },
  {
    key: 'dallas',
    name: 'Dallas',
    state: 'TX',
    aliases: ['dallas', 'fort worth', 'plano', 'irving', 'arlington', 'frisco'],
    venues: [
      { name: 'Arlington Hall at Lee Park', area: 'Uptown', style: 'Historic', blurb: 'A Southern colonial hall set in a leafy park.' },
      { name: 'The Adolphus', area: 'Downtown', style: 'Landmark hotel', blurb: 'An ornate Beaux-Arts hotel from 1912.' },
      { name: 'Dallas Arboretum and Botanical Garden', area: 'White Rock Lake', style: 'Garden', blurb: 'Acres of gardens on the shore of White Rock Lake.' },
    ],
  },
  {
    key: 'houston',
    name: 'Houston',
    state: 'TX',
    aliases: ['houston', 'the woodlands', 'sugar land', 'katy'],
    venues: [
      { name: 'The Corinthian', area: 'Downtown', style: 'Historic', blurb: 'A former bank hall with soaring ceilings and columns.' },
      { name: 'The Bell Tower on 34th', area: 'Oak Forest', style: 'Chapel and ballroom', blurb: 'A European-style chapel and ballroom.' },
      { name: 'The Astorian', area: 'Near Downtown', style: 'Industrial', blurb: 'A modern industrial space with skyline views.' },
    ],
  },
  {
    key: 'miami',
    name: 'Miami',
    state: 'FL',
    aliases: ['miami', 'miami beach', 'coral gables', 'coconut grove', 'key biscayne', 'fort lauderdale'],
    venues: [
      { name: 'Vizcaya Museum and Gardens', area: 'Coconut Grove', style: 'Historic estate', blurb: 'An Italian Renaissance-style villa on Biscayne Bay.' },
      { name: 'The Biltmore Hotel', area: 'Coral Gables', style: 'Landmark hotel', blurb: 'A 1926 Mediterranean-style hotel and courtyards.' },
      { name: 'Fontainebleau Miami Beach', area: 'Miami Beach', style: 'Oceanfront resort', blurb: 'The iconic oceanfront resort.' },
      { name: 'Fairchild Tropical Botanic Garden', area: 'Coral Gables', style: 'Garden', blurb: 'Tropical gardens, palms and lakes.' },
    ],
  },
  {
    key: 'seattle',
    name: 'Seattle',
    state: 'WA',
    aliases: ['seattle', 'bellevue', 'kirkland', 'redmond', 'woodinville', 'tacoma'],
    venues: [
      { name: 'Chihuly Garden and Glass', area: 'Seattle Center', style: 'Art garden', blurb: 'A glass art garden beneath the Space Needle.' },
      { name: 'Fairmont Olympic Hotel', area: 'Downtown', style: 'Landmark hotel', blurb: 'A 1924 Italian Renaissance hotel.' },
      { name: 'Sodo Park', area: 'SoDo', style: 'Industrial', blurb: 'A converted warehouse with exposed brick and beams.' },
    ],
  },
  {
    key: 'boston',
    name: 'Boston',
    state: 'MA',
    aliases: ['boston', 'cambridge', 'somerville', 'brookline'],
    venues: [
      { name: 'Boston Public Library', area: 'Back Bay', style: 'Historic landmark', blurb: 'The McKim Building, its courtyard and grand halls.' },
      { name: 'Fairmont Copley Plaza', area: 'Back Bay', style: 'Landmark hotel', blurb: 'Gilded 1912 ballrooms on Copley Square.' },
      { name: 'Museum of Fine Arts, Boston', area: 'Fenway', style: 'Museum', blurb: 'Galleries and a glass-roofed courtyard.' },
      { name: 'The State Room', area: 'Financial District', style: 'Skyline views', blurb: 'Panoramic views over the harbor and city.' },
    ],
  },
  {
    key: 'nashville',
    name: 'Nashville',
    state: 'TN',
    aliases: ['nashville', 'franklin', 'brentwood'],
    venues: [
      { name: 'Cheekwood Estate and Gardens', area: 'Belle Meade', style: 'Garden estate', blurb: 'A Georgian mansion amid acres of gardens.' },
      { name: 'Union Station Hotel', area: 'Downtown', style: 'Historic', blurb: 'A Romanesque 1900 railway station with a vaulted lobby.' },
      { name: 'The Hermitage Hotel', area: 'Downtown', style: 'Landmark hotel', blurb: "Nashville's 1910 Beaux-Arts grand hotel." },
      { name: 'Belmont Mansion', area: 'Belmont', style: 'Historic', blurb: 'An Italianate mansion from the 1850s.' },
    ],
  },
  {
    key: 'denver',
    name: 'Denver',
    state: 'CO',
    aliases: ['denver', 'boulder', 'aurora', 'lakewood', 'golden'],
    venues: [
      { name: 'Denver Botanic Gardens', area: 'Cheesman Park', style: 'Garden', blurb: 'Themed gardens in the heart of the city.' },
      { name: 'The Brown Palace Hotel and Spa', area: 'Downtown', style: 'Landmark hotel', blurb: 'A grand atrium hotel, open since 1892.' },
      { name: 'Mile High Station', area: 'Near Downtown', style: 'Industrial', blurb: 'A converted early-1900s ironworks.' },
    ],
  },
  {
    key: 'atlanta',
    name: 'Atlanta',
    state: 'GA',
    aliases: ['atlanta', 'decatur', 'marietta', 'buckhead', 'alpharetta'],
    venues: [
      { name: 'Atlanta Botanical Garden', area: 'Midtown', style: 'Garden', blurb: 'Gardens and conservatories next to Piedmont Park.' },
      { name: 'The Fox Theatre', area: 'Midtown', style: 'Historic theater', blurb: 'A 1929 movie palace with the Egyptian Ballroom.' },
      { name: 'The Biltmore Ballrooms', area: 'Midtown', style: 'Historic ballroom', blurb: 'Georgian Revival ballrooms from the 1920s.' },
    ],
  },
  {
    key: 'dc',
    name: 'Washington, DC',
    state: 'DC',
    states: ['DC', 'VA', 'MD'],
    aliases: ['washington', 'washington dc', 'dc', 'georgetown', 'arlington', 'alexandria', 'bethesda'],
    venues: [
      { name: 'National Building Museum', area: 'Penn Quarter', style: 'Historic landmark', blurb: 'The Great Hall, with its giant Corinthian columns.' },
      { name: 'Willard InterContinental', area: 'Downtown', style: 'Landmark hotel', blurb: 'A historic hotel steps from the White House.' },
      { name: 'Dumbarton House', area: 'Georgetown', style: 'Historic', blurb: 'A Federal-period house and gardens.' },
    ],
  },
  {
    key: 'charleston',
    name: 'Charleston',
    state: 'SC',
    aliases: ['charleston', 'mount pleasant', 'kiawah island', 'folly beach'],
    venues: [
      { name: 'Lowndes Grove', area: 'The Peninsula', style: 'Waterfront estate', blurb: 'An 18th-century estate on the Ashley River.' },
      { name: 'William Aiken House', area: 'Downtown', style: 'Historic', blurb: 'An 1807 house and gardens on King Street.' },
      { name: 'The Cedar Room', area: 'East Side', style: 'Historic', blurb: 'A soaring room inside the 1880s Cigar Factory.' },
    ],
  },
  {
    key: 'nola',
    name: 'New Orleans',
    state: 'LA',
    aliases: ['new orleans', 'nola', 'metairie', 'french quarter'],
    venues: [
      { name: 'Race and Religious', area: 'Lower Garden District', style: 'Historic courtyard', blurb: 'Greek Revival houses around lush courtyards.' },
      { name: 'Hotel Monteleone', area: 'French Quarter', style: 'Landmark hotel', blurb: 'A family-run French Quarter hotel since 1886.' },
      { name: 'The Chicory', area: 'Warehouse District', style: 'Industrial', blurb: 'An exposed-brick 1890s warehouse.' },
      { name: 'New Orleans Botanical Garden', area: 'City Park', style: 'Garden', blurb: 'Art deco gardens in City Park.' },
    ],
  },
  {
    key: 'philly',
    name: 'Philadelphia',
    state: 'PA',
    aliases: ['philadelphia', 'philly'],
    venues: [
      { name: 'Philadelphia Museum of Art', area: 'Fairmount', style: 'Museum', blurb: 'The great stair hall at the top of the famous steps.' },
      { name: 'The Franklin Institute', area: 'Logan Square', style: 'Museum', blurb: 'The marble Benjamin Franklin Memorial hall.' },
      { name: 'Curtis Center', area: 'Washington Square', style: 'Historic atrium', blurb: "An atrium beside Tiffany's Dream Garden mosaic." },
    ],
  },
  {
    key: 'sandiego',
    name: 'San Diego',
    state: 'CA',
    aliases: ['san diego', 'la jolla', 'coronado', 'carlsbad', 'del mar'],
    venues: [
      { name: 'Hotel del Coronado', area: 'Coronado', style: 'Beach resort', blurb: 'A Victorian beachfront resort from 1888.' },
      { name: 'The Prado at Balboa Park', area: 'Balboa Park', style: 'Garden and historic', blurb: 'Spanish Revival courtyards in Balboa Park.' },
      { name: 'Scripps Seaside Forum', area: 'La Jolla', style: 'Ocean view', blurb: 'Clifftop lawns over the Pacific.' },
    ],
  },
  {
    key: 'vegas',
    name: 'Las Vegas',
    state: 'NV',
    aliases: ['las vegas', 'vegas', 'henderson'],
    venues: [
      { name: 'Bellagio', area: 'The Strip', style: 'Resort chapels', blurb: 'Wedding chapels at the resort famous for its fountains.' },
      { name: 'Little White Wedding Chapel', area: 'The Strip', style: 'Classic chapel', blurb: 'The famous Las Vegas chapel since 1951.' },
      { name: 'Chapel of the Flowers', area: 'The Strip', style: 'Chapel', blurb: 'Garden chapels with a gazebo and waterfall.' },
    ],
  },
  {
    key: 'phoenix',
    name: 'Phoenix',
    state: 'AZ',
    aliases: ['phoenix', 'scottsdale', 'tempe', 'mesa', 'paradise valley', 'chandler'],
    venues: [
      { name: 'Arizona Biltmore', area: 'Phoenix', style: 'Resort', blurb: 'A 1929 resort with Frank Lloyd Wright-inspired design.' },
      { name: 'Desert Botanical Garden', area: 'Papago Park', style: 'Garden', blurb: 'Saguaros and desert gardens at sunset.' },
      { name: 'Wrigley Mansion', area: 'Phoenix', style: 'Historic estate', blurb: 'A hilltop 1930s mansion with valley views.' },
    ],
  },
  {
    key: 'portland',
    name: 'Portland',
    state: 'OR',
    aliases: ['portland', 'beaverton', 'lake oswego'],
    venues: [
      { name: 'Crystal Ballroom', area: 'Downtown', style: 'Historic ballroom', blurb: 'A 1914 ballroom with its famous floating dance floor.' },
      { name: 'Castaway Portland', area: 'Northwest', style: 'Industrial', blurb: 'An indoor-outdoor space with a fire-pit patio.' },
      { name: 'The Evergreen', area: 'Central Eastside', style: 'Rooftop', blurb: 'A restored building with a city-view rooftop.' },
    ],
  },
  {
    key: 'orlando',
    name: 'Orlando',
    state: 'FL',
    aliases: ['orlando', 'winter park', 'kissimmee', 'lake buena vista'],
    venues: [
      { name: "Disney's Wedding Pavilion", area: 'Walt Disney World', style: 'Fairytale chapel', blurb: "A Victorian glass chapel facing Cinderella Castle." },
      { name: 'Harry P. Leu Gardens', area: 'Orlando', style: 'Garden', blurb: 'Fifty acres of gardens and a historic house.' },
      { name: 'Cypress Grove Estate House', area: 'Orlando', style: 'Historic estate', blurb: 'An estate house on the shore of Lake Jessamine.' },
    ],
  },
];

/**
 * Kinds of venue to search for anywhere. Phrased the way people search, which
 * is what map search ranks well on.
 */
export const VENUE_STYLES = [
  { key: 'top', label: 'Top rated', icon: 'star', term: 'best wedding venues' },
  { key: 'garden', label: 'Gardens and estates', icon: 'vision', term: 'garden wedding venues' },
  { key: 'historic', label: 'Historic mansions', icon: 'home', term: 'historic mansion wedding venues' },
  { key: 'barn', label: 'Barns and farms', icon: 'heart', term: 'barn wedding venues' },
  { key: 'vineyard', label: 'Vineyards', icon: 'sparkle', term: 'vineyard winery wedding venues' },
  { key: 'rooftop', label: 'Rooftops', icon: 'location', term: 'rooftop wedding venues' },
  { key: 'waterfront', label: 'Waterfront', icon: 'location', term: 'waterfront beach wedding venues' },
  { key: 'chapel', label: 'Chapels', icon: 'rings', term: 'wedding chapels' },
];

/** "Austin, TX" -> { city: 'austin', state: 'TX' }. */
function parsePlace(label = '') {
  const [cityPart = '', statePart = ''] = label.split(',').map((part) => part.trim());
  return { city: cityPart.toLowerCase().replace(/\./g, ''), state: statePart.toUpperCase() };
}

/** The curated metro for a place label, or null. */
export function findMetro(label) {
  const { city, state } = parsePlace(label);
  if (!city) return null;
  const candidates = METROS.filter((metro) => metro.aliases.includes(city));
  if (candidates.length === 0) return null;
  // "Portland, ME" should not get Oregon's venues; "Arlington" could be TX or VA.
  if (state.length === 2) {
    return candidates.find((metro) => (metro.states ?? [metro.state]).includes(state)) ?? null;
  }
  return candidates[0];
}

/**
 * Venue recommendations for a place: the curated famous venues when we know
 * the metro, and the style searches everywhere.
 */
export function recommendVenues(label) {
  const place = label?.trim() ?? '';
  if (!place) return { metro: null, venues: [], styles: [] };
  const metro = findMetro(place);
  return {
    metro: metro ? { key: metro.key, name: metro.name } : null,
    venues: metro ? metro.venues.map((venue) => ({ ...venue, key: `${metro.key}:${venue.name}`, metro: metro.name, state: metro.state })) : [],
    styles: VENUE_STYLES,
  };
}

/** Map query for one famous venue. */
export function venueSearchQuery(venue) {
  const state = venue.metro?.endsWith(venue.state) ? null : venue.state;
  const parts = [venue.name, venue.area, venue.metro, state].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

/** Map query for a style of venue near a place. */
export function venueStyleQuery(style, place) {
  const where = place?.trim();
  return where ? `${style.term} near ${where}` : null;
}
