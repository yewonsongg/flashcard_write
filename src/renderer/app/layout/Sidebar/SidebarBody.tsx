import { Fragment, useEffect, useRef, useState, useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from '@/components/ui/context-menu';
import { DeckContextMenuItem } from '@/components/custom/deck-context-menu-item';
import { AlertDialog, AlertDialogHeader, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import type { Deck, Card, Database, SortMode, SortOrder } from '@/shared/flashcards/types';

type SidebarBodyProps = {
  isCollapsed: boolean;
  sortMode: SortMode;
  sortOrder: SortOrder;
};

{/* Hours + days granularity, clean fallbacks */}
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  // Seconds–Minutes–Hours granularity
  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  }
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  if (Math.abs(diffHr) < 24) {
    return rtf.format(diffHr, "hour");
  }

  // Days granularity
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  // For older decks, fallback to months/years (rare, but clean)
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }

  return rtf.format(diffYear, "year");
}

{/* Sort helper */}
function sortDecks(
  decks: Deck[],
  sortMode: SortMode,
  sortOrder: SortOrder
): Deck[] {
  const sorted = [...decks]; // copy, don't mutate original
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortMode) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'cardCount':
        cmp = a.cardIds.length - b.cardIds.length;
        break;
      case 'lastOpened':
        cmp = a.lastOpenedAt.localeCompare(b.lastOpenedAt);
        break;
      case 'lastModified':
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export function SidebarBody({ isCollapsed, sortMode, sortOrder }: SidebarBodyProps) {
  const mockDB: Database = {
    decks: {
      deck_1: {
        id: "deck_1",
        name: "French",
        cardIds: ["card_1", "card_2"],
        pinned: false,
        createdAt: "2025-01-01T12:00:00.000Z",
        updatedAt: "2025-01-02T12:00:00.000Z",
        lastOpenedAt: "2025-01-03T12:00:00.000Z"
      },
      deck_2: {
        id: "deck_2",
        name: "Biology",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-04T12:00:00.000Z",
        updatedAt: "2025-01-04T12:00:00.000Z",
        lastOpenedAt: "2025-01-04T12:00:00.000Z"
      },
      deck_3: {
        id: "deck_3",
        name: "Korean",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-05T12:00:00.000Z",
        updatedAt: "2025-01-05T12:00:00.000Z",
        lastOpenedAt: "2025-01-05T12:00:00.000Z"
      },
      deck_4: {
        id: "deck_4",
        name: "Neuroscience",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-06T12:00:00.000Z",
        updatedAt: "2025-01-06T12:00:00.000Z",
        lastOpenedAt: "2025-01-06T12:00:00.000Z"
      },
      deck_5: {
        id: "deck_5",
        name: "Chemistry",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-07T12:00:00.000Z",
        updatedAt: "2025-01-07T12:00:00.000Z",
        lastOpenedAt: "2025-01-07T12:00:00.000Z"
      },
      deck_6: {
        id: "deck_6",
        name: "Calculus",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-08T12:00:00.000Z",
        updatedAt: "2025-01-08T12:00:00.000Z",
        lastOpenedAt: "2025-01-08T12:00:00.000Z"
      },
      deck_7: {
        id: "deck_7",
        name: "6 7",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-09T12:00:00.000Z",
        updatedAt: "2025-01-09T12:00:00.000Z",
        lastOpenedAt: "2025-01-09T12:00:00.000Z"
      },
      deck_8: {
        id: "deck_8",
        name: "Skibidi",
        cardIds: [],
        pinned: false,
        createdAt: "2025-01-10T12:00:00.000Z",
        updatedAt: "2025-01-10T12:00:00.000Z",
        lastOpenedAt: "2025-01-10T12:00:00.000Z"
      }
    },
    cards: {
      card_1: {
        id: "card_1",
        front: "bonjour",
        back: "hello"
      },
      card_2: {
        id: "card_2",
        front: "au revoir",
        back: "goodbye"
      }
    }
  };

  const deckList = Object.values(mockDB.decks);
  const viewportRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [hasOverflow, setHasOverflow] = useState(false);
  const [activeDeck, setActiveDeck] = useState<string>('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  const sortedDecks = useMemo(
    () => sortDecks(deckList, sortMode, sortOrder),
    [deckList, sortMode, sortOrder]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const checkOverflow = () => {
      setHasOverflow(
        viewport.scrollHeight > viewport.clientHeight ||
        viewport.scrollWidth > viewport.clientWidth
      );
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(viewport);

    const mutationObserver = new MutationObserver(checkOverflow);
    mutationObserver.observe(viewport, { childList: true, subtree: true });

    window.addEventListener('resize', checkOverflow);

    return () => {
      window.removeEventListener('resize', checkOverflow);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [deckList.length]);

  if (isCollapsed) {
    return (
      <div className='min-w-0 w-full min-h-0 flex-1 flex-col'>

      </div>
    )
  }
  
  return (
    <ScrollArea viewportRef={viewportRef} className='min-w-0 w-full min-h-0 flex-1 flex flex-col overflow-y-auto'>
      <div className={`flex flex-col h-max ${hasOverflow ? 'pr-3' : 'pr-0'}`}>
        {sortedDecks.map((deck, index) => (
          <Fragment key={deck.id}>
            <ContextMenu>
              {/* Each deck row, each a trigger for context menu */}
              <ContextMenuTrigger asChild>
                <div 
                  className='group flex flex-col cursor-pointer'
                  onClick={() => setActiveDeck(deck.id)}
                >
                  <div 
                    className={`
                      h-12 flex flex-col px-4 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.18),0_-2px_10px_rgba(0,0,0,0.10),3px_0_10px_rgba(0,0,0,0.12)]
                      ${deck.id === activeDeck ? 'bg-accent/5' : ''}
                    `}
                  >
                    <div className={`
                      h-6 leading-none flex items-end font-medium group-hover:text-accent-foreground transition-colors duration-200
                      ${deck.id === activeDeck ? 'text-accent-foreground' : 'text-foreground'}  
                    `}>
                      {deck.name}
                    </div>
                    <div className={`
                      h-6 flex pt-1 leading-none items-start text-xs font-normal
                      ${deck.id === activeDeck ? 'text-accent-foreground' : 'text-foreground'}  
                    `}>
                      <div className=''>
                        {deck.cardIds.length} cards
                      </div>
                      {sortMode === 'lastOpened' && (
                        <div className='ml-auto'>
                          Last opened: {formatRelativeTime(deck.lastOpenedAt)}
                        </div>
                      )}
                      {sortMode === 'lastModified' && (
                        <div className='ml-auto'>
                          Last modified: {formatRelativeTime(deck.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < deckList.length - 1 && <div className='h-px w-full bg-zinc-200' />}
                </div>
              </ContextMenuTrigger>

              {/* Context menu content */}
              <ContextMenuContent className='bg-background border-border min-w-0 w-20 p-0.5'>
                {/* Rename action */}
                <DeckContextMenuItem >Rename</DeckContextMenuItem>

                {/* Duplicate action */}
                <DeckContextMenuItem >Duplicate</DeckContextMenuItem>

                {/* Delete action */}
                <DeckContextMenuItem
                  onSelect={() => {
                    setDeckToDelete(deck);
                    setDeleteOpen(true);
                  }}
                >
                  Delete
                </DeckContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Fragment>
        ))}
      </div>

      {/* Single alert dialog so only one overlay renders */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeckToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this deck and all of its cards from your files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                //TODO perform delete(deckToDelete)
                setDeleteOpen(false);
                setDeckToDelete(null);
                toast('Delete Deck', {
                  description: `Deck "${deckToDelete?.name}" (${deckToDelete?.cardIds.length} cards) has been deleted.`,
                  action: {
                    label: 'Undo',
                    onClick: () => console.log('Undo'),
                  },
                  unstyled: true,
                  classNames: {
                    toast: 'bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-[356px]',
                    title: 'text-foreground font-semibold text-sm',
                    description: 'text-muted-foreground text-xs mt-0.5',
                    actionButton: 'ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors duration-200 shrink-0',
                  },
                })
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}
