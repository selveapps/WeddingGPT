import React from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useWeddingStore } from '@/store';
import { createWedding } from '@/models';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { VisionScreen } from '../VisionScreen';
import { VISION_FIELD } from '../lib/visionConstants';

const library = 'file:///library/lanterns.jpg';
const ideas = () => useWeddingStore.getState().wedding[VISION_FIELD] ?? [];
const images = (tree) => tree.root.findAllByType(Image);
const type = (tree, label, text) =>
  act(async () =>
    tree.root
      .find((n) => n.props.label === label && typeof n.props.onChangeText === 'function')
      .props.onChangeText(text)
  );

beforeEach(() => {
  jest.clearAllMocks();
  global.__files.clear();
  global.__files.add(library);
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
  ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: library, fileName: 'lanterns.jpg', width: 1600, height: 1200 }],
  });
});

describe('Vision board photos', () => {
  it('saves an idea with a photo and shows it', async () => {
    const tree = await renderWithProviders(<VisionScreen />);
    await type(tree, 'Idea', 'Lanterns along the path');
    await press(tree, 'Add a photo');
    expect(images(tree)).toHaveLength(1);

    await press(tree, 'Save idea');
    const [idea] = ideas();
    expect(idea.photo).toEqual({ key: expect.stringMatching(/^photo_\w+\.jpg$/), width: 1600, height: 1200 });
    expect(images(tree)).toHaveLength(1);
    expect(images(tree)[0].props.accessibilityLabel).toBe('Photo: Lanterns along the path');
    expect(shownTexts(tree)).toContain('1 ideas · 1 photos · 0 pinned');
  });

  it('deletes the photo with its idea', async () => {
    const tree = await renderWithProviders(<VisionScreen />);
    await type(tree, 'Idea', 'Lanterns');
    await press(tree, 'Add a photo');
    await press(tree, 'Save idea');
    const { key } = ideas()[0].photo;

    await press(tree, 'Remove idea Lanterns');
    expect(ideas()).toEqual([]);
    expect([...global.__files].some((uri) => uri.endsWith(key))).toBe(false);
  });

  it("says when an idea's photo is on the other phone", async () => {
    useWeddingStore.getState().updateWedding({
      [VISION_FIELD]: [
        {
          id: 'idea_1',
          title: 'Marigold arch',
          category: 'flowers',
          moods: [],
          note: '',
          photo: { key: 'photo_01J00000000000000000000000.jpg', width: 1, height: 1 },
        },
      ],
    });
    const tree = await renderWithProviders(<VisionScreen />);
    expect(images(tree)).toHaveLength(0);
    expect(shownTexts(tree)).toContain('The photo for this idea is on the phone that added it.');
  });

  it('asks for access when it was refused', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    const tree = await renderWithProviders(<VisionScreen />);
    await press(tree, 'Add a photo');
    expect(shownTexts(tree)).toContain('Allow photo access for WeddingGPT in Settings to add photos.');
  });
});
