import { useMemo, useState } from 'react';
import { Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { eventService, type UserEventEntry } from '../services/event.service';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { TimelineScene } from '../components/plos/ModuleScenes';

const CATEGORY_COLOR: Record<string, string> = {
  finance: '#7c3aed',
  health:  '#fb7185',
  habit:   '#3b82f6',
  family:  '#ec4899',
  admin:   '#22d3ee',
  other:   '#f59e0b',
};

type Filter = 'all' | 'you' | 'system';

const isSystemEvent = (e: UserEventEntry) => e.toState !== 'COMPLETED';

function describeEvent(e: UserEventEntry): string {
  const title = `<strong>${escapeHtml(e.responsibility.title)}</strong>`;
  const amount = e.responsibility.amount != null
    ? ` · ₹ ${Number(e.responsibility.amount).toLocaleString('en-IN')}`
    : '';
  switch (e.toState) {
    case 'COMPLETED':
      return `You completed ${title}${amount}`;
    case 'OVERDUE':
      return `${title} moved to overdue`;
    case 'DUE':
      return `${title} became due${amount}`;
    case 'UPCOMING':
      return `Scheduled ${title}`;
    default:
      return `${title} · ${e.fromState} → ${e.toState}`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function dayLabel(d: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function TimelinePage() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: events = [], isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getFeed(150),
    staleTime: 15_000,
  });

  const filtered = useMemo(() => {
    if (filter === 'you') return events.filter((e) => !isSystemEvent(e));
    if (filter === 'system') return events.filter((e) => isSystemEvent(e));
    return events;
  }, [events, filter]);

  const days = useMemo(() => {
    const groups: { day: string; date: Date; items: UserEventEntry[] }[] = [];
    for (const e of filtered) {
      const d = new Date(e.occurredAt);
      const last = groups[groups.length - 1];
      if (last && sameDay(last.date, d)) {
        last.items.push(e);
      } else {
        groups.push({ day: dayLabel(d), date: d, items: [e] });
      }
    }
    return groups;
  }, [filtered]);

  return (
    <div className="plos-page-enter">
      <PlosModuleHero
        eyebrow="Life · Timeline"
        title="A timeline of your <em>life</em>."
        sub="Everything that changed, in order. System events grey, you in colour."
        scene={TimelineScene}
        accent="#fb7185"
        actions={
          <div className="tabs">
            <button type="button" className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All
            </button>
            <button type="button" className={`tab ${filter === 'you' ? 'active' : ''}`} onClick={() => setFilter('you')}>
              You
            </button>
            <button type="button" className={`tab ${filter === 'system' ? 'active' : ''}`} onClick={() => setFilter('system')}>
              System
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      ) : isError ? (
        <div style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Failed to load timeline.{error instanceof Error && error.message ? ` ${error.message}` : ''}
        </div>
      ) : days.length === 0 ? (
        <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--plos-ink-1)', marginBottom: 6 }}>
            No events yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--plos-ink-3)' }}>
            As you create and complete responsibilities, every state change will appear here.
          </div>
        </div>
      ) : (
        <div className="glass" style={{ padding: '8px 24px' }}>
          {days.map((d) => (
            <div className="tl-day" key={d.date.toISOString()}>
              <div className="tl-date">{d.day}</div>
              <div className="tl-events">
                {d.items.map((e) => {
                  const system = isSystemEvent(e);
                  const color = system
                    ? 'var(--plos-ink-4)'
                    : CATEGORY_COLOR[e.responsibility.category] ?? '#10b981';
                  return (
                    <div className="tl-event" key={e.id}>
                      <div className="tl-dot" style={{ background: color }} />
                      <div>
                        <div className="tl-event-body" dangerouslySetInnerHTML={{ __html: describeEvent(e) }} />
                        <div className="tl-event-time">
                          {timeLabel(e.occurredAt)}
                          {system ? ' · system' : ''}
                          {e.responsibility.person ? ` · ${e.responsibility.person.name.split(' ')[0]}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
