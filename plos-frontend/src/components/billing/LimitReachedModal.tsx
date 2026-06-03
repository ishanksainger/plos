import { Modal, Button, Text, Stack, Group, ThemeIcon } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useLimitModalState, closeLimitModal } from '../../lib/limit-modal';

const RESOURCE_LABEL: Record<string, string> = {
  people: 'people',
  responsibilities: 'responsibilities',
  imports: 'tracker imports',
};

/**
 * Fires when any create hits the free-plan ceiling (PLAN_LIMIT_REACHED 403),
 * opened globally from the MutationCache. Stays dormant until billing is live.
 */
export default function LimitReachedModal() {
  const state = useLimitModalState();
  const navigate = useNavigate();

  const resourceLabel = state.resource ? RESOURCE_LABEL[state.resource] ?? state.resource : 'items';
  const headline =
    state.limit != null
      ? `You've reached the free limit of ${state.limit} ${resourceLabel}`
      : `You've reached a free-plan limit`;

  const goToPlans = () => {
    closeLimitModal();
    navigate('/pricing');
  };

  return (
    <Modal
      opened={state.open}
      onClose={closeLimitModal}
      title="Time to upgrade"
      centered
      radius="md"
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light" color="violet">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7l-9-5Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </ThemeIcon>
          <div>
            <Text fw={700} size="md">{headline}</Text>
            <Text size="sm" c="dimmed" mt={4}>
              {state.message ??
                'Upgrade to Pro for unlimited people, responsibilities, imports, and full WhatsApp reminders.'}
            </Text>
          </div>
        </Group>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" color="gray" onClick={closeLimitModal}>
            Not now
          </Button>
          <Button color="violet" onClick={goToPlans}>
            See plans
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
