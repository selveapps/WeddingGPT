/**
 * Speech & Toast Writer model.
 *
 * Outline templates, drafts, timing estimates, and AI-assisted refinement
 * hooks (content stays local until user opts into AI).
 */

import { createEntity } from './base';

export const SpeechRole = {
  OFFICIANT: 'officiant',
  MAID_OF_HONOR: 'maid_of_honor',
  BEST_MAN: 'best_man',
  PARENT: 'parent',
  COUPLE: 'couple',
  FRIEND: 'friend',
  OTHER: 'other',
};

export const SpeechRoleMeta = {
  [SpeechRole.OFFICIANT]: { label: 'Officiant', emoji: '🎤' },
  [SpeechRole.MAID_OF_HONOR]: { label: 'Maid / Man of Honor', emoji: '💐' },
  [SpeechRole.BEST_MAN]: { label: 'Best Man / Person', emoji: '🥂' },
  [SpeechRole.PARENT]: { label: 'Parent', emoji: '❤️' },
  [SpeechRole.COUPLE]: { label: 'Couple (vows / thank you)', emoji: '💍' },
  [SpeechRole.FRIEND]: { label: 'Friend', emoji: '🤝' },
  [SpeechRole.OTHER]: { label: 'Other', emoji: '✨' },
};

export const SpeechStatus = {
  IDEA: 'idea',
  OUTLINE: 'outline',
  DRAFT: 'draft',
  REHEARSING: 'rehearsing',
  FINAL: 'final',
  DELIVERED: 'delivered',
};

export const SpeechStatusMeta = {
  [SpeechStatus.IDEA]: { label: 'Idea', tone: 'neutral' },
  [SpeechStatus.OUTLINE]: { label: 'Outline', tone: 'info' },
  [SpeechStatus.DRAFT]: { label: 'Draft', tone: 'warning' },
  [SpeechStatus.REHEARSING]: { label: 'Rehearsing', tone: 'info' },
  [SpeechStatus.FINAL]: { label: 'Final', tone: 'success' },
  [SpeechStatus.DELIVERED]: { label: 'Delivered', tone: 'success' },
};

export function createSpeech(partial = {}) {
  return createEntity({
    weddingId: null,
    role: SpeechRole.OTHER,
    speakerName: '',
    speakerGuestId: null,
    title: '',
    status: SpeechStatus.IDEA,
    targetDurationSec: 180, // 3 min default
    outline: [], // array of section strings
    body: '',
    notes: '',
    toneKeywords: [], // heartfelt, humorous, short, etc.
    isPrivate: true, // only speaker + couple
    lastRehearsedAt: null,
    ...partial,
  });
}

export function createSpeechTemplate(partial = {}) {
  return createEntity({
    role: SpeechRole.BEST_MAN,
    title: '',
    description: '',
    sections: [],
    sampleOpening: '',
    sampleClosing: '',
    tips: [],
    ...partial,
  });
}

export function createToastPrompt(partial = {}) {
  return createEntity({
    weddingId: null,
    speechId: null,
    prompt: '',
    response: '',
    createdAt: null,
    ...partial,
  });
}

export function estimateWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateSpeakingSeconds(wordCount, wpm = 130) {
  if (!wordCount) return 0;
  return Math.round((wordCount / wpm) * 60);
}

export function speechReadiness(speech) {
  const words = estimateWordCount(speech?.body);
  const seconds = estimateSpeakingSeconds(words);
  const target = speech?.targetDurationSec || 180;
  const ratio = target > 0 ? seconds / target : 0;
  return {
    wordCount: words,
    estimatedSec: seconds,
    targetSec: target,
    ratio,
    isOver: ratio > 1.15,
    isUnder: ratio < 0.7 && words > 0,
    hasOutline: (speech?.outline || []).length > 0,
    hasBody: words > 20,
  };
}

export function defaultBestManTemplate() {
  return createSpeechTemplate({
    role: SpeechRole.BEST_MAN,
    title: 'Classic Best Man Toast',
    description: 'Warm, lightly humorous, ends with a clear toast.',
    sections: [
      'Thank the hosts and acknowledge the couple',
      'How you know the couple / a short story',
      'What you admire about their relationship',
      'A light joke or affectionate roast (keep it kind)',
      'Wish for their future',
      'Raise a glass – clear toast line',
    ],
    sampleOpening: 'Good evening everyone. For those who don’t know me, I’m…',
    sampleClosing: 'To a lifetime of laughter, adventure, and always choosing each other. Cheers!',
    tips: [
      'Keep under 4 minutes unless asked otherwise',
      'Practice out loud at least twice',
      'Avoid inside jokes that exclude the room',
      'Have a printed backup in case your phone dies',
    ],
  });
}

export function defaultMaidOfHonorTemplate() {
  return createSpeechTemplate({
    role: SpeechRole.MAID_OF_HONOR,
    title: 'Maid / Man of Honor Speech',
    description: 'Heartfelt with one or two personal stories.',
    sections: [
      'Introduction and thanks',
      'Your relationship with the person getting married',
      'When you knew they had found “the one”',
      'A quality you love about the couple together',
      'A wish or piece of advice',
      'Toast',
    ],
    sampleOpening: 'Hi everyone — I’m so honored to stand up here today…',
    sampleClosing: 'Here’s to a marriage as full of joy as this day. Cheers!',
    tips: [
      'One genuine story beats five short ones',
      'It’s okay to get emotional — pause, breathe, continue',
      'Coordinate with the best man so you don’t repeat the same anecdotes',
    ],
  });
}
