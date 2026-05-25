import type { Story, StoryDefault } from '@ladle/react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';

export default {
  title: 'Button',
} satisfies StoryDefault;

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const Primary: Story = () => <Button variant="primary">Primary action</Button>;
export const Secondary: Story = () => <Button variant="secondary">Secondary action</Button>;
export const Ghost: Story = () => <Button variant="ghost">Ghost action</Button>;
export const Danger: Story = () => <Button variant="danger">Delete forever</Button>;

export const WithLeadingIcon: Story = () => (
  <Button leftIcon={PlusIcon}>Add person</Button>
);

export const Loading: Story = () => (
  <Button loading>Saving…</Button>
);

export const Disabled: Story = () => <Button disabled>Disabled</Button>;
export const FullWidth: Story = () => (
  <div style={{ width: 320 }}>
    <Button fullWidth>Full width</Button>
  </div>
);

export const AllVariants: Story = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {VARIANTS.map((v) => (
      <Button key={v} variant={v}>
        {v}
      </Button>
    ))}
  </div>
);

export const AllSizes: Story = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
    {SIZES.map((s) => (
      <Button key={s} size={s}>
        {s.toUpperCase()}
      </Button>
    ))}
  </div>
);
