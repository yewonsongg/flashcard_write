import { PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarToggleButtonProps = {
  isCollapsed: boolean;
  onToggle: () => void
}

export function SidebarToggleButton({
  isCollapsed, 
  onToggle,
}: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className='ml-auto inline-flex h-5 w-5 items-center justify-center group cursor-pointer'
    >
      <PanelLeftClose
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