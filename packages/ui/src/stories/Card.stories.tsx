import type { Story, StoryDefault } from '@ladle/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';

export default {
  title: 'Card',
} satisfies StoryDefault;

export const Solid: Story = () => (
  <Card variant="solid" style={{ width: 320 }}>
    <h3 style={{ margin: 0, fontSize: 16 }}>Solid surface</h3>
    <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
      The default NIS dark card. Lives inside marketing pages.
    </p>
  </Card>
);

export const Glass: Story = () => (
  <Card variant="glass" style={{ width: 320 }}>
    <h3 style={{ margin: 0, fontSize: 16 }}>Glass surface</h3>
    <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
      Used inside PLOS module pages. Backdrop blur + lavender border.
    </p>
  </Card>
);

export const Outline: Story = () => (
  <Card variant="outline" style={{ width: 320 }}>
    <h3 style={{ margin: 0, fontSize: 16 }}>Outline</h3>
    <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
      Transparent background with a 1px rule.
    </p>
  </Card>
);

export const Interactive: Story = () => (
  <Card
    variant="solid"
    interactive
    style={{ width: 320 }}
    onClick={() => window.alert('clicked')}
  >
    <h3 style={{ margin: 0, fontSize: 16 }}>Interactive</h3>
    <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
      Lifts on hover, focus-visible ring for keyboard.
    </p>
  </Card>
);

export const PaddingScale: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
    {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
      <Card key={p} padding={p}>
        <span style={{ fontSize: 13 }}>padding = {p}</span>
      </Card>
    ))}
  </div>
);

export const RichContent: Story = () => (
  <Card variant="glass" padding="lg" style={{ width: 360 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <strong style={{ fontSize: 14 }}>Pay 2026-04 rent</strong>
      <Badge tone="warning" dot>Due soon</Badge>
    </div>
    <p style={{ margin: '8px 0 14px', fontSize: 12, opacity: 0.7 }}>
      ₹ 38,000 · monthly · for Priya
    </p>
    <Button variant="primary" size="sm">Mark complete</Button>
  </Card>
);
