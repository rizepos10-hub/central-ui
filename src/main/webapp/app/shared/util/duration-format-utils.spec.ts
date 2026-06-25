import {
  formatClockDuration,
  formatWorkingDuration,
  formatWorkingDurationTitle,
  getElapsedSeconds,
} from './duration-format-utils';

describe('duration format utils', () => {
  describe('formatWorkingDuration', () => {
    it('formats short durations in seconds', () => {
      expect(formatWorkingDuration(9)).toBe('9s');
      expect(formatWorkingDuration(11)).toBe('11s');
    });

    it('formats mixed hour and minute durations', () => {
      expect(formatWorkingDuration(6480)).toBe('1h 48m');
      expect(formatWorkingDuration(6510)).toBe('1h 48m 30s');
    });

    it('formats multi-day durations', () => {
      expect(formatWorkingDuration(9071058)).toBe('104d 23h 44m 18s');
    });

    it('returns 0s for zero, negative, or invalid values', () => {
      expect(formatWorkingDuration(0)).toBe('0s');
      expect(formatWorkingDuration(-5)).toBe('0s');
      expect(formatWorkingDuration(Number.NaN)).toBe('0s');
    });
  });

  describe('getElapsedSeconds', () => {
    it('returns elapsed seconds between two dates', () => {
      const start = new Date('2025-07-01T15:47:29.032Z');
      const end = new Date('2025-07-01T15:47:38.546Z');

      expect(getElapsedSeconds(start, end)).toBe(9);
    });

    it('clamps invalid date ranges to zero', () => {
      const start = new Date('2025-07-01T15:47:38.546Z');
      const end = new Date('2025-07-01T15:47:29.032Z');

      expect(getElapsedSeconds(start, end)).toBe(0);
    });
  });

  describe('formatClockDuration', () => {
    it('formats clock records from the employee hours payload', () => {
      expect(formatClockDuration('2025-07-01T15:47:29.032Z', '2025-07-01T15:47:38.546Z')).toBe('9s');
      expect(formatClockDuration('2025-07-01T15:47:54.208Z', '2025-07-01T15:48:05.520Z')).toBe('11s');
      expect(formatClockDuration('2025-07-01T15:48:11.965Z', '2025-10-14T15:32:30.503Z')).toBe('104d 23h 44m 18s');
    });

    it('sums saleh shifts without producing NaN', () => {
      const clocks = [
        ['2025-07-01T15:47:29.032Z', '2025-07-01T15:47:38.546Z'],
        ['2025-07-01T15:47:54.208Z', '2025-07-01T15:48:05.520Z'],
        ['2025-07-01T15:48:11.965Z', '2025-10-14T15:32:30.503Z'],
      ] as const;

      const totalSeconds = clocks.reduce((sum, [clockIn, clockOut]) => {
        return sum + getElapsedSeconds(new Date(clockIn), new Date(clockOut));
      }, 0);

      expect(totalSeconds).toBe(9071078);
      expect(formatWorkingDuration(totalSeconds)).toBe('104d 23h 44m 38s');
      expect(formatWorkingDuration(totalSeconds)).not.toContain('NaN');
    });

    it('returns 0s for missing or invalid clock values', () => {
      expect(formatClockDuration(undefined, '2025-07-01T15:47:38.546Z')).toBe('0s');
      expect(formatClockDuration('2025-07-01T15:47:29.032Z', null)).toBe('0s');
      expect(formatClockDuration('invalid', '2025-07-01T15:47:38.546Z')).toBe('0s');
    });
  });

  describe('formatWorkingDurationTitle', () => {
    it('formats hover titles with whole seconds', () => {
      expect(formatWorkingDurationTitle(9)).toBe('9 seconds');
      expect(formatWorkingDurationTitle(1)).toBe('1 second');
      expect(formatWorkingDurationTitle(9071078)).toBe('9,071,078 seconds');
    });
  });
});
