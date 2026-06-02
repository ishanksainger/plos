import {
  parseCsvRecords,
  parseCsvRows,
  pick,
  normalizeCategory,
  moduleForCategory,
  normalizeRecurrence,
  parseAmount,
  parseDueDate,
} from './csv.util';

describe('csv.util', () => {
  describe('parseCsvRows / parseCsvRecords', () => {
    it('parses a simple header + rows into keyed records (case-insensitive headers)', () => {
      const csv =
        'Title,Category,DueDate\nPay rent,finance,2026-06-10\nGym,health,2026-06-11\n';
      const recs = parseCsvRecords(csv);
      expect(recs).toHaveLength(2);
      expect(recs[0]).toMatchObject({
        title: 'Pay rent',
        category: 'finance',
        duedate: '2026-06-10',
      });
    });

    it('handles quoted fields with embedded commas and escaped quotes', () => {
      const csv = 'title,notes\n"Pay, on time","He said ""ok"""\n';
      const recs = parseCsvRecords(csv);
      expect(recs[0].title).toBe('Pay, on time');
      expect(recs[0].notes).toBe('He said "ok"');
    });

    it('strips a UTF-8 BOM and skips blank lines', () => {
      const csv = '﻿title,category\n\nSomething,admin\n\n';
      const recs = parseCsvRecords(csv);
      expect(recs).toHaveLength(1);
      expect(recs[0].title).toBe('Something');
    });

    it('handles CRLF line endings', () => {
      const rows = parseCsvRows('a,b\r\n1,2\r\n');
      expect(rows).toEqual([
        ['a', 'b'],
        ['1', '2'],
      ]);
    });

    it('returns [] when there is no data row', () => {
      expect(parseCsvRecords('title,category\n')).toEqual([]);
    });
  });

  describe('pick', () => {
    it('returns the first non-empty aliased value', () => {
      const rec = { name: '', task: 'Do thing' };
      expect(pick(rec, ['title', 'name', 'task'])).toBe('Do thing');
    });
  });

  describe('normalizeCategory / moduleForCategory', () => {
    it('maps known synonyms onto PLOS categories', () => {
      expect(normalizeCategory('GST')).toBe('finance');
      expect(normalizeCategory('Doctor')).toBe('health');
      expect(normalizeCategory('routine')).toBe('habit');
    });
    it('defaults unknown categories to admin', () => {
      expect(normalizeCategory('whatever')).toBe('admin');
      expect(normalizeCategory('')).toBe('admin');
    });
    it('derives the module from the category', () => {
      expect(moduleForCategory('habit')).toBe('habits');
      expect(moduleForCategory('finance')).toBe('finance');
      expect(moduleForCategory('admin')).toBe('general');
    });
  });

  describe('normalizeRecurrence', () => {
    it('normalizes case + friendly phrases', () => {
      expect(normalizeRecurrence('Monthly')).toBe('monthly');
      expect(normalizeRecurrence('every week')).toBe('weekly');
      expect(normalizeRecurrence('annual')).toBe('yearly');
    });
    it('falls back to none for unsupported values', () => {
      expect(normalizeRecurrence('quarterly')).toBe('none');
      expect(normalizeRecurrence('')).toBe('none');
    });
  });

  describe('parseAmount', () => {
    it('strips ₹, commas and whitespace', () => {
      expect(parseAmount('₹1,200')).toBe(1200);
      expect(parseAmount(' 500 ')).toBe(500);
    });
    it('returns undefined for blank / non-numeric / negative', () => {
      expect(parseAmount('')).toBeUndefined();
      expect(parseAmount('abc')).toBeUndefined();
      expect(parseAmount('-5')).toBeUndefined();
    });
  });

  describe('parseDueDate', () => {
    it('parses ISO dates', () => {
      const d = parseDueDate('2026-07-31');
      expect(d?.getFullYear()).toBe(2026);
      expect(d?.getMonth()).toBe(6); // July (0-based)
      expect(d?.getDate()).toBe(31);
    });
    it('parses Indian DD/MM/YYYY and DD-MM-YYYY (day first)', () => {
      const a = parseDueDate('05/06/2026');
      expect(a?.getMonth()).toBe(5); // June
      expect(a?.getDate()).toBe(5);
      const b = parseDueDate('5-6-26');
      expect(b?.getFullYear()).toBe(2026);
      expect(b?.getMonth()).toBe(5);
    });
    it('returns null for blank / unparseable input', () => {
      expect(parseDueDate('')).toBeNull();
      expect(parseDueDate('not a date')).toBeNull();
    });
  });
});
