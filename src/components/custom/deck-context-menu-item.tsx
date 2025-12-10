import { ContextMenuItem } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { type ComponentProps, ComponentRef } from 'react';

type ContextMenuItemProps = ComponentProps<typeof ContextMenuItem>;
type ContextMenuItemElement = ComponentRef<typeof ContextMenuItem>;

export const DeckContextMenuItem = forwardRef<ContextMenuItemElement, ContextMenuItemProps>(
  ({ className, ...props }, ref) => (
    <ContextMenuItem
      ref={ref}
      className={cn(
        'flex items-center gap-2',
        'transition-colors duration-200',
        'text-xs text-foreground hover:bg-accent/5 hover:text-accent-foreground px-1 py-1',
        className
      )}
      {...props}
    />
  )
);

DeckContextMenuItem.displayName = 'DeckContextMenuItem';