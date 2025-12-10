import React, { useRef, useState } from 'react';
import { createLogger } from '@/shared/logger';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Toaster } from 'sonner';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

import { DecksSidebar } from './layout/Sidebar/DecksSidebar'
import { ContentArea  } from './layout/Content/ContentArea'

const log = createLogger({ context: 'renderer:app' });

export default function App() {
  React.useEffect(() => {
    log.info('App mounted');
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isCollapased, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<ImperativePanelHandle | null>(null);

  const handleToggleSidebar = () => {
    const panel = sidebarRef.current;
    if (!panel) return;
    if (isCollapased) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <>
      <div className='w-screen h-screen flex overflow-hidden'>
        {/* Wrapper */}
        <ResizablePanelGroup
          direction='horizontal'
          className='flex flex-row flex-1 overflow-hidden'
        >
          {/* Decks Column */}
          <ResizablePanel
            ref={sidebarRef}
            defaultSize={25}
            minSize={10}
            collapsible
            collapsedSize={3}
            onCollapse={() => setIsCollapsed(true)}
            onExpand={() => setIsCollapsed(false)}
          >
            <DecksSidebar
              isCollapsed={isCollapased}
              onToggle={handleToggleSidebar}
            />
          </ResizablePanel>
          {/* Resize Handle */}
          <ResizableHandle 
            onDragging={setIsDragging}
            hitAreaMargins={{ coarse: 8, fine: 4 }}
            className={cn(
              'resizable-handle-overlay',
              'transition-colors ease-out duration-100',
              'cursor-col-resize select-none',
              'relative',
              isDragging && 'is-dragging'
            )}
          />
          {/* Body */}
          <ResizablePanel defaultSize={75}>
            <ContentArea />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <Toaster 
        position='bottom-right'
        richColors
      />
    </>
  )
}