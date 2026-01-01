import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchButtonProps = {
  onToggle: () => void
}

export function SidebarToggleButton({
  onToggle,
}: SearchButtonProps) {
  return (
    <button
      onClick={onToggle}
      className='ml-auto inline-flex h-5 w-5 items-center justify-center group cursor-pointer'
    >
      <Search
        className={cn(
          'h-5 w-5 transition-all duration-150',
          'stroke-foreground stroke-2 fill-none',
          'group-hover:stroke-[#A0A0A0]',
        )}
      />
    </button>
  )
}