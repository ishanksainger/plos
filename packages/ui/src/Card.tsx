import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'solid' | 'glass' | 'outline';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
  children?: ReactNode;
}

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'solid',
    padding = 'md',
    interactive = false,
    as = 'div',
    className,
    children,
    ...rest
  },
  ref,
) {
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={cx(
        'nis-ui-card',
        `nis-ui-card--${variant}`,
        `nis-ui-card--p-${padding}`,
        interactive && 'nis-ui-card--interactive',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});
