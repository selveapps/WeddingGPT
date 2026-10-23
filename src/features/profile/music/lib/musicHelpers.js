export const MUSIC_FIELD = 'profileWeddingMusic';
export const MUSIC_KINDS = ['request', 'do-not-play'];
export const MUSIC_STATUSES = ['queued', 'approved', 'played'];

export function validateMusicItem(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  if (!title) errors.title = 'Add a song title.';
  else if (title.length > 100) errors.title = 'Keep the title under 100 characters.';
  if (String(values.artist ?? '').length > 80) errors.artist = 'Keep the artist under 80 characters.';
  if (String(values.moment ?? '').length > 60) errors.moment = 'Keep the event moment under 60 characters.';
  if (!MUSIC_KINDS.includes(values.kind)) errors.kind = 'Choose request or do-not-play.';
  if (!MUSIC_STATUSES.includes(values.status)) errors.status = 'Choose a status.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normaliseMusicItem(values = {}) {
  return {
    title: values.title.trim(),
    artist: String(values.artist ?? '').trim(),
    moment: String(values.moment ?? '').trim(),
    kind: MUSIC_KINDS.includes(values.kind) ? values.kind : 'request',
    status: MUSIC_STATUSES.includes(values.status) ? values.status : 'queued',
  };
}

export function filterMusic(records = [], filter = 'all', query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  return records.filter(
    (item) =>
      (filter === 'all' || item.kind === filter) &&
      (!term ||
        [item.title, item.artist, item.moment, item.status].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        ))
  );
}

export function summariseMusic(records = []) {
  return {
    total: records.length,
    requests: records.filter((item) => item.kind === 'request').length,
    doNotPlay: records.filter((item) => item.kind === 'do-not-play').length,
    played: records.filter((item) => item.status === 'played').length,
  };
}
