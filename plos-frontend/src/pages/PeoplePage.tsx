import { useMemo, useState } from 'react';
import { Button, Loader, Modal, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { personService, type PersonWithCount } from '../services/person.service';
import { responsibilityService } from '../services/responsibility.service';
import { PersonContactFields, type PersonContactDraft, emptyPersonContactDraft } from '../components/person/PersonContactFields';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { PlosReveal } from '../components/plos/PlosReveal';
import { PeopleScene } from '../components/plos/ModuleScenes';
import { fmtDate, fmtINR } from '../components/plos/ResponsibilityRow';
import '@mantine/dates/styles.css';

const RELATION_TONE: Record<string, [string, string]> = {
  self:    ['#fde68a', '#f0abfc'],
  father:  ['#fcd34d', '#fb923c'],
  mother:  ['#bbf7d0', '#86efac'],
  partner: ['#a5f3fc', '#818cf8'],
  child:   ['#fecaca', '#f9a8d4'],
  sibling: ['#ddd6fe', '#c4b5fd'],
  other:   ['#e5e7eb', '#cbd5e1'],
};

const initials = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

function AddPersonModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PersonContactDraft>(emptyPersonContactDraft);
  const [dob, setDob] = useState<string | null>(null);

  const reset = () => {
    setDraft(emptyPersonContactDraft());
    setDob(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await personService.create({
        name: draft.name.trim(),
        email: draft.email.trim(),
        relation: draft.relation,
        ...(draft.phone.trim() ? { phone: draft.phone.trim() } : {}),
        ...(dob ? { dateOfBirth: new Date(dob).toISOString() } : {}),
      });
      if (draft.avatarFile) return personService.uploadAvatar(created.id, draft.avatarFile);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Added', message: `${draft.name.trim()} is now in your circle.`, color: 'teal' });
      reset();
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message || 'Failed to add', color: 'red' }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.email.trim() || !draft.relation) return;
    mutation.mutate();
  };

  const canSubmit = Boolean(draft.name.trim() && draft.email.trim() && draft.relation);

  return (
    <Modal opened={opened} onClose={reset} title="Add Person" size="md" centered overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          <PersonContactFields value={draft} onChange={setDraft} />
          <DateInput label="Date of Birth (optional)" placeholder="Pick a date" value={dob} onChange={setDob} clearable />
          <Button type="submit" color="violet" mt="xs" loading={mutation.isPending} leftSection={<IconPlus size={16} />} disabled={!canSubmit}>
            Add to Circle
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: persons = [], isLoading, isError, error } = useQuery({
    queryKey: ['persons'],
    queryFn: personService.getAll,
    staleTime: 30_000,
  });

  const { data: responsibilities = [] } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => personService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Removed', message: 'Person removed.', color: 'teal' });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message || 'Cannot delete (active tasks?)', color: 'red' }),
  });

  const cards = useMemo(() => {
    return persons.map((p: PersonWithCount) => {
      const open = responsibilities.filter((r) => r.personId === p.id && !r.completedAt);
      const overdue = open.filter((r) => r.state === 'OVERDUE').length;
      const money = open.reduce((s, r) => s + (r.amount ? Number(r.amount) : 0), 0);
      const next = open
        .slice()
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
      return { person: p, open: open.length, overdue, money, next };
    });
  }, [persons, responsibilities]);

  const totalOpen = cards.reduce((s, c) => s + c.open, 0);

  return (
    <div className="plos-page-enter">
      <AddPersonModal opened={addOpen} onClose={() => setAddOpen(false)} />

      <PlosModuleHero
        eyebrow="Life · People"
        title="People in your <em>circle</em>."
        sub={`${persons.length} ${persons.length === 1 ? 'person' : 'people'} · ${totalOpen} open responsibilities tagged to someone`}
        scene={PeopleScene}
        accent="#22d3ee"
        actions={
          <button type="button" className="plos-cta" onClick={() => setAddOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            <span>Add person</span>
          </button>
        }
      />

      {isLoading ? (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      ) : isError ? (
        <div style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Failed to load people.{error instanceof Error && error.message ? ` ${error.message}` : ''}
        </div>
      ) : cards.length === 0 ? (
        <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--plos-ink-1)', marginBottom: 6 }}>
            No people yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--plos-ink-3)', marginBottom: 16 }}>
            Add your first person to start delegating responsibilities.
          </div>
          <button type="button" className="plos-cta" onClick={() => setAddOpen(true)}>
            <span>Add your first person</span>
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {cards.map(({ person, open, overdue, money, next }, i) => {
            const tone = RELATION_TONE[person.relation] ?? RELATION_TONE.other;
            const avatar = resolveMediaUrl(person.avatarUrl);
            const isSelf = person.relation === 'self';
            return (
              <PlosReveal key={person.id} delay={i}>
                <div className="glass person-card plos-tilt" style={{ position: 'relative' }}>
                  <div className="person-head">
                    <div
                      className="person-avatar"
                      style={{
                        background: avatar
                          ? `center/cover no-repeat url(${avatar})`
                          : `linear-gradient(135deg, ${tone[0]}, ${tone[1]})`,
                      }}
                    >
                      {avatar ? '' : initials(person.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="person-name">{person.name}</div>
                      <div className="person-relation">{person.relation}</div>
                    </div>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(person.id)}
                        title="Remove"
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          color: 'var(--plos-ink-3)',
                          fontFamily: 'var(--nis-font-mono)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--plos-ink-2)' }}>
                    {next ? (
                      <>
                        Next: <strong style={{ color: 'var(--plos-ink-1)' }}>{next.title}</strong> · {fmtDate(next.dueDate)}
                      </>
                    ) : (
                      <span style={{ color: 'var(--plos-ink-3)' }}>No open items. Lovely.</span>
                    )}
                  </div>
                  <div className="person-stats">
                    <div className="person-stat">
                      <div className="num">{open}</div>
                      <div className="label">Open</div>
                    </div>
                    <div className="person-stat">
                      <div className="num" style={{ color: overdue > 0 ? '#ef4444' : undefined }}>{overdue}</div>
                      <div className="label">Overdue</div>
                    </div>
                    <div className="person-stat">
                      <div className="num">{money ? fmtINR(money) : '—'}</div>
                      <div className="label">Spend</div>
                    </div>
                  </div>
                </div>
              </PlosReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
