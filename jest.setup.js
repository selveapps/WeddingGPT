/**
 * Global Jest setup.
 *
 * AsyncStorage has no native module under Jest, so anything that imports a
 * store would crash on load. The package ships an in-memory mock for exactly
 * this.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// SecureStore is native-only too. An in-memory map stands in for the Keychain.
jest.mock('expo-secure-store', () => {
  const items = new Map();
  return {
    getItemAsync: jest.fn(async (key) => (items.has(key) ? items.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      items.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      items.delete(key);
    }),
  };
});

// The phone's calendar is native-only; tests that use it mock it in detail.
jest.mock('expo-calendar/legacy', () => ({
  EntityTypes: { EVENT: 'event' },
  requestCalendarPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getDefaultCalendarAsync: jest.fn(async () => null),
  getCalendarsAsync: jest.fn(async () => []),
  getEventAsync: jest.fn(async () => null),
  createEventAsync: jest.fn(async () => 'event-id'),
  updateEventAsync: jest.fn(async () => {}),
}));

// Reanimated and Worklets need a native runtime; their own mocks make
// animated components render synchronously in component tests.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
