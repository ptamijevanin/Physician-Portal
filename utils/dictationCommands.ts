export type DictationPiece =
  | { type: 'text'; value: string }
  | { type: 'newline' };

type ParsedPart =
  | { type: 'text'; value: string }
  | { type: 'newline' }
  | { type: 'delete' }
  | { type: 'period' }
  | { type: 'comma' };

const COMMAND_PATTERN =
  /\b(new line|next line|line break|delete that|delete last|undo that|scratch that|period|full stop|comma)\b/gi;

const classifyCommand = (command: string): Exclude<ParsedPart, { type: 'text' }>['type'] => {
  const normalized = command.toLowerCase();
  if (['new line', 'next line', 'line break'].includes(normalized)) return 'newline';
  if (['delete that', 'delete last', 'undo that', 'scratch that'].includes(normalized)) return 'delete';
  if (['period', 'full stop'].includes(normalized)) return 'period';
  return 'comma';
};

export const parseTranscript = (transcript: string): ParsedPart[] => {
  const parts: ParsedPart[] = [];
  let lastIndex = 0;

  for (const match of transcript.matchAll(COMMAND_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: transcript.slice(lastIndex, index) });
    }
    parts.push({ type: classifyCommand(match[1]) });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < transcript.length) {
    parts.push({ type: 'text', value: transcript.slice(lastIndex) });
  }

  return parts;
};

const capitalizeFirst = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const appendTextPiece = (pieces: DictationPiece[], value: string): DictationPiece[] => {
  const trimmed = value.trim();
  if (!trimmed) return pieces;
  return [...pieces, { type: 'text', value: trimmed }];
};

const appendNewline = (pieces: DictationPiece[]): DictationPiece[] => [...pieces, { type: 'newline' }];

const deleteLastPiece = (pieces: DictationPiece[]): DictationPiece[] => {
  if (pieces.length === 0) return pieces;
  return pieces.slice(0, -1);
};

const appendPunctuation = (pieces: DictationPiece[], punctuation: '.' | ','): DictationPiece[] => {
  const last = pieces[pieces.length - 1];
  if (last?.type !== 'text') return pieces;

  const value = last.value.trimEnd();
  if (!value || /[.,!?;:]$/.test(value)) return pieces;

  return [...pieces.slice(0, -1), { type: 'text', value: `${value}${punctuation}` }];
};

export const applyTranscriptParts = (
  pieces: DictationPiece[],
  parts: ParsedPart[],
  options: { allowDelete: boolean },
): DictationPiece[] => {
  let next = pieces;

  for (const part of parts) {
    switch (part.type) {
      case 'text':
        next = appendTextPiece(next, part.value);
        break;
      case 'newline':
        next = appendNewline(next);
        break;
      case 'delete':
        if (options.allowDelete) next = deleteLastPiece(next);
        break;
      case 'period':
        next = appendPunctuation(next, '.');
        break;
      case 'comma':
        next = appendPunctuation(next, ',');
        break;
    }
  }

  return next;
};

export const applyTranscript = (
  pieces: DictationPiece[],
  transcript: string,
  options: { allowDelete: boolean },
): DictationPiece[] => applyTranscriptParts(pieces, parseTranscript(transcript), options);

export const composePieces = (pieces: DictationPiece[]): string => {
  let result = '';

  for (const piece of pieces) {
    if (piece.type === 'newline') {
      result = result.trimEnd() + '\n';
      continue;
    }

    const text = piece.value.trim();
    if (!text) continue;

    if (!result || result.endsWith('\n') || /[.!?]\s*$/.test(result)) {
      result += capitalizeFirst(text);
    } else {
      result += ` ${text}`;
    }
  }

  return result;
};

export const joinBaseAndDictation = (base: string, dictation: string): string => {
  if (!dictation) return base;
  if (!base.trim()) return dictation;
  if (dictation.startsWith('\n')) return `${base.trimEnd()}${dictation}`;
  if (base.endsWith('\n')) return base + capitalizeFirst(dictation);
  return `${base.trimEnd()} ${dictation}`;
};

export const mergeDisplayText = (base: string, pieces: DictationPiece[], interim: string): string => {
  const committed = composePieces(pieces);
  if (!interim.trim()) return joinBaseAndDictation(base, committed);

  const previewPieces = applyTranscript(pieces, interim, { allowDelete: false });
  return joinBaseAndDictation(base, composePieces(previewPieces));
};

const STOP_PHRASE_PATTERN =
  /\b(stop dictation|stop recording|end dictation|that'll do|that will do)\b/i;

/** Normalize odd Whisper punctuation / spaces for stop-command matching. */
const normalizeForStopMatch = (text: string) =>
  text
    .replace(/\u00a0/g, ' ')
    .replace(/[…。．]/g, '.')
    .replace(/\s+/g, ' ')
    .trim();

/** True when a (partial) transcript indicates the speaker wants to end dictation. */
export const transcriptRequestsStop = (text: string): boolean => {
  const normalized = normalizeForStopMatch(text).toLowerCase().replace(/[.!?]+$/g, '').trim();
  if (!normalized) return false;
  if (STOP_PHRASE_PATTERN.test(normalized)) return true;
  if (/^(?:please\s+)?(?:stop|stopped|stopp)$/i.test(normalized)) return true;
  if (/(?:^|[.!?]\s+)\b(?:stop|stopped)\b$/i.test(normalized)) return true;
  // Arabic: stop / pause
  if (/(?:^|[\s،.!?])(?:توقف|وقف|انته(?:ى|اء)?)\s*$/u.test(normalized)) return true;
  return /\bstop$/i.test(normalized);
};

/** @deprecated use transcriptRequestsStop */
export const isStopDictationUtterance = transcriptRequestsStop;

/** Remove a trailing stop command so it is not written into the note. */
export const stripTrailingStopCommand = (text: string): string => {
  let next = text.replace(/\u00a0/g, ' ').replace(/[…。．]/g, '.');
  // Trailing stop variants (English + common mis-hearings)
  next = next.replace(
    /\s*(?:[,.\-–—]\s*)?(?:please\s+)?(?:stop\s+dictation|stop\s+recording|end\s+dictation|that'll\s+do|that\s+will\s+do|stop|stopped|stopp)\s*[.!,;:?]*\s*$/i,
    '',
  );
  return next.replace(/\s+$/g, '').trimEnd();
};
