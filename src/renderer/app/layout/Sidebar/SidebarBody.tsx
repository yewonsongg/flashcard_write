import { Fragment, useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from '@/components/ui/context-menu';
import { DeckContextMenuItem } from '@/components/custom/deck-context-menu-item';
import { AlertDialog, AlertDialogHeader, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import { DEFAULT_DATABASE } from '@/shared/flashcards/defaultData';
import type { Deck, Database, SortMode, SortOrder } from '@/shared/flashcards/types';
import { useDeckStore } from '@/renderer/features/decks/useDeckStore';
import { useTabsStore } from '@/renderer/features/tabs/useTabsStore';

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
  const viewportRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [hasOverflow, setHasOverflow] = useState(false);

  const database = useDeckStore((state) => state.database);
  const loadError = useDeckStore((state) => state.loadError);
  const loadDatabaseFromDisk = useDeckStore((state) => state.loadDatabase);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);
  const restoreDatabase = useDeckStore((state) => state.restoreDatabase);

  const deckList = useMemo(
    () => Object.values(database?.decks ?? {}),
    [database]
  );

  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [deckToRename, setDeckToRename] = useState<string | null>(null);

  const sortedDecks = useMemo(
    () => sortDecks(deckList, sortMode, sortOrder),
    [deckList, sortMode, sortOrder]
  );

  const openTab = useTabsStore((state) => state.openTab);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const closeTab = useTabsStore((state) => state.closeTab);
  
  const renameDeck = useDeckStore((state) => state.renameDeck);
  // const refreshDeckInTabs = useDeckTabsStore((state) => state.refreshDeck);

  const renameInputRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const preventFocusReturnRef = useRef(false);

  const duplicateDeck = useDeckStore((state) => state.duplicateDeck);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await loadDatabaseFromDisk();
      if (cancelled) return;
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [loadDatabaseFromDisk]);

  useEffect(() => {
    const handler = () => {
      loadDatabaseFromDisk();
    };
    window.addEventListener('flashcards:database-updated', handler);
    return () => window.removeEventListener('flashcards:database-updated', handler);
  }, [loadDatabaseFromDisk]);

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;

    try {
      const result = await deleteDeck(deckToDelete.id);
      setDeleteOpen(false);
      setDeckToDelete(null);

      if (!result) {
        return;
      }

      const { deckName, cardCount, previous } = result;
      closeTab(deckToDelete.id);

      toast('Delete Deck', {
        description: `Deck "${deckName}" (${cardCount} cards) has been deleted.`,
        action: {
          label: 'Undo',
          onClick: () => {
            restoreDatabase(previous);
            openTab('deck', deckToDelete);
          },
        },
        unstyled: true,
        classNames: {
          toast: 'bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-[356px]',
          title: 'text-foreground font-semibold text-sm',
          description: 'text-muted-foreground text-xs mt-0.5',
          actionButton: 'ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors duration-200 shrink-0',
        },
      });
    } catch (error) {
      toast('Save failed', {
        description: 'Could not persist deck deletion to disk.',
      });
    }
  };

  const startRename = (deck: Deck) => {
    preventFocusReturnRef.current = true;
    setDeckToRename(deck.id);
    setRenameValue(deck.name);
  };

  const cancelRename = () => {
    preventFocusReturnRef.current = false;
    setDeckToRename(null);
    setRenameValue('');
  };

  useEffect(() => {
    if (!deckToRename) return;

    // Wait for ContextMenu to fully close and release focus before focusing input
    // This prevents race condition where menu returns focus to trigger after input renders
    const timeoutId = setTimeout(() => {
      const el = renameInputRefs.current[deckToRename];
      if (el) {
        el.focus({ preventScroll: true });
        // Select all text in contenteditable
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      // Reset the ref after focus is applied
      preventFocusReturnRef.current = false;
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [deckToRename]);

  const handleRenameDeck = async (deckId: string) => {
    const trimmedValue = renameValue.trim();

    if (!trimmedValue) {
      cancelRename();
      return;
    }

    // Optimistically exit rename mode immediately to prevent flicker
    cancelRename();

    try {
      const result = await renameDeck(deckId, trimmedValue);
      // if (result) {
        // refreshDeckInTabs(result.deck);
      // }
    } catch (error) {
      console.error('Failed to rename deck', error);
      toast('Rename failed', {
        description: 'Could not persist deck rename to disk.',
      });
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, deckId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameDeck(deckId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  const handleDuplicateDeck = async (deck: Deck) => {
    try {
      const result = await duplicateDeck(deck.id);
      
      if (result) {
        const { deck: newDeck } = result;
        openTab('deck', newDeck);
        
        toast('Deck Duplicated', {
          description: `Deck "${newDeck.name}" with ${newDeck.cardIds.length} cards has been created.`,
          unstyled: true,
          classNames: {
            toast: 'bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-[356px]',
            title: 'text-foreground font-semibold text-sm',
            description: 'text-muted-foreground text-xs mt-0.5',
          },
        });
      }
    } catch (error) {
      console.error('Failed to duplicate deck', error);
      toast('Duplicate failed', {
        description: 'Could not create deck duplicate.',
      });
    }
  };

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
        {loadError && (
          <div className='px-4 py-2 text-xs text-muted-foreground'>
            {loadError}
          </div>
        )}
        {sortedDecks.map((deck, index) => (
          <Fragment key={deck.id}>
            <ContextMenu>
              {/* Each deck row, each a trigger for context menu */}
              <ContextMenuTrigger asChild>
                <div 
                  className='group flex flex-col cursor-pointer'
                  onClick={() => openTab('deck', deck)}
                >
                  <div 
                    className={`
                      h-12 flex flex-col px-4 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.18),0_-2px_10px_rgba(0,0,0,0.10),3px_0_10px_rgba(0,0,0,0.12)]
                      ${deck.id === activeTabId ? 'bg-accent/5' : ''}
                    `} 
                  >
                    <div 
                      className={cn(
                        'h-6 leading-tight flex items-end font-medium group-hover:text-accent-foreground transition-colors duration-200 min-w-0 truncate',
                        deck.id === activeTabId ? 'text-accent-foreground' : 'text-foreground',
                      )}>
                      {deckToRename === deck.id ? (
                        <div
                          ref={(el) => {
                            if (el) {
                              renameInputRefs.current[deck.id] = el;
                              // Sync content if it differs
                              if (el.textContent !== renameValue) {
                                el.textContent = renameValue;
                              }
                            } else {
                              delete renameInputRefs.current[deck.id];
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => {
                            const newValue = e.currentTarget.textContent || '';
                            if (newValue !== renameValue) {
                              setRenameValue(newValue);
                            }
                          }}
                          onBlur={() => handleRenameDeck(deck.id)}
                          onKeyDown={(e) => handleRenameKeyDown(e as any, deck.id)}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="outline-none"
                          dir="ltr"
                        />
                      ) : (
                        deck.name
                      )}
                    </div>
                    <div className={`
                      h-6 flex pt-1 leading-none items-start text-xs font-normal
                      ${deck.id === activeTabId ? 'text-accent-foreground' : 'text-foreground'}  
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
              <ContextMenuContent
                className='bg-background border-border min-w-0 w-20 p-0.5'
                onCloseAutoFocus={(e) => {
                  // Prevent focus from returning to trigger when entering rename mode
                  if (preventFocusReturnRef.current) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Rename action */}
                <DeckContextMenuItem
                  onSelect={() => startRename(deck)}
                >
                  Rename
                </DeckContextMenuItem>

                {/* Duplicate action */}
                <DeckContextMenuItem 
                  onSelect={() => handleDuplicateDeck(deck)}
                >
                  Duplicate
                </DeckContextMenuItem>

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
              onClick={handleDeleteDeck}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}
