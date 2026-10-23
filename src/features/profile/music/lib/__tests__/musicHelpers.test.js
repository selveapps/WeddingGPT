import { filterMusic, normaliseMusicItem, summariseMusic, validateMusicItem } from '../musicHelpers';

describe('music helpers', () => {
  it('validates song details and normalizes titles', () => {
    expect(validateMusicItem({ title: 'Song', kind: 'request', status: 'queued' }).isValid).toBe(true);
    expect(normaliseMusicItem({ title: ' Song ' }).title).toBe('Song');
    expect(validateMusicItem({ title: '', kind: 'other' }).isValid).toBe(false);
  });
  it('searches metadata and summarizes request types', () => {
    const songs = [
      { title: 'First', artist: 'A', kind: 'request', status: 'played' },
      { title: 'Skip', kind: 'do-not-play', status: 'queued' },
    ];
    expect(filterMusic(songs, 'all', 'first')).toHaveLength(1);
    expect(summariseMusic(songs)).toMatchObject({ requests: 1, doNotPlay: 1, played: 1 });
  });
});
