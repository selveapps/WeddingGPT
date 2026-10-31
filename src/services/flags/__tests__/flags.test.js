import { FLAGS, isEnabled, parseBuildFlags, resolveFlag, useFlagStore } from '../index';

beforeEach(() => useFlagStore.getState().clearOverrides());

describe('parseBuildFlags', () => {
  it('reads key=value pairs, ignoring case and spaces', () => {
    expect(parseBuildFlags(' LiveMode = OFF , visionPhotos=on,runOfShowCues=0')).toEqual({
      liveMode: false,
      visionPhotos: true,
      runOfShowCues: false,
    });
  });

  it('skips unknown flags and values it cannot read', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBuildFlags('payments=on,liveMode=maybe,,')).toEqual({});
    expect(parseBuildFlags(undefined)).toEqual({});
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe('resolveFlag', () => {
  it('takes a device override, then the build, then the default', () => {
    expect(resolveFlag('liveMode', { overrides: {}, build: {} })).toEqual({
      value: FLAGS.liveMode.defaultValue,
      source: 'default',
    });
    expect(resolveFlag('liveMode', { overrides: {}, build: { liveMode: false } })).toEqual({
      value: false,
      source: 'build',
    });
    expect(resolveFlag('liveMode', { overrides: { liveMode: true }, build: { liveMode: false } })).toEqual({
      value: true,
      source: 'device',
    });
  });

  it('refuses a flag that does not exist, loudly in development', () => {
    expect(() => resolveFlag('teleport')).toThrow('Unknown flag "teleport"');
  });
});

describe('device overrides', () => {
  it('apply at once and come back after a restart', async () => {
    useFlagStore.getState().setOverride('visionPhotos', false);
    expect(isEnabled('visionPhotos')).toBe(false);

    useFlagStore.setState({ overrides: {} });
    expect(isEnabled('visionPhotos')).toBe(true);
    await useFlagStore.getState().load();
    expect(isEnabled('visionPhotos')).toBe(false);
  });

  it('go back to the build with null, and drop anything stale when loaded', async () => {
    useFlagStore.getState().setOverride('liveMode', false);
    useFlagStore.getState().setOverride('liveMode', null);
    expect(useFlagStore.getState().overrides).toEqual({});

    const { storage } = require('../../storage');
    await storage.set('device:flagOverrides', { liveMode: false, removedFlag: true, visionPhotos: 'yes' });
    await useFlagStore.getState().load();
    expect(useFlagStore.getState().overrides).toEqual({ liveMode: false });
  });
});
