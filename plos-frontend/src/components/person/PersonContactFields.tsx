import { useEffect, useState } from 'react';
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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB — matches the backend Multer limit

const initials = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

/**
 * Name, required email, optional phone, relation, and optional avatar for a circle member.
 * Avatar gets a live circular preview + a size hint before save.
 */
export function PersonContactFields({
  value,
  onChange,
  onRemove,
  showRemove,
  index,
}: PersonContactFieldsProps) {
  const title = index != null ? `Person ${index + 1}` : 'Person';

  // Generate a preview URL whenever the file changes; revoke when it does.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!value.avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.avatarFile]);

  const tooLarge = Boolean(value.avatarFile && value.avatarFile.size > MAX_AVATAR_BYTES);
  const sizeKb = value.avatarFile ? Math.round(value.avatarFile.size / 102.4) / 10 : 0;

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
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <FileInput
            label="Photo (optional)"
            placeholder="Upload a picture"
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconPhoto size={16} />}
            value={value.avatarFile}
            onChange={(file) => onChange({ ...value, avatarFile: file })}
            clearable
            error={tooLarge ? `Max 2 MB — this one is ${sizeKb} KB.` : undefined}
            description={
              value.avatarFile && !tooLarge
                ? `${value.avatarFile.name} · ${sizeKb} KB`
                : 'PNG, JPEG, WEBP, or GIF — under 2 MB.'
            }
          />
        </div>
        <AvatarPreview
          previewUrl={previewUrl}
          fallback={initials(value.name) || '?'}
        />
      </div>
    </Stack>
  );
}

function AvatarPreview({
  previewUrl,
  fallback,
}: {
  previewUrl: string | null;
  fallback: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        flex: 'none',
        width: 56,
        height: 56,
        borderRadius: '50%',
        overflow: 'hidden',
        background: previewUrl
          ? `center/cover no-repeat url(${previewUrl})`
          : 'linear-gradient(135deg, #e9d5ff, #a5b4fc)',
        color: '#1a0f37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 600,
        border: '1px solid var(--border)',
        marginTop: 24, // align with the FileInput's input row (label sits above)
      }}
    >
      {!previewUrl && fallback}
    </div>
  );
}
