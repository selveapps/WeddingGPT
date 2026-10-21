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
