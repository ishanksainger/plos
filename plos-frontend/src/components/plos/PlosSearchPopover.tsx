import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { search, type SearchResults } from '../../services/search.service';
import type { Responsibility } from '../../types/dashboard';
import type { PersonWithCount } from '../../services/person.service';
import { fmtDate } from './ResponsibilityRow';

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// ───── Actions ────────────────────────────────────────────────────────────
type Action = {
  id: string;
  label: string;
  hint?: string;
  route: string;
  keywords?: string;
  group: 'Jump to' | 'Create';
};

const ACTIONS: Action[] = [
  { id: 'jump-today',            label: 'Today',              hint: 'pearl orbit', route: '/',                keywords: 'home now',          group: 'Jump to' },
  { id: 'jump-insights',         label: 'Insights',           hint: 'dashboard',   route: '/insights',         keywords: 'analytics charts',  group: 'Jump to' },
  { id: 'jump-habits',           label: 'Habits',             hint: 'streak chains', route: '/habits',          keywords: 'rituals daily',     group: 'Jump to' },
  { id: 'jump-finance',          label: 'Finance',            hint: 'money',       route: '/finance',          keywords: 'bills sip',         group: 'Jump to' },
  { id: 'jump-health',           label: 'Health',             hint: 'family body', route: '/health',           keywords: 'doctor',            group: 'Jump to' },
  { id: 'jump-people',           label: 'People',             hint: 'circle',      route: '/people',           keywords: 'family contacts',   group: 'Jump to' },
  { id: 'jump-timeline',         label: 'Timeline',           hint: 'audit',       route: '/timeline',         keywords: 'history events',    group: 'Jump to' },
  { id: 'jump-responsibilities', label: 'Responsibilities',   hint: 'master list', route: '/responsibilities', keywords: 'tasks todos',       group: 'Jump to' },
  { id: 'jump-notifications',    label: 'Notifications',      hint: 'bell',        route: '/notifications',    keywords: 'alerts inbox',      group: 'Jump to' },
  { id: 'jump-settings',         label: 'Settings',           hint: 'preferences', route: '/settings',         keywords: 'profile account',   group: 'Jump to' },
  { id: 'new-responsibility',    label: 'New responsibility…', hint: 'opens create modal', route: '/responsibilities?new=1', keywords: 'add create task', group: 'Create' },
];

