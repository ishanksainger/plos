import { Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { FileInput } from '@mantine/core';
import { IconPhoto, IconTrash } from '@tabler/icons-react';

export const PERSON_RELATION_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'partner', label: 'Partner' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
] as const;

export interface PersonContactDraft {
  name: string;
  email: string;
  phone: string;
  relation: string;
  avatarFile: File | null;
}

export const emptyPersonContactDraft = (): PersonContactDraft => ({
  name: '',
  email: '',
  phone: '',
  relation: 'partner',
  avatarFile: null,
});

interface PersonContactFieldsProps {
  value: PersonContactDraft;
  onChange: (next: PersonContactDraft) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  index?: number;
}

/**
 * Name, required email, optional phone, relation, and optional avatar for a circle member.
 */
export function PersonContactFields({
  value,
  onChange,
  onRemove,
  showRemove,
  index,
}: PersonContactFieldsProps) {
  const title = index != null ? `Person ${index + 1}` : 'Person';

  return (
    <Stack
      gap="sm"
      p="md"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'var(--surface)',
      }}
    >
      <Group justify="space-between">
        <Text size="sm" fw={600} style={{ color: 'var(--text-primary)' }}>
          {title}
        </Text>
        {showRemove && onRemove && (
          <Text
            component="button"
            type="button"
            size="xs"
            c="red"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={onRemove}
          >
            <IconTrash size={14} />
            Remove
          </Text>
        )}
      </Group>
      <TextInput
        label="Name"
        placeholder="e.g. Mom"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        required
      />
      <TextInput
        label="Email"
        type="email"
        placeholder="name@example.com"
        description="Required for email reminders"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        required
      />
      <TextInput
        label="Phone (optional)"
        placeholder="+91 98765 43210"
        description="For WhatsApp / SMS when notifications ship"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
      />
      <Select
        label="Relation"
        data={[...PERSON_RELATION_OPTIONS]}
        value={value.relation}
        onChange={(v) => onChange({ ...value, relation: v ?? 'other' })}
        allowDeselect={false}
      />
      <FileInput
        label="Photo (optional)"
        placeholder="Upload a picture"
        accept="image/png,image/jpeg,image/webp,image/gif"
        leftSection={<IconPhoto size={16} />}
        value={value.avatarFile}
        onChange={(file) => onChange({ ...value, avatarFile: file })}
        clearable
      />
    </Stack>
  );
}
