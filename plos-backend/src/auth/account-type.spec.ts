import { normalizeAccountType, accountTypeChangeWarning } from './account-type';

describe('account-type', () => {
  describe('normalizeAccountType', () => {
    it('defaults invalid values to solo', () => {
      expect(normalizeAccountType(undefined)).toBe('solo');
      expect(normalizeAccountType('')).toBe('solo');
      expect(normalizeAccountType('invalid')).toBe('solo');
    });

    it('accepts family and shared', () => {
      expect(normalizeAccountType('family')).toBe('family');
      expect(normalizeAccountType('SHARED')).toBe('shared');
    });
  });

  describe('accountTypeChangeWarning', () => {
    it('returns null when unchanged', () => {
      expect(accountTypeChangeWarning('solo', 'solo')).toBeNull();
    });

    it('warns when moving to solo', () => {
      expect(accountTypeChangeWarning('family', 'solo')).toMatch(/Solo/i);
    });
  });
});
