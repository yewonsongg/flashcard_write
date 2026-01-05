import { TabsTrigger, TabsList, TabsContent } from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabRenderers } from "./tabRenderers";
import { useTabsStore } from "./useTabsStore";
import { useRef, useEffect } from "react";

export function TabsTriggers() {
  const tabs = useTabsStore((state) => state.tabs);
  const closeTab = useTabsStore((state) => state.closeTab);
  const closeOtherTabs = useTabsStore((state) => state.closeOtherTabs);
  const closeAllTabs = useTabsStore((state) => state.closeAllTabs);
  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabsList = tabsListRef.current;
    if (!tabsList) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      tabsList.scrollLeft += e.deltaY;
    };

    tabsList.addEventListener('wheel', handleWheel, { passive: false });
    return () => tabsList.removeEventListener('wheel', handleWheel);
  }, []);

  if (tabs.length === 0) {
    return (
      <div className='text-sm text-zinc-400'>
        No tab open. Select one from the sidebar.
      </div>
    );
  }

  return (
    <div className='flex items-center h-full w-full gap-2'>
      <TabsList ref={tabsListRef} className='inline-flex h-8 min-h-0 flex-1 min-w-0 gap-1 self-end overflow-x-auto scrollbar-hide'>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-1 px-2',
              'max-w-40',
              'rounded-t-md',
              'data-[state=active]:bg-accent/5',
              'data-[state=active]:text-accent-foreground',
            )}
          >
            <span className='flex h-full items-center leading-none truncate'>
              {tab.title}
            </span>
            <span
              className='flex items-center justify-center rounded-sm hover:bg-accent/10 hover:text-zinc-800'
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X className='h-3 w-3' strokeWidth={2} />
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className='ml-auto shrink-0 px-1 flex items-center align-baseline gap-2 text-xs text-zinc-500'>
        <button
          className='hover:text-zinc-800'
          onClick={() => {
            const activeId = useTabsStore.getState().activeTabId;
            if (activeId) { closeOtherTabs(activeId); }
          }}
        >
          Close Others
        </button>
        <button
          className='hover:text-zinc-800'
          onClick={() => closeAllTabs()}
        >
          Close All
        </button>
      </div>
    </div>
  )
}

export function TabsRenders() {
  const tabs = useTabsStore((state) => state.tabs);

  if (tabs.length === 0) {
    return (
      <div className='flex-1 min-h-0 flex items-center justify-center'>
        Select something from the sidebar to get started
      </div>
    )
  }
  
  return (
    <div className='flex-1 min-h-0 overflow-hidden'>
      {tabs.map((tab) => {
        const renderer = tabRenderers[tab.type as keyof typeof tabRenderers];
        if (!renderer) return null;

        return (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className='h-full bg-accent/5 text-accent-foreground'
          >
            {renderer(tab as any)}
          </TabsContent>
        );
      })}
    </div>
  )
}
