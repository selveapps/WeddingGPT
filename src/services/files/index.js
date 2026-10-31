import { Platform, Share } from 'react-native';

/**
 * Getting text files in and out of the app.
 *
 * In a browser that means a real download and a real file picker. On a phone
 * there is no shared file system to write to without extra native modules, so
 * export opens the share sheet with the text (mail it, save it to Files, paste
 * it into Sheets) and import is by pasting. Screens check `CAN_PICK_FILES` and
 * offer only what works.
 */

export const CAN_PICK_FILES = Platform.OS === 'web';
export const CAN_DOWNLOAD_FILES = Platform.OS === 'web';
/** Only a browser has a print dialog without a native module. */
export const CAN_PRINT = Platform.OS === 'web';

/**
 * Save `text` as a file. Resolves 'downloaded' (web), 'shared' (native share
 * sheet opened) or 'failed'.
 */
export async function exportTextFile({ filename, text, mimeType = 'text/csv', title }) {
  if (CAN_DOWNLOAD_FILES) {
    try {
      const doc = globalThis.document;
      // The BOM makes Excel read UTF-8 names (José, Zoë) correctly.
      const blob = new Blob(['﻿', text], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = doc.createElement('a');
      link.href = url;
      link.download = filename;
      doc.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return 'downloaded';
    } catch {
      return 'failed';
    }
  }

  try {
    await Share.share({ message: text, title: title ?? filename });
    return 'shared';
  } catch {
    return 'failed';
  }
}

/** Largest file `pickTextFile` will read; a guest list is a few hundred KB at most. */
export const MAX_PICKED_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Let the person choose a text file (web only). Resolves `{ name, text }`,
 * null if they cancelled, or `{ error: 'too_large' | 'unreadable' }`.
 */
export function pickTextFile({ accept = '.csv,text/csv,text/plain' } = {}) {
  if (!CAN_PICK_FILES) return Promise.resolve(null);

  return new Promise((resolve) => {
    const doc = globalThis.document;
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return resolve(null);
      if (file.size > MAX_PICKED_FILE_BYTES) return resolve({ error: 'too_large' });
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: String(reader.result ?? '') });
      reader.onerror = () => resolve({ error: 'unreadable' });
      reader.readAsText(file);
    });
    // Browsers that support it tell us when the dialog is dismissed.
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });

    doc.body.appendChild(input);
    input.click();
  });
}

/** `guest-list-2027-01-04.csv` */
export function datedFilename(stem, extension = 'csv', date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${stem}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.${extension}`;
}

/**
 * Print a page (G3). In a browser the HTML goes to the print dialog, where
 * "Save as PDF" is one of the printers. On a phone there is no print module
 * without a native build, so the share sheet gets `text` instead. Resolves
 * 'printed', 'shared' or 'failed'.
 */
export async function printPage({ html, text, title }) {
  if (CAN_PRINT) {
    try {
      const doc = globalThis.document;
      const frame = doc.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      doc.body.appendChild(frame);
      const page = frame.contentWindow;
      page.document.open();
      page.document.write(html);
      page.document.close();
      page.focus();
      page.print();
      // print() blocks until the dialog closes in every major browser.
      setTimeout(() => frame.remove(), 1000);
      return 'printed';
    } catch {
      return 'failed';
    }
  }

  try {
    await Share.share({ message: text, title });
    return 'shared';
  } catch {
    return 'failed';
  }
}
