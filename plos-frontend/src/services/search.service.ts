import { api } from './api';
import { personService, type PersonWithCount } from './person.service';
import { responsibilityService } from './responsibility.service';
import type { Responsibility } from '../types/dashboard';

export interface SearchResults {
  responsibilities: Responsibility[];
  persons: PersonWithCount[];
}

interface BackendSearchResponse {
  responsibilities?: Responsibility[];
  persons?: PersonWithCount[];
  /** Reserved for future "notes" hits. */
  notes?: unknown[];
}

const MAX_HITS = 6;

/**
 * Tries the server-side autocomplete endpoint first; if it isn't shipped
 * yet (404) or fails for any other reason, falls back to client-side
 * filtering of /responsibility + /persons so the UI keeps working during
 * the backend rollout. Cursor owns the backend endpoint per BACKLOG.md.
 */
export async function search(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { responsibilities: [], persons: [] };

  try {
    const data = await api.get<BackendSearchResponse>(
      `/search?q=${encodeURIComponent(q)}`,
    );
    return {
      responsibilities: (data.responsibilities ?? []).slice(0, MAX_HITS),
      persons: (data.persons ?? []).slice(0, MAX_HITS),
    };
  } catch {
    return clientSideSearch(q);
  }
}

async function clientSideSearch(q: string): Promise<SearchResults> {
  const needle = q.toLowerCase();
  const [responsibilities, persons] = await Promise.all([
    responsibilityService.getAll().catch((): Responsibility[] => []),
    personService.getAll().catch((): PersonWithCount[] => []),
  ]);

  return {
    responsibilities: responsibilities
      .filter(
        (r) =>
          r.title?.toLowerCase().includes(needle) ||
          r.category?.toLowerCase().includes(needle) ||
          r.notes?.toLowerCase().includes(needle) ||
          r.module?.toLowerCase().includes(needle),
      )
      .slice(0, MAX_HITS),
    persons: persons
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(needle) ||
          p.email?.toLowerCase().includes(needle) ||
          p.relation?.toLowerCase().includes(needle),
      )
      .slice(0, MAX_HITS),
  };
}
