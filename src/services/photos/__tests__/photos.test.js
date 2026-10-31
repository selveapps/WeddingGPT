import * as ImagePicker from 'expo-image-picker';

import { photoUri, pickPhoto, prunePhotos, removePhoto } from '../index';

const DAY = 24 * 60 * 60 * 1000;
const library = 'file:///library/IMG_0042.HEIC';

beforeEach(() => {
  jest.clearAllMocks();
  global.__files.clear();
  global.__files.add(library);
  ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: library, fileName: 'IMG_0042.HEIC', width: 3024, height: 4032 }],
  });
});

describe('pickPhoto', () => {
  it("keeps a copy with the wedding's photos", async () => {
    const result = await pickPhoto('wed_1');
    expect(result.status).toBe('picked');
    expect(result.photo).toEqual({
      key: expect.stringMatching(/^photo_\w+\.heic$/),
      width: 3024,
      height: 4032,
    });
    expect(photoUri('wed_1', result.photo.key)).toBe(`file:///documents/vision/wed_1/${result.photo.key}`);
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      quality: 0.7,
    });
  });

  it('says why nothing was kept', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    expect(await pickPhoto('wed_1')).toEqual({ status: 'cancelled' });

    global.__files.clear();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await pickPhoto('wed_1')).toEqual({ status: 'failed' });
    warn.mockRestore();

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
    expect(await pickPhoto('wed_1')).toEqual({ status: 'denied' });
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(2);
  });
});

describe('photoUri and removePhoto', () => {
  it("only find this wedding's photos, and refuse keys that are not photos", async () => {
    const { photo } = await pickPhoto('wed_1');
    expect(photoUri('wed_2', photo.key)).toBeNull();
    expect(photoUri('wed_1', '../secrets.json')).toBeNull();
    expect(removePhoto('wed_1', '../secrets.json')).toBe(false);

    expect(removePhoto('wed_1', photo.key)).toBe(true);
    expect(photoUri('wed_1', photo.key)).toBeNull();
    expect(removePhoto('wed_1', photo.key)).toBe(false);
  });
});

describe('prunePhotos', () => {
  it('deletes unused photos over a day old, and nothing else', async () => {
    const used = (await pickPhoto('wed_1')).photo.key;
    const unused = (await pickPhoto('wed_1')).photo.key;
    const otherWedding = (await pickPhoto('wed_2')).photo.key;

    expect(prunePhotos('wed_1', [used])).toBe(0);
    expect(prunePhotos('wed_1', [used], Date.now() + 2 * DAY)).toBe(1);
    expect(photoUri('wed_1', unused)).toBeNull();
    expect(photoUri('wed_1', used)).not.toBeNull();
    expect(photoUri('wed_2', otherWedding)).not.toBeNull();
  });

  it('does nothing before a wedding is loaded', async () => {
    await pickPhoto(null);
    expect(prunePhotos(null, [], Date.now() + 2 * DAY)).toBe(0);
  });
});
