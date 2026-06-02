/**
 * Tiny dependency-free CSV reader (RFC-4180-ish) + field coercers for the
 * tracker → PLOS import (Step K). Handles quoted fields, embedded commas,
 * escaped quotes ("") and CRLF/LF line endings. Trackers are simple exports,
 * so we deliberately avoid pulling in a CSV library (CLAUDE.md §7).
 */

/** Parse CSV text into rows of raw string cells. Skips fully blank lines. */
export function parseCsvRows(text: string): string[][] {
  // Strip a UTF-8 BOM if present (Excel/Canva exports love adding one).
  const input = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      // Handle CRLF as a single break.
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  // Flush trailing field/row (no final newline).
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

/**
 * Parse CSV into header-keyed records. Headers are lowercased + trimmed so
 * lookups are case-insensitive. Returns [] when there's no data row.
 */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? '').trim();
    });
    return rec;
  });
}

/** Read the first non-empty value among a set of aliased column names. */
export function pick(rec: Record<string, string>, aliases: string[]): string {
  for (const a of aliases) {
    const v = rec[a];
    if (v != null && v.trim() !== '') return v.trim();
  }
  return '';
}

const CATEGORY_ALIASES: Record<string, string> = {
  finance: 'finance', money: 'finance', bill: 'finance', bills: 'finance',
  expense: 'finance', payment: 'finance', sip: 'finance', investment: 'finance',
  gst: 'finance', tax: 'finance', emi: 'finance', budget: 'finance',
  health: 'health', medical: 'health', fitness: 'health', doctor: 'health',
  habit: 'habit', habits: 'habit', routine: 'habit',
  family: 'family', home: 'family', household: 'family', kids: 'family',
  admin: 'admin', work: 'admin', job: 'admin', general: 'admin',
  task: 'admin', todo: 'admin', other: 'admin', personal: 'admin',
};

const MODULE_FOR_CATEGORY: Record<string, string> = {
  finance: 'finance', health: 'health', habit: 'habits', family: 'family', admin: 'general',
};

export const VALID_CATEGORIES = ['finance', 'health', 'habit', 'family', 'admin'] as const;

/** Map a free-text category cell onto a PLOS category, defaulting to 'admin'. */
export function normalizeCategory(raw: string): string {
  const key = raw.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? 'admin';
}

export function moduleForCategory(category: string): string {
  return MODULE_FOR_CATEGORY[category] ?? 'general';
}

const VALID_RECURRENCE = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

export function normalizeRecurrence(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (VALID_RECURRENCE.includes(key)) return key;
  if (key === 'every day') return 'daily';
  if (key === 'every week') return 'weekly';
  if (key === 'every month' || key === 'month') return 'monthly';
  if (key === 'every year' || key === 'annual' || key === 'annually' || key === 'year') return 'yearly';
  return 'none';
}

/** Parse an amount cell, stripping ₹ / commas / spaces. Returns undefined if blank/NaN. */
export function parseAmount(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[₹,\s]/g, '');
  if (cleaned === '') return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Parse a date cell. Accepts ISO (YYYY-MM-DD), Indian DD/MM/YYYY and DD-MM-YYYY,
 * then falls back to Date.parse. Returns a Date at local midnight, or null.
 */
export function parseDueDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // ISO first (most reliable).
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY or DD-MM-YYYY (Indian convention — day first).
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(s);
  if (dmy) {
    let [, dd, mm, yy] = dmy;
    let year = Number(yy);
    if (year < 100) year += 2000;
    const month = Number(mm);
    const day = Number(dd);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}
