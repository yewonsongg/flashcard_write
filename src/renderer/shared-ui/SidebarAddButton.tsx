import { CirclePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarAddButtonProps = {
  isCollapsed: boolean;
  onToggle: () => void
}

export function SidebarAddButton({
  isCollapsed, 
  onToggle,
}: SidebarAddButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn('absolute bottom-2.5 left-2.5 z-10 inline-flex items-center justify-center group cursor-pointer bg-background rounded-full',
        isCollapsed ? 'h-5 w-5' : 'h-10 w-10'
      )}
    >
      <CirclePlus
        className={cn(
          'h-5 w-5 transition-all duration-150',
          'stroke-foreground stroke-2',
          'group-hover:stroke-[#A0A0A0]',
          isCollapsed ? 'h-5 w-5' : 'h-10 w-10'
        )}
      />
    </button>
  )
}