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
      className='absolute bottom-2 left-2 z-10 inline-flex h-5 w-5 items-center justify-center group cursor-pointer'
    >
      <CirclePlus
        className={cn(
          'h-5 w-5 transition-all duration-150',
          'stroke-foreground stroke-2 fill-none',
          'group-hover:stroke-[#A0A0A0]',
          isCollapsed && 'rotate-180'
        )}
      />
    </button>
  )
}