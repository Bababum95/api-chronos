export const normalizeTimestamp = (timestamp: number): number => {
  // If the absolute value is bigger than ~1e11 treat it as milliseconds.
  // (Unix seconds around 1e9 — timestamps in ms are ~1e12)
  const isMs = Math.abs(timestamp) > 1e11;
  return isMs ? timestamp / 1000 : timestamp;
};

/**
 * Align timestamp to the start of the hour.
 * Detects whether input is milliseconds (large number) or seconds, and
 * returns value in the same unit as input.
 */
export const toHourStart = (timestamp: number): number => {
  return Math.floor(normalizeTimestamp(timestamp) / 3600) * 3600;
};

/**
 * Align timestamp to the end of the hour (inclusive).
 * Returns value in same unit as input.
 */
export const toHourEnd = (timestamp: number): number => {
  return Math.ceil(normalizeTimestamp(timestamp) / 3600) * 3600 - 1;
};

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};
