import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    loading = false,
    fullWidth = false,
    type = 'button',
    className,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'nis-ui-btn',
        `nis-ui-btn--${variant}`,
        `nis-ui-btn--${size}`,
        fullWidth && 'nis-ui-btn--full',
        loading && 'is-loading',
        className,
      )}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading && <span className="nis-ui-btn__spinner" aria-hidden="true" />}
      {leftIcon && !loading && <span className="nis-ui-btn__icon">{leftIcon}</span>}
      <span className="nis-ui-btn__label">{children}</span>
      {rightIcon && !loading && <span className="nis-ui-btn__icon">{rightIcon}</span>}
    </button>
  );
});
