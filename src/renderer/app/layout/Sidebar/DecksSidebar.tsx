import { SidebarHeader } from './SidebarHeader'
import { SidebarBody } from './SidebarBody'
import { useState } from 'react';
import type { SortMode, SortOrder } from '@/shared/flashcards/types';

type DecksSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function DecksSidebar({
  isCollapsed,
  onToggle,
}: DecksSidebarProps) {
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  return (
    <aside className='bg-background min-w-0 w-full min-h-0 h-full flex flex-col'>
      <SidebarHeader 
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        sortMode={sortMode}
        setSortMode={setSortMode}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <SidebarBody 
        isCollapsed={isCollapsed} 
        sortMode={sortMode}
        sortOrder={sortOrder}
      />
    </aside>
  )
}