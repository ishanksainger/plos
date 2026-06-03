import { api } from './api';

export type ImportRowError = { row: number; reason: string };

export type ImportSummary = {
  created: number;
  skipped: number;
  total: number;
  errors: ImportRowError[];
};

/** Columns the importer understands (matched case-insensitively, aliases allowed). */
export const IMPORT_COLUMNS = [
  'title',
  'category',
  'dueDate',
  'amount',
  'recurrence',
  'notes',
  'person',
] as const;

/** Kept in sync with ImportService.buildTemplate() on the backend. */
export const IMPORT_TEMPLATE_CSV =
  'title,category,dueDate,amount,recurrence,notes,person\n' +
  'Pay advance tax,finance,2026-07-31,18000,yearly,Freelance income,Self\n' +
  'Mom doctor visit,health,2026-06-20,,none,Annual checkup,Mother\n';

export function importResponsibilities(file: File): Promise<ImportSummary> {
  const fd = new FormData();
  fd.append('file', file);
  return api.upload<ImportSummary>('/import/responsibilities', fd);
}

/** Build + download the CSV template client-side (no auth round-trip needed). */
export function downloadImportTemplate(): void {
  const blob = new Blob([IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plos-import-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
