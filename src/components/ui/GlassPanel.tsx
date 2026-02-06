import { forwardRef, type ElementType, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { GH } from '@/config/golden-hour';

type GlassPanelProps<T extends ElementType = 'div'> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  padding?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'style'>;

export const GlassPanel = forwardRef<HTMLElement, GlassPanelProps>(
  ({ as: Component = 'div', children, className, padding = 16, borderRadius = 18, style, ...rest }, ref) => {
    const Tag = Component as ElementType;

    return (
      <Tag
        ref={ref}
        className={className}
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          boxShadow: GH.glassShadow,
          borderRadius,
          padding,
          ...style,
        }}
        {...rest}
      />
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
