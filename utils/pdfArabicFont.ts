import { jsPDF } from 'jspdf';
import { ArabicShaper } from 'arabic-persian-reshaper';

export const ARABIC_FONT_NAME = 'Amiri';
const ARABIC_FONT_FILE = 'Amiri-Regular.ttf';
const FONT_URL = '/fonts/Amiri-Regular.ttf';

let fontBase64Cache: string | null = null;
let fontLoadPromise: Promise<string> | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const loadFontBase64 = async (): Promise<string> => {
  if (fontBase64Cache) return fontBase64Cache;
  if (!fontLoadPromise) {
    fontLoadPromise = fetch(FONT_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load Arabic font from ${FONT_URL}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => {
        fontBase64Cache = arrayBufferToBase64(buffer);
        return fontBase64Cache;
      });
  }
  return fontLoadPromise;
};

export const preloadArabicFont = (): void => {
  void loadFontBase64();
};

export const registerArabicFont = async (doc: jsPDF): Promise<void> => {
  const base64 = await loadFontBase64();
  doc.addFileToVFS(ARABIC_FONT_FILE, base64);
  doc.addFont(ARABIC_FONT_FILE, ARABIC_FONT_NAME, 'normal');
  doc.addFont(ARABIC_FONT_FILE, ARABIC_FONT_NAME, 'bold');
};

export const shapeArabic = (text: string): string => {
  if (!text) return '';
  return ArabicShaper.convertArabic(text);
};

export const drawArabicText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    style?: 'normal' | 'bold';
    color?: [number, number, number];
  },
): number => {
  const { fontSize = 7, align = 'right', maxWidth, style = 'normal', color } = options ?? {};
  const shaped = shapeArabic(text);

  doc.setFont(ARABIC_FONT_NAME, style);
  doc.setFontSize(fontSize);
  if (color) doc.setTextColor(...color);
  else doc.setTextColor(0, 0, 0);

  if (maxWidth) {
    const lines = doc.splitTextToSize(shaped, maxWidth);
    doc.text(lines, x, y, { align });
    return y + lines.length * fontSize * 0.38;
  }

  doc.text(shaped, x, y, { align });
  return y;
};

export const setLatinFont = (doc: jsPDF, style: 'normal' | 'bold' | 'italic' = 'normal', size = 7) => {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(0, 0, 0);
};

export const drawBilingualLabel = (
  doc: jsPDF,
  french: string,
  arabic: string,
  x: number,
  y: number,
  width: number,
  fontSize = 6.5,
) => {
  setLatinFont(doc, 'bold', fontSize);
  doc.setTextColor(60, 60, 60);
  doc.text(french, x, y);
  drawArabicText(doc, arabic, x + width, y, { fontSize, align: 'right', style: 'bold', color: [60, 60, 60] });
};

export const drawBilingualSectionTitle = (
  doc: jsPDF,
  french: string,
  arabic: string,
  x: number,
  y: number,
  width: number,
) => {
  setLatinFont(doc, 'bold', 6.5);
  doc.setTextColor(0, 0, 0);
  doc.text(french.toUpperCase(), x, y);
  drawArabicText(doc, arabic, x + width - 2, y, { fontSize: 7, align: 'right', style: 'bold' });
};
