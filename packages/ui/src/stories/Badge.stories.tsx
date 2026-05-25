import type { Story, StoryDefault } from '@ladle/react';
import { Badge, type BadgeTone } from '../Badge';

export default {
  title: 'Badge',
} satisfies StoryDefault;

const TONES: BadgeTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];

export const Neutral: Story = () => <Badge tone="neutral">Neutral</Badge>;
export const Accent: Story = () => <Badge tone="accent">New</Badge>;
export const Info: Story = () => <Badge tone="info">Info</Badge>;
export const Success: Story = () => <Badge tone="success">Done</Badge>;
export const Warning: Story = () => <Badge tone="warning">Due soon</Badge>;
export const Danger: Story = () => <Badge tone="danger">Overdue</Badge>;

export const WithDot: Story = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {TONES.map((tone) => (
      <Badge key={tone} tone={tone} dot>
        {tone}
      </Badge>
    ))}
  </div>
);

export const AllTones: Story = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {TONES.map((tone) => (
      <Badge key={tone} tone={tone}>
        {tone}
      </Badge>
    ))}
  </div>
);

export const SizeMd: Story = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {TONES.map((tone) => (
      <Badge key={tone} tone={tone} size="md">
        {tone}
      </Badge>
    ))}
  </div>
);
