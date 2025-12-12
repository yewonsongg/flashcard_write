import { Tabs, TabsTrigger, TabsList, TabsContent } from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import { useDeckTabsStore } from "../decks/useDeckTabsStore";
import { DeckView } from "../decks/DeckView";
import { cn } from "@/lib/utils";

export function TabsTriggers() {
  const tabs = useDeckTabsStore((state) => state.tabs);
  const closeTab = useDeckTabsStore((state) => state.closeTab);
  const closeOtherTabs = useDeckTabsStore((state) => state.closeOtherTabs);
  const closeAllTabs = useDeckTabsStore((state) => state.closeAllTabs);

  if (tabs.length === 0) {
    return (
      <div className='text-sm text-zinc-400'>
        No deck open. Select one from the sidebar.
      </div>
    );
  }

  return (
    <div className='flex items-center h-full w-full gap-2'>
      <TabsList className='inline-flex h-8 min-h-0 flex-1 min-w-0 gap-1 overflow-x-auto self-end'>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-1 max-w-40 px-2',
              'rounded-t-md',
              'data-[state=active]:bg-accent/5',
              'data-[state=active]:text-accent-foreground',
            )}
          >
            <span className='flex h-full items-center leading-none truncate'>
              {tab.deck.name}
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
      <div className='ml-auto shrink-0 px-1 flex items-center gap-2 text-xs text-zinc-500'>
        <button
          className='hover:text-zinc-800'
          onClick={() => {
            const activeId = useDeckTabsStore.getState().activeTabId;
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
  const tabs = useDeckTabsStore((state) => state.tabs);

  if (tabs.length === 0) {
    return (
      <div className='flex-1 min-h-0 flex items-center justify-center'>
        Select a deck from the sidebar to get started
      </div>
    )
  }
  
  return (
    <div className='flex-1 min-h-0 overflow-hidden'>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className='h-full bg-accent/5 text-accent-foreground'
        >
          <DeckView deck={tab.deck} />
        </TabsContent>
      ))}
    </div>
  )
}
