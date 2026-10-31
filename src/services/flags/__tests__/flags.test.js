import { FLAGS, isEnabled, parseBuildFlags, resolveFlag, useFlagStore } from '../index';

beforeEach(() => {
  useFlagStore.getState().clearOverrides();
  useFlagStore.setState({ remote: {} });
});

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

describe('server flags', () => {
  const server = (flags) => jest.fn(async () => ({ flags }));

  it('sit between this phone and the build', () => {
    const remote = { liveMode: false };
    expect(resolveFlag('liveMode', { remote, build: { liveMode: true } })).toEqual({
      value: false,
      source: 'remote',
    });
    expect(resolveFlag('liveMode', { overrides: { liveMode: true }, remote })).toEqual({
      value: true,
      source: 'device',
    });
  });

  it('are fetched, cleaned of names this app does not know, and kept for the next start', async () => {
    const request = server({ liveMode: false, futureFeature: true, visionPhotos: 'off' });
    await useFlagStore.getState().refreshRemote({ request });
    expect(request).toHaveBeenCalledWith('/v1/flags');
    expect(useFlagStore.getState().remote).toEqual({ liveMode: false });
    expect(isEnabled('liveMode')).toBe(false);

    useFlagStore.setState({ remote: {} });
    await useFlagStore.getState().load({ request: null });
    expect(isEnabled('liveMode')).toBe(false);
  });

  it('keep the last ones when the server cannot be reached', async () => {
    await useFlagStore.getState().refreshRemote({ request: server({ runOfShowCues: false }) });
    await useFlagStore.getState().refreshRemote({
      request: jest.fn(async () => {
        throw new Error('offline');
      }),
    });
    expect(useFlagStore.getState().remote).toEqual({ runOfShowCues: false });
  });

  it('are skipped without an account server', async () => {
    await useFlagStore.getState().refreshRemote({ request: null });
    expect(useFlagStore.getState().remote).toEqual({});
  });
});
