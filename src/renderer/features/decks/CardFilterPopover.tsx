import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

import type { CardSortMode, CardSortOrder } from '@/shared/flashcards/types';

type CardFilterPopoverProps = {
  sortMode: CardSortMode;
  sortOrder: CardSortOrder;
  setSortMode: (mode: CardSortMode) => void;
  setSortOrder: (order: CardSortOrder) => void;
};

const SORT_MODE_LABELS: Record<CardSortMode, string> = {
  default: 'Default order',
  createdDate: 'Created date',
  editedDate: 'Edited date',
  frontText: 'Front text',
  backText: 'Back text',
};

function labelForMode(mode: CardSortMode): string {
  return SORT_MODE_LABELS[mode];
}

export function CardFilterPopover({
  sortMode,
  setSortMode,
  sortOrder,
  setSortOrder,
}: CardFilterPopoverProps) {
  const isDefaultMode = sortMode === 'default';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [sortMode]);

  return (
    <Popover>
      {/* Popover dropdown button */}
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant='outline'
          size='sm'
          className='p-0 h-5 min-w-0 w-full flex text-xs text-foreground hover:text-[#A0A0A0]'
        >
          <div className='flex-1 flex items-center gap-1 text-left leading-none'>
            <span className='shrink-0'>Sort: </span>
            <span className='truncate'>{labelForMode(sortMode)}</span>
          </div>
          <ChevronDown className='shrink-0' />
        </Button>
      </PopoverTrigger>

      {/* Popover dropdown content */}
      <PopoverContent
        className='px-2 py-1 text-foreground bg-background'
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
      >
        {/* Sort by */}
        <div>
          <div className='text-xs uppercase font-semibold text-foreground cursor-default mb-1'>
            Sort by
          </div>
          <div className='text-xs flex flex-col gap-1 pb-1'>
            {(['default', 'createdDate', 'editedDate', 'frontText', 'backText'] as CardSortMode[]).map(
              (mode) => {
                const selected = sortMode === mode;
                return (
                  <button
                    key={mode}
                    type='button'
                    onClick={() => setSortMode(mode)}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs w-full text-left transition ${
                      selected
                        ? 'bg-accent/5 text-[#A0A0A0]'
                        : 'text-foreground hover:bg-accent/3'
                    }`}
                  >
                    {/* radial indicator */}
                    <span
                      className={`h-2 w-2 rounded-full border ${
                        selected ? 'border-[#A0A0A0] bg-[#A0A0A0]' : 'border-border'
                      }`}
                    />
                    <span className='truncate'>{SORT_MODE_LABELS[mode]}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>
        <Separator className='bg-zinc-300' />
        {/* Order */}
        <div>
          <div className='text-xs uppercase font-semibold text-foreground pt-1 cursor-default mb-1'>
            Order
          </div>
          <div className='text-xs flex flex-col gap-1'>
            {(['asc', 'desc'] as CardSortOrder[]).map((order) => {
              const selected = sortOrder === order;
              const label = order === 'asc' ? 'Ascending' : 'Descending';
              const disabled = isDefaultMode;
              return (
                <button
                  key={order}
                  type='button'
                  onClick={() => !disabled && setSortOrder(order)}
                  disabled={disabled}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs w-full text-left ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : selected
                      ? 'bg-accent/5 text-[#A0A0A0]'
                      : 'text-foreground hover:bg-accent/3'
                  }`}
                >
                  {/* radial indicator */}
                  <span
                    className={`h-2 w-2 rounded-full border ${
                      selected && !disabled ? 'border-[#A0A0A0] bg-[#A0A0A0]' : 'border-border'
                    }`}
                  />
                  <span className='truncate'>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
