import { Button, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import {
  PersonContactFields,
  emptyPersonContactDraft,
  type PersonContactDraft,
} from './PersonContactFields';

interface HouseholdMembersSectionProps {
  members: PersonContactDraft[];
  onChange: (members: PersonContactDraft[]) => void;
}

/**
 * Optional household member rows shown when account type is family or shared.
 */
export function HouseholdMembersSection({ members, onChange }: HouseholdMembersSectionProps) {
  const addMember = () => onChange([...members, emptyPersonContactDraft()]);

  const updateAt = (index: number, draft: PersonContactDraft) => {
    const next = [...members];
    next[index] = draft;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <Stack gap="sm" mt="xs">
      <Text size="sm" fw={600} style={{ color: 'var(--text-primary)' }}>
        People in your circle
      </Text>
      <Text size="xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        Add family or collaborators now, or skip and add them later under People. Email is required;
        phone is optional for future notifications.
      </Text>
      {members.map((m, i) => (
        <PersonContactFields
          key={i}
          index={i}
          value={m}
          onChange={(draft) => updateAt(i, draft)}
          showRemove={members.length > 1}
          onRemove={() => removeAt(i)}
        />
      ))}
      <Button
        type="button"
        variant="light"
        color="violet"
        size="sm"
        leftSection={<IconPlus size={14} />}
        onClick={addMember}
      >
        Add another person
      </Button>
    </Stack>
  );
}
