import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { usePlan } from '../hooks/usePlan';
import { subscribe } from '../services/billing.service';
import { formatPaise } from '../utils/format-currency';

type Cycle = 'monthly' | 'yearly';
type PaidPlan = 'pro' | 'family';

/** Fallback pricing (paise) mirrors plos-backend PLAN_PRICING / docs. */
const FALLBACK_PRICING = {
  pro: { monthlyPaise: 29900, yearlyPaise: 287000 },
  family: { monthlyPaise: 49900, yearlyPaise: 479000 },
};

const FEATURES: Record<'free' | PaidPlan, { tagline: string; points: string[] }> = {
  free: {
    tagline: 'The full daily habit. Generous enough to get hooked.',
    points: [
      'Today view, habits & streaks',
      'Search, ⌘K, dark mode',
      'Basic insights dashboard',
      'Up to 3 people',
      'Up to 50 responsibilities',
      'In-app + email + critical-deadline WhatsApp',
      '1 tracker import',
      'Data export (JSON / CSV)',
    ],
  },
  pro: {
    tagline: 'Unlimited everything + WhatsApp. For the freelancer who lives in it.',
    points: [
      'Everything in Free',
      'Unlimited people & responsibilities',
      'Unlimited tracker imports',
      'Full insights dashboard',
      'All WhatsApp reminders — digests, nudges, custom',
      'Priority email support',
    ],
  },
  family: {
    tagline: 'Pro + shared logins & household permissions. For dual-income homes.',
    points: [
      'Everything in Pro',
      'Up to 5 shared logins',
      'Household permissions',
      'Priority email support',
    ],
  },
};

function priceLabel(monthlyPaise: number, yearlyPaise: number, cycle: Cycle): string {
  if (cycle === 'yearly') {
    return `${formatPaise(Math.round(yearlyPaise / 12))}/mo`;
  }
  return `${formatPaise(monthlyPaise)}/mo`;
}

export default function PricingPage() {
  const { tier, pricing, billingEnabled, isLoading } = usePlan();
  const [cycle, setCycle] = useState<Cycle>('yearly');

  const live = pricing ?? FALLBACK_PRICING;

  const subscribeMutation = useMutation({
    mutationFn: ({ plan }: { plan: PaidPlan }) => subscribe(plan, cycle),
    onSuccess: (res) => {
      notifications.show({
        title: res.founding ? "You're a founding member" : 'Billing',
        message: res.message,
        color: res.founding ? 'violet' : 'teal',
      });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Checkout', message: err.message, color: 'red' }),
  });

  const currentLabel = (plan: 'free' | PaidPlan): string | null => {
    if (tier === plan) return 'Current plan';
    if (plan !== 'free' && tier === 'founding') return 'Included (founding)';
    return null;
  };

  const renderCta = (plan: 'free' | PaidPlan) => {
    const current = currentLabel(plan);
    if (current) {
      return (
        <Button variant="light" color="gray" fullWidth disabled>
          {current}
        </Button>
      );
    }
    if (plan === 'free') {
      return (
        <Button variant="default" fullWidth disabled>
          Free forever
        </Button>
      );
    }
    // Paid plan, not current.
    const founding = !billingEnabled;
    return (
      <Button
        color="violet"
        fullWidth
        variant={plan === 'pro' ? 'filled' : 'light'}
        loading={subscribeMutation.isPending}
        onClick={() => subscribeMutation.mutate({ plan })}
      >
        {founding ? 'Free for founding members' : `Upgrade to ${plan === 'pro' ? 'Pro' : 'Family'}`}
      </Button>
    );
  };

  return (
    <div className="plos-page-enter">
      <div className="plos-page-eyebrow">Plans</div>
      <Text className="plos-page-title" mb={6}>
        Simple pricing for a calmer life
      </Text>
      <Text c="dimmed" size="sm" mb="lg" style={{ maxWidth: 620 }}>
        Start free — the daily habit is fully yours. Upgrade when you outgrow the
        limits. Annual saves ~20%, and UPI autopay keeps it effortless.
      </Text>

      {!billingEnabled && (
        <Card withBorder radius="md" mb="lg" style={{ background: 'rgba(124,79,255,0.06)' }}>
          <Group gap="sm" wrap="nowrap">
            <Badge color="violet" variant="filled" radius="sm">
              Founding member
            </Badge>
            <Text size="sm" c="dimmed">
              PLOS is free during early access — Pro is on us, and we'll never charge
              you retroactively. These plans show what's coming.
            </Text>
          </Group>
        </Card>
      )}

      <Group justify="center" mb="lg">
        <SegmentedControl
          value={cycle}
          onChange={(v) => setCycle(v as Cycle)}
          data={[
            { label: 'Annual · save 20%', value: 'yearly' },
            { label: 'Monthly', value: 'monthly' },
          ]}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        <PlanCard
          name="Free"
          price="₹0"
          priceNote="forever"
          tagline={FEATURES.free.tagline}
          points={FEATURES.free.points}
          cta={renderCta('free')}
          dimmed={isLoading}
        />
        <PlanCard
          name="Pro"
          highlight
          price={priceLabel(live.pro.monthlyPaise, live.pro.yearlyPaise, cycle)}
          priceNote={cycle === 'yearly' ? `${formatPaise(live.pro.yearlyPaise)} billed yearly` : 'billed monthly'}
          tagline={FEATURES.pro.tagline}
          points={FEATURES.pro.points}
          cta={renderCta('pro')}
          dimmed={isLoading}
        />
        <PlanCard
          name="Family"
          price={priceLabel(live.family.monthlyPaise, live.family.yearlyPaise, cycle)}
          priceNote={cycle === 'yearly' ? `${formatPaise(live.family.yearlyPaise)} billed yearly` : 'billed monthly'}
          tagline={FEATURES.family.tagline}
          points={FEATURES.family.points}
          cta={renderCta('family')}
          dimmed={isLoading}
        />
      </SimpleGrid>

      <Text c="dimmed" size="xs" mt="lg" ta="center">
        Prices in INR. Your own data export stays free on every plan.
      </Text>
    </div>
  );
}

function PlanCard({
  name,
  price,
  priceNote,
  tagline,
  points,
  cta,
  highlight,
  dimmed,
}: {
  name: string;
  price: string;
  priceNote: string;
  tagline: string;
  points: string[];
  cta: React.ReactNode;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      style={{
        opacity: dimmed ? 0.6 : 1,
        borderColor: highlight ? 'var(--brand, #7c4fff)' : undefined,
        borderWidth: highlight ? 2 : 1,
        position: 'relative',
      }}
    >
      {highlight && (
        <Badge
          color="violet"
          variant="filled"
          radius="sm"
          style={{ position: 'absolute', top: -10, right: 16 }}
        >
          Most popular
        </Badge>
      )}
      <Text fw={800} size="lg">
        {name}
      </Text>
      <Group gap={6} align="baseline" mt={4} mb={2}>
        <Text fw={800} size="28px" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {price}
        </Text>
      </Group>
      <Text size="xs" c="dimmed">
        {priceNote}
      </Text>
      <Text size="sm" mt="sm" mb="md" style={{ minHeight: 40 }}>
        {tagline}
      </Text>

      <Stack gap={8} mb="lg">
        {points.map((p) => (
          <Group key={p} gap={8} wrap="nowrap" align="flex-start">
            <Box mt={2} style={{ color: 'var(--brand, #7c4fff)', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </Box>
            <Text size="sm" c="dimmed">
              {p}
            </Text>
          </Group>
        ))}
      </Stack>

      {cta}
    </Card>
  );
}
