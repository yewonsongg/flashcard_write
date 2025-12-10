import { SidebarToggleButton } from '@/renderer/shared-ui/SidebarToggleButton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';

import type { SortMode, SortOrder } from '@/shared/flashcards/types';
import type { Dispatch, SetStateAction } from 'react';

type SidebarHeaderProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  sortMode: SortMode;
  sortOrder: SortOrder;
  setSortMode: Dispatch<SetStateAction<SortMode>>;
  setSortOrder: Dispatch<SetStateAction<SortOrder>>;
};

const SORT_MODE_LABELS: Record<SortMode, string> = {
  name: 'Name', 
  cardCount: 'Card count',
  lastOpened: 'Last opened',
  lastModified: 'Last modified',
};

function labelForMode(mode: SortMode) {
  switch (mode) {
    case 'name': return 'Name';
    case 'cardCount': return 'Card Count';
    case 'lastOpened': return 'Last opened';
    case 'lastModified': return 'Last Modified';
  }
}

export function SidebarHeader({
  isCollapsed,
  onToggle,
  sortMode, 
  setSortMode, 
  sortOrder, 
  setSortOrder
}: SidebarHeaderProps) {
  if (isCollapsed) {
    return (
      <div className='h-10 aspect-square mx-auto flex items-center justify-center shadow-[inset_0_-1px_0_0_#737373] p-2'>
        <SidebarToggleButton
          isCollapsed={isCollapsed}
          onToggle={onToggle}
        />
      </div>
    )
  }
  return (
    <div className='min-w-0 w-full h-10 flex items-center shadow-[inset_0_-1px_0_0_#737373] p-2 pl-4'>
      <div className='flex-1 flex justify-between mr-1'>
        <span className='text-sm font-medium text-foreground cursor-default'>
          Decks
        </span>
        <Popover>
          {/* Popover dropdown button */}
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm' className='p-0 h-5 min-w-[150px] flex text-xs text-foreground hover:text-[#A0A0A0]'>
              <div className='flex-1 flex items-center gap-1 text-left leading-none'>
                <span className='shrink-0'>Sort: </span>
                <span className='truncate'>{labelForMode(sortMode)}</span>
              </div>
              <ChevronDown className='shrink-0' />
            </Button>
          </PopoverTrigger>

          {/* Popover dropdown content */}
          <PopoverContent className='w-[150px] px-2 py-1 text-foreground bg-background'>
            {/* Sort by */}
            <div>
              <div className='text-xs uppercase font-semibold text-foreground cursor-default mb-1'>Sort by</div>
              <div className='text-xs flex flex-col gap-1 pb-1'>
                {(
                  ['name', 'cardCount', 'lastOpened', 'lastModified'] as SortMode[]
                ).map((mode) => {
                  const selected = sortMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSortMode(mode)}
                      className={
                        `flex items-center gap-2 rounded-md px-2 py-1 text-xs w-full text-left transition 
                        ${selected ? 'bg-accent/5 text-[#A0A0A0]' : 'text-foreground hover:bg-accent/3'}
                      `}
                    >
                      {/* radial indicator */}
                      <span
                        className={`h-2 w-2 rounded-full border ${selected ? 'border-[#A0A0A0] bg-[#A0A0A0]' : 'border-border'}`}
                      />
                      <span className='truncate'>
                        {SORT_MODE_LABELS[mode]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Separator className='bg-zinc-300' />
            {/* Order */}
            <div>
              <div className='text-xs uppercase font-semibold text-foreground pt-1 cursor-default mb-1'>Order</div>
              <div className='text-xs flex flex-col gap-1'>
                {(['asc', 'desc'] as SortOrder[]).map((order) => {
                  const selected = sortOrder === order;
                  const label = order === 'asc' ? 'Ascending' : 'Descending';
                  return (
                    <button 
                      key={order}
                      type='button'
                      onClick={() => setSortOrder(order)}
                      className={
                        `flex items-center gap-2 rounded-md px-2 py-1 text-xs w-full text-left
                        ${selected ? 'bg-accent/5 text-[#A0A0A0]' : 'text-foreground hover:bg-accent/3'}  
                      `}
                    >
                      {/* radial indicator */}
                      <span
                        className={`h-2 w-2 rounded-full border ${selected ? 'border-[#A0A0A0] bg-[#A0A0A0]' : 'border-border'}`}
                      />
                      <span className='truncate'>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <SidebarToggleButton
        isCollapsed={isCollapsed}
        onToggle={onToggle}
      />
    </div>
  )
}
