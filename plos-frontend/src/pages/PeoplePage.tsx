import { useState } from 'react';
import {
  ActionIcon, Box, Button, Grid, Group, Loader, Modal, Select, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import {
  IconPlus, IconTrash, IconUser, IconUsers, IconHeart, IconShield,
} from '@tabler/icons-react';
import { personService, type CreatePersonPayload, type PersonWithCount } from '../services/person.service';
import PageHeader from '../components/PageHeader';
import { PLOS_SHADOW_CARD, useDS } from '../theme/palette';
import '@mantine/dates/styles.css';

const RELATIONS = [
  { value: 'self',    label: '◉ Self (You)' },
  { value: 'father',  label: '👨 Father' },
  { value: 'mother',  label: '👩 Mother' },
  { value: 'partner', label: '💞 Partner' },
  { value: 'child',   label: '👶 Child' },
  { value: 'sibling', label: '🧑 Sibling' },
  { value: 'other',   label: '🫂 Other' },
];

const RELATION_COLORS: Record<string, string> = {
  self:    '#5e35b1',
  father:  '#3949ab',
  mother:  '#6d28d9',
  partner: '#7e57c2',
  child:   '#2f4aa0',
  sibling: '#8e24aa',
  other:   '#6b7280',
};

interface AddPersonModalProps {
  opened: boolean;
  onClose: () => void;
}

const AddPersonModal = ({ opened, onClose }: AddPersonModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setRelation(null);
    setDob(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (data: CreatePersonPayload) => personService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Added', message: `${name} is now in your circle.`, color: 'teal' });
      reset();
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message || 'Failed to add', color: 'red' }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relation) return;
    mutation.mutate({
      name: name.trim(),
      relation,
      ...(dob && { dateOfBirth: new Date(dob).toISOString() }),
    });
  };

  return (
    <Modal opened={opened} onClose={reset} title="Add Person" size="md" centered overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          <TextInput label="Name" placeholder="e.g. Mom" value={name} onChange={(e) => setName(e.target.value)} required data-autofocus />
          <Select label="Relation" placeholder="How are they related to you?" data={RELATIONS} value={relation} onChange={setRelation} required allowDeselect={false} />
          <DateInput label="Date of Birth (optional)" placeholder="Pick a date" value={dob} onChange={setDob} clearable />
          <Button type="submit" color="violet" mt="xs" loading={mutation.isPending} leftSection={<IconPlus size={16} />} disabled={!name.trim() || !relation}>
            Add to Circle
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

const PersonCard = ({ person, onDelete }: { person: PersonWithCount; onDelete: () => void }) => {
  const DS = useDS();
  const color = RELATION_COLORS[person.relation] ?? RELATION_COLORS.other;
  const count = person._count?.responsibilities ?? 0;
  const isSelf = person.relation === 'self';

  return (
      <Box
        style={{
          background: DS.surface,
          border: `1px solid ${DS.border}`,
          borderTop: `3px solid ${color}`,
          borderLeft: isSelf ? `3px solid ${DS.accent}` : undefined,
          borderRadius: 'var(--pl-card-radius)',
          padding: '16px 18px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: PLOS_SHADOW_CARD,
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Group justify="space-between" align="flex-start" mb={10}>
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${color}18`,
              border: `1px solid ${color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 800, color, textTransform: 'uppercase' }}>
              {person.name.charAt(0)}
            </Text>
          </Box>
          {!isSelf && (
            <Tooltip label="Remove" withArrow>
              <ActionIcon variant="subtle" size="sm" color="red" onClick={onDelete}>
                <IconTrash size={13} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Text fw={700} size="md" style={{ color: DS.text1, marginBottom: 2 }}>
          {person.name}
        </Text>
        <Text style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color, fontWeight: 600 }}>
          {person.relation}
        </Text>

        <Group gap={6} mt={14}>
          <Box style={{ width: 5, height: 5, borderRadius: '50%', background: DS.text3 }} />
          <Text style={{ fontSize: '0.72rem', color: DS.text2, fontVariantNumeric: 'tabular-nums' }}>
            {count} {count === 1 ? 'task' : 'tasks'} assigned
          </Text>
        </Group>
      </Box>
  );
};

const PeoplePage = () => {
  const DS = useDS();
  const HERO_ACCENT = DS.accent;
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: persons, isLoading, isError, error } = useQuery({
    queryKey: ['persons'],
    queryFn: personService.getAll,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => personService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Removed', message: 'Person removed from your circle.', color: 'teal' });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message || 'Cannot delete (active tasks?)', color: 'red' }),
  });

  const list = persons ?? [];

  const summary = list.reduce((acc, p) => {
    if (p.relation === 'self') acc.self += 1;
    else if (['father', 'mother', 'child', 'sibling'].includes(p.relation)) acc.family += 1;
    else acc.other += 1;
    acc.total += 1;
    acc.tasks += p._count?.responsibilities ?? 0;
    return acc;
  }, { total: 0, self: 0, family: 0, other: 0, tasks: 0 });

  return (
    <Box style={{ paddingBottom: 32 }}>
      <AddPersonModal opened={addOpen} onClose={() => setAddOpen(false)} />

      <PageHeader
        eyebrow="MODULE · PEOPLE"
        title="Your Circle"
        subtitle={list.length === 0
          ? 'Add people to start assigning responsibilities.'
          : `${summary.total} people with ${summary.tasks} shared tasks.`}
        icon={IconUsers}
        accent={HERO_ACCENT}
        metrics={[
          { label: 'People', value: summary.total, color: HERO_ACCENT },
          { label: 'Family', value: summary.family, color: DS.green },
          { label: 'Tasks', value: summary.tasks, color: DS.orange },
        ]}
        action={(
          <motion.button
            className="plos-btn-accent"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddOpen(true)}
            style={{
              alignItems: 'center',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              gap: 8,
              letterSpacing: '-0.01em',
              padding: '11px 22px',
            }}
          >
            <IconPlus size={15} stroke={2.5} />
            Add Person
          </motion.button>
        )}
      />

      {/* ── Quick stats ── */}
      <Grid gutter="sm" mb={16}>
        {[
          { icon: IconUsers, label: 'People Added', value: String(summary.total), accent: HERO_ACCENT },
          { icon: IconUser,  label: 'Self (You)',   value: String(summary.self),  accent: '#6d28d9' },
          { icon: IconHeart, label: 'Family',       value: String(summary.family), accent: '#2f4aa0' },
          { icon: IconShield,label: 'Tasks Shared', value: String(summary.tasks), accent: '#3949ab' },
        ].map((c) => (
          <Grid.Col span={{ base: 6, md: 3 }} key={c.label}>
            <Box
              className="plos-stat-card plos-interactive-card"
              style={{
                background: `linear-gradient(155deg, ${c.accent}12 0%, ${DS.surface} 56%)`,
                border: `1px solid ${DS.border}`,
                borderRadius: 'var(--pl-card-radius)',
                borderLeft: `3px solid ${c.accent}`,
                padding: '16px 18px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: PLOS_SHADOW_CARD,
              }}
            >
              <Box aria-hidden style={{
                position: 'absolute', top: -22, right: -22,
                width: 110, height: 110, borderRadius: '50%',
                background: `radial-gradient(circle, ${c.accent}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <Group gap={6} mb={8}>
                <c.icon size={13} stroke={1.5} style={{ color: c.accent, opacity: 0.85 }} />
                <Text className="plos-stat-card-label">{c.label}</Text>
              </Group>
              <Text className="plos-stat-card-value" style={{ fontSize: 30, fontWeight: 800, color: DS.text1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.value}</Text>
            </Box>
          </Grid.Col>
        ))}
      </Grid>

      {/* ── People grid ── */}
      {isLoading ? (
        <Box h={200} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </Box>
      ) : isError ? (
        <Text size="sm" style={{ color: DS.red, padding: 16 }}>
          Failed to load people.
          {error instanceof Error && error.message ? ` ${error.message}` : ''}
          {' '}
          If the API is on another host, set VITE_API_BASE_URL or use dev with the Vite /api proxy (see .env.example).
        </Text>
      ) : list.length === 0 ? (
        <Box className="plos-empty-panel" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
          <Text fw={600} className="plos-empty-panel-title" style={{ marginBottom: 6 }}>No people yet</Text>
          <Text className="plos-empty-panel-sub" style={{ fontSize: '0.8rem' }}>Add your first person to start delegating responsibilities.</Text>
        </Box>
      ) : (
        <Grid gutter="sm">
          {list.map((p) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={p.id}>
              <PersonCard person={p} onDelete={() => deleteMutation.mutate(p.id)} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PeoplePage;
