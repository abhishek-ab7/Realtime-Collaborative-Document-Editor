// ─── Collaboration Colors (colorblind-friendly) ───
export const PRESENCE_COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#64B5F6',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FFB74D',
  '#A1887F',
  '#90A4AE',
] as const;

// ─── Limits ───
export const MAX_DOCUMENT_TITLE_LENGTH = 255;
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CONCURRENT_EDITORS = 20;
export const MAX_DOCUMENTS_PER_PAGE = 50;
export const AUTO_SAVE_DEBOUNCE_MS = 2000;
export const SNAPSHOT_INTERVAL_UPDATES = 100;
export const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const VERSION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const ROOM_TEARDOWN_DELAY_MS = 30 * 1000; // 30 seconds
export const AWARENESS_THROTTLE_MS = 33; // ~30 Hz
export const MAX_SNAPSHOTS_PER_DOCUMENT = 50;
export const SHARE_TOKEN_BYTES = 32;
export const SESSION_MAX_AGE_DAYS = 30;
export const TYPING_INDICATOR_TIMEOUT_MS = 2000;

// ─── Roles ───
export const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
