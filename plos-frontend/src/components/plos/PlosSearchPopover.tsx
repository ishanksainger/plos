import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { search, type SearchResults } from '../../services/search.service';
import type { Responsibility } from '../../types/dashboard';
import type { PersonWithCount } from '../../services/person.service';
import { fmtDate } from './ResponsibilityRow';

const SearchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

type Hit =
  | { kind: 'responsibility'; item: Responsibility }
  | { kind: 'person'; item: PersonWithCount };

function flatten(results: SearchResults): Hit[] {
  return [
    ...results.responsibilities.map<Hit>((item) => ({ kind: 'responsibility', item })),
    ...results.persons.map<Hit>((item) => ({ kind: 'person', item })),
  ];
}

function routeFor(hit: Hit): string {
  if (hit.kind === 'person') return `/people/${hit.item.id}`;
  const r = hit.item;
  if (r.category === 'finance') return '/finance';
  if (r.category === 'health') return '/health';
  if (r.category === 'habit' || r.module === 'habits') return '/habits';
  return '/responsibilities';
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

  // Debounce input to avoid hammering the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 160);
    return () => clearTimeout(t);
  }, [value]);

  const enabled = open && debounced.length >= 1;

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => search(debounced),
    enabled,
    staleTime: 5_000,
  });

  const hits = useMemo<Hit[]>(() => (data ? flatten(data) : []), [data]);

  // Reset highlighted row whenever the hit list changes.
  useEffect(() => setActiveIndex(0), [hits.length]);

  // Click outside closes the popover.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // ⌘K / Ctrl+K focuses the input from anywhere. Esc closes + blurs.
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

  const showPopover = open && debounced.length >= 1;
  const isEmpty = !isFetching && hits.length === 0;

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
        placeholder="Search responsibilities, people, notes…"
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
            maxHeight: 360,
            overflowY: 'auto',
            padding: 6,
            zIndex: 40,
            borderRadius: 14,
          }}
        >
          {isFetching && hits.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--plos-ink-3)' }}>
              Searching…
            </div>
          ) : isEmpty ? (
            <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--plos-ink-3)' }}>
              Nothing matches “{debounced}”.
            </div>
          ) : (
            <>
              {data && data.responsibilities.length > 0 && (
                <SectionLabel>Responsibilities</SectionLabel>
              )}
              {data?.responsibilities.map((r, i) => (
                <ResultRow
                  key={`r-${r.id}`}
                  active={i === activeIndex}
                  onSelect={() => commit({ kind: 'responsibility', item: r })}
                  onMouseEnter={() => setActiveIndex(i)}
                  primary={r.title}
                  secondary={[
                    fmtDate(r.dueDate),
                    r.category,
                    r.state ? r.state.toLowerCase() : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  tone={r.state === 'OVERDUE' ? 'danger' : undefined}
                  icon={
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
                  }
                />
              ))}

              {data && data.persons.length > 0 && <SectionLabel>People</SectionLabel>}
              {data?.persons.map((p, i) => {
                const idx = (data?.responsibilities.length ?? 0) + i;
                return (
                  <ResultRow
                    key={`p-${p.id}`}
                    active={idx === activeIndex}
                    onSelect={() => commit({ kind: 'person', item: p })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    primary={p.name}
                    secondary={p.relation}
                    icon={
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, #a5f3fc, #818cf8)',
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
                    }
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
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
  icon: React.ReactNode;
  tone?: 'danger';
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(e) => {
        // Use mousedown so the click registers before the input blurs.
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
