import { useEffect, useState } from 'react';
import {
  Button, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  responsibilityService,
  type CreateResponsibilityPayload,
  type UpdateResponsibilityPayload,
} from '../../services/responsibility.service';
import { personService } from '../../services/person.service';
import type { Responsibility } from '../../types/dashboard';
import '@mantine/dates/styles.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** When set, modal PATCHes this row instead of POSTing a new one. */
  editing?: Responsibility | null;
}

const CATEGORIES = [
  { value: 'finance', label: '💰 Finance' },
  { value: 'health', label: '❤️ Health' },
  { value: 'habit', label: '🔄 Habit' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'admin', label: '📋 Admin' },
];

const RECURRENCES = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const emptyForm = () => ({
  title: '',
  category: null as string | null,
  dueDate: null as string | null,
  amount: '' as number | string,
  recurrence: 'none' as string | null,
  personId: null as string | null,
  notes: '',
});

/**
 * Modal to create a new responsibility or edit an existing one (PATCH).
 */
const CreateResponsibilityModal = ({ opened, onClose, editing = null }: Props) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(editing);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | string>('');
  const [recurrence, setRecurrence] = useState<string | null>('none');
  const [personId, setPersonId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const { data: persons } = useQuery({
    queryKey: ['persons'],
    queryFn: personService.getAll,
    staleTime: 60_000,
  });

  const personOptions = (persons ?? []).map((p) => ({
    value: String(p.id),
    label: `${p.name} (${p.relation})`,
  }));

  useEffect(() => {
    if (!opened) return;
    if (editing) {
      setTitle(editing.title);
      setCategory(editing.category);
      setDueDate(editing.dueDate ? editing.dueDate.slice(0, 10) : null);
      setAmount(editing.amount != null ? Number(editing.amount) : '');
      setRecurrence(editing.recurrence ?? 'none');
      setPersonId(editing.personId != null ? String(editing.personId) : null);
      setNotes(editing.notes ?? '');
    } else {
      const e = emptyForm();
      setTitle(e.title);
      setCategory(e.category);
      setDueDate(e.dueDate);
      setAmount(e.amount);
      setRecurrence(e.recurrence);
      setPersonId(e.personId);
      setNotes(e.notes);
    }
  }, [opened, editing]);

  const resetAndClose = () => {
    const e = emptyForm();
    setTitle(e.title);
    setCategory(e.category);
    setDueDate(e.dueDate);
    setAmount(e.amount);
    setRecurrence(e.recurrence);
    setPersonId(e.personId);
    setNotes(e.notes);
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateResponsibilityPayload) => responsibilityService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      notifications.show({ title: 'Created', message: `"${title}" has been added.`, color: 'teal' });
      resetAndClose();
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Error', message: err.message || 'Failed to create', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateResponsibilityPayload }) =>
      responsibilityService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      notifications.show({ title: 'Saved', message: 'Responsibility updated.', color: 'teal' });
      resetAndClose();
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Error', message: err.message || 'Failed to save', color: 'red' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !dueDate) return;

    if (editing) {
      const payload: UpdateResponsibilityPayload = {
        title: title.trim(),
        category,
        dueDate: new Date(dueDate).toISOString(),
        recurrence: recurrence ?? 'none',
        notes: notes.trim() || null,
        personId: personId ? Number(personId) : null,
        amount: amount === '' ? null : Number(amount),
      };
      updateMutation.mutate({ id: editing.id, payload });
      return;
    }

    const payload: CreateResponsibilityPayload = {
      title: title.trim(),
      category,
      dueDate: new Date(dueDate).toISOString(),
      ...(amount !== '' && { amount: Number(amount) }),
      ...(recurrence && recurrence !== 'none' && { recurrence }),
      ...(personId && { personId: Number(personId) }),
      ...(notes.trim() && { notes: notes.trim() }),
    };
    createMutation.mutate(payload);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={isEdit ? 'Edit Responsibility' : 'New Responsibility'}
      size="md"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      styles={{
        title: { fontWeight: 700, fontSize: 18 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="e.g. Pay electricity bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-autofocus
          />

          <Select
            label="Category"
            placeholder="Select category"
            data={CATEGORIES}
            value={category}
            onChange={setCategory}
            required
            allowDeselect={false}
          />

          <Group grow>
            <DateInput
              label="Due Date"
              placeholder="Pick a date"
              value={dueDate}
              onChange={setDueDate}
              required
              clearable
              minDate={isEdit ? undefined : new Date()}
            />
            <Select
              label="Recurrence"
              data={RECURRENCES}
              value={recurrence}
              onChange={setRecurrence}
              allowDeselect={false}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Amount (₹)"
              placeholder="Optional"
              value={amount}
              onChange={setAmount}
              min={0}
              decimalScale={2}
              prefix="₹ "
              thousandSeparator=","
              hideControls
            />
            <Select
              label="Person"
              placeholder="Assign to..."
              data={personOptions}
              value={personId}
              onChange={setPersonId}
              clearable
              searchable
              nothingFoundMessage="No people added"
            />
          </Group>

          <Textarea
            label="Notes"
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            minRows={2}
            autosize
          />

          <Button
            type="submit"
            color="violet"
            size="md"
            mt="xs"
            loading={pending}
            leftSection={isEdit ? <IconCheck size={16} /> : <IconPlus size={16} />}
            disabled={!title.trim() || !category || !dueDate}
          >
            {isEdit ? 'Save changes' : 'Create Responsibility'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateResponsibilityModal;
