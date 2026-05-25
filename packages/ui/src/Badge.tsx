import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  children?: ReactNode;
}

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', size = 'sm', dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(
        'nis-ui-badge',
        `nis-ui-badge--${tone}`,
        `nis-ui-badge--${size}`,
        className,
      )}
      {...rest}
    >
      {dot && <span className="nis-ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
});