function actionMatches(a: Action, q: string): boolean {
  if (!q) return true;
  const haystack = `${a.label} ${a.hint ?? ''} ${a.keywords ?? ''}`.toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

// ───── Hits (search results) ─────────────────────────────────────────────
type Hit =
  | { kind: 'action'; item: Action }
  | { kind: 'responsibility'; item: Responsibility }
  | { kind: 'person'; item: PersonWithCount };

function flatten(actions: Action[], results: SearchResults | undefined): Hit[] {
  const out: Hit[] = actions.map<Hit>((item) => ({ kind: 'action', item }));
  if (results) {
    out.push(
      ...results.responsibilities.map<Hit>((item) => ({ kind: 'responsibility', item })),
      ...results.persons.map<Hit>((item) => ({ kind: 'person', item })),
    );
  }
  return out;
}

function routeFor(hit: Hit): string {
  if (hit.kind === 'action') return hit.item.route;
  if (hit.kind === 'person') return `/people/${hit.item.id}`;
  return `/responsibilities/${hit.item.id}`;
}

const initials = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export function PlosSearchPopover() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 160);
    return () => clearTimeout(t);
  }, [value]);

  const remoteEnabled = open && debounced.length >= 1;

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => search(debounced),
    enabled: remoteEnabled,
    staleTime: 5_000,
  });

  const matchingActions = useMemo(
    () => ACTIONS.filter((a) => actionMatches(a, debounced.toLowerCase())),
    [debounced],
  );

  const hits = useMemo<Hit[]>(
    () => flatten(matchingActions, data),
    [matchingActions, data],
  );

  useEffect(() => setActiveIndex(0), [hits.length, debounced]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // ⌘K / Ctrl+K focuses; Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const commit = useCallback(
    (hit: Hit) => {
      navigate(routeFor(hit));
      setOpen(false);
      setValue('');
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[activeIndex];
      if (hit) commit(hit);
    }
  };

  const showPopover = open;

  return (
    <div className="plos-search" ref={containerRef} style={{ position: 'relative' }}>
      {SearchIcon}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search or jump · ⌘K"
        aria-autocomplete="list"
        aria-expanded={showPopover}
        aria-controls="plos-search-results"
        role="combobox"
      />
      <span
        className="mono"
        style={{
          fontSize: 11,
          color: 'var(--plos-ink-4)',
          padding: '2px 6px',
          border: '1px solid var(--plos-rule)',
          borderRadius: 6,
        }}
      >
        ⌘K
      </span>

      {showPopover && (
        <div
          id="plos-search-results"
          role="listbox"
          className="plos-search-popover glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 420,
            overflowY: 'auto',
            padding: 6,
            zIndex: 40,
            borderRadius: 14,
          }}
        >
          {hits.length === 0 && !isFetching ? (
            <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--plos-ink-3)' }}>
              Nothing matches “{debounced}”.
            </div>
          ) : (
            <PaletteBody
              hits={hits}
              activeIndex={activeIndex}
              onSelect={commit}
              onHover={setActiveIndex}
              isFetching={isFetching}
              queryEmpty={debounced.length === 0}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PaletteBody({
  hits,
  activeIndex,
  onSelect,
  onHover,
  isFetching,
  queryEmpty,
}: {
  hits: Hit[];
  activeIndex: number;
  onSelect: (hit: Hit) => void;
  onHover: (i: number) => void;
  isFetching: boolean;
  queryEmpty: boolean;
}) {
  // Group preserving order so ↑/↓ keys still traverse the flat list.
  const groups: Array<{ label: string; from: number; items: Hit[] }> = [];
  let i = 0;
  while (i < hits.length) {
    const groupLabel = labelFor(hits[i], queryEmpty);
    const from = i;
    const items: Hit[] = [];
    while (i < hits.length && labelFor(hits[i], queryEmpty) === groupLabel) {
      items.push(hits[i]);
      i++;
    }
    groups.push({ label: groupLabel, from, items });
  }

  return (
    <>
      {groups.map((g) => (
        <div key={`${g.label}-${g.from}`}>
          <SectionLabel>{g.label}</SectionLabel>
          {g.items.map((hit, j) => {
            const flatIdx = g.from + j;
            const active = flatIdx === activeIndex;
            return (
              <ResultRow
                key={`${hit.kind}-${idOf(hit)}-${flatIdx}`}
                active={active}
                onSelect={() => onSelect(hit)}
                onMouseEnter={() => onHover(flatIdx)}
                {...renderHit(hit)}
              />
            );
          })}
        </div>
      ))}
      {isFetching && (
        <div style={{ padding: '10px 12px', fontSize: 11, color: 'var(--plos-ink-4)' }}>
          Searching…
        </div>
      )}
    </>
  );
}

function labelFor(hit: Hit, queryEmpty: boolean): string {
  if (hit.kind === 'action') {
    return queryEmpty ? hit.item.group : 'Actions';
  }
  if (hit.kind === 'responsibility') return 'Responsibilities';
  return 'People';
}

function idOf(hit: Hit): string | number {
  if (hit.kind === 'action') return hit.item.id;
  return hit.item.id;
}

function renderHit(hit: Hit): {
  primary: string;
  secondary?: string;
  icon: ReactNode;
  tone?: 'danger';
} {
  if (hit.kind === 'action') {
    return {
      primary: hit.item.label,
      secondary: hit.item.hint,
      icon: (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'var(--plos-rule)',
            color: 'var(--plos-ink-2)',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {hit.item.group === 'Create' ? '＋' : '↗'}
        </span>
      ),
    };
  }
  if (hit.kind === 'responsibility') {
    const r = hit.item;
    return {
      primary: r.title,
      secondary: [
        fmtDate(r.dueDate),
        r.category,
        r.state ? r.state.toLowerCase() : null,
      ]
        .filter(Boolean)
        .join(' · '),
      tone: r.state === 'OVERDUE' ? 'danger' : undefined,
      icon: (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'var(--plos-accent-soft, rgba(124,58,237,0.12))',
            color: 'var(--plos-accent, #7c3aed)',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          R
        </span>
      ),
    };
  }
  const p = hit.item;
  return {
    primary: p.name,
    secondary: p.relation,
    icon: (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a5f3fc, #818cf8)',
          color: '#1a0f37',
          fontSize: 10,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {initials(p.name)}
      </span>
    ),
  };
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="plos-page-eyebrow"
      style={{ padding: '8px 10px 4px', fontSize: 10 }}
    >
      {children}
    </div>
  );
}

function ResultRow({
  active,
  onSelect,
  onMouseEnter,
  primary,
  secondary,
  icon,
  tone,
}: {
  active: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  primary: string;
  secondary?: string;
  icon: ReactNode;
  tone?: 'danger';
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      onMouseEnter={onMouseEnter}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textAlign: 'left',
        padding: '8px 10px',
        borderRadius: 10,
        border: 0,
        background: active ? 'var(--plos-accent-soft, rgba(124,58,237,0.10))' : 'transparent',
        color: 'var(--plos-ink-1)',
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
    >
      {icon}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: tone === 'danger' ? '#ef4444' : 'var(--plos-ink-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {primary}
        </span>
        {secondary && (
          <span
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--plos-ink-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {secondary}
          </span>
        )}
      </span>
    </button>
  );
}
