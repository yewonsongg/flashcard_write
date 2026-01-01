import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";

import { Trash2, CirclePlay, Plus, CirclePlus, Search } from 'lucide-react';

import type { Deck, DeckCard } from "@/shared/flashcards/types"
import { DeckCardsPane } from './DeckCardsPane';
import { CardFilterPopover } from './CardFilterPopover';
import { useDeckStore } from "./useDeckStore";
import { useSearchStore } from "./useSearchStore";
import { DeckDeleteButton } from '@/renderer/shared-ui/DeckDeleteButton';
import { useTabsStore } from "../tabs/useTabsStore";

export function DeckView({ deck }: { deck: Deck }) {
  const viewportRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [lastAddedCardId, setLastAddedCardId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(deck.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateTabPayload  = useTabsStore((state) => state.updateTabPayload);
  const closeTab          = useTabsStore((state) => state.closeTab);

  const deleteDeck        = useDeckStore((state) => state.deleteDeck);
  const renameDeck        = useDeckStore((state) => state.renameDeck);
  const restoreDatabase   = useDeckStore((state) => state.restoreDatabase);
  const database          = useDeckStore((state) => state.database);

  const searchQuery       = useSearchStore((state) => state.getSearchQuery(deck.id));
  const setSearchQuery    = useSearchStore((state) => state.setSearchQuery);
  const sortSettings      = useSearchStore((state) => state.getSortSettings(deck.id));
  const setSortMode       = useSearchStore((state) => state.setSortMode);
  const setSortOrder      = useSearchStore((state) => state.setSortOrder);

  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return cards;
    }

    const query = searchQuery.toLowerCase();
    return cards.filter((card) => {
      const frontMatch = card.front.toLowerCase().includes(query);
      const backMatch = card.back.toLowerCase().includes(query);
      return frontMatch || backMatch;
    });
  }, [cards, searchQuery]);

  // Sort filtered cards based on sort settings
  const sortedAndFilteredCards = useMemo(() => {
    const toSort = [...filteredCards];

    if (sortSettings.sortMode === 'default') {
      return toSort;
    }

    toSort.sort((a, b) => {
      let comparison = 0;

      switch (sortSettings.sortMode) {
        case 'createdDate':
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
        case 'editedDate':
          comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
          break;
        case 'frontText':
          comparison = a.front.localeCompare(b.front);
          break;
        case 'backText':
          comparison = a.back.localeCompare(b.back);
          break;
      }

      return sortSettings.sortOrder === 'asc' ? comparison : -comparison;
    });

    return toSort;
  }, [filteredCards, sortSettings]);

  const persistCards = async (nextCards: DeckCard[]) => {
    if (!window.flashcards) return;

    try {
      const db = await window.flashcards.loadDatabase();
      const deckInDb = db.decks[deck.id];
      if (!deckInDb) {
        console.warn(`Deck ${deck.id} not found in database; cannot save cards.`);
        return;
      }

      const nextIds = nextCards.map((c) => c.id);
      const nextIdSet = new Set(nextIds);
      const cardsMap = { ...db.cards };

      // Remove cards that were part of this deck but are no longer present
      deckInDb.cardIds.forEach((id) => {
        if (!nextIdSet.has(id)) {
          delete cardsMap[id];
        }
      });

      // Upsert current cards
      nextCards.forEach((card) => {
        cardsMap[card.id] = card;
      });

      const updatedDeck: Deck = {
        ...deckInDb,
        cardIds: nextIds,
        updatedAt: new Date().toISOString(),
      };

      await window.flashcards.saveDatabase({
        decks: { ...db.decks, [deck.id]: updatedDeck },
        cards: cardsMap,
      });

      updateTabPayload('deck', updatedDeck);
      window.dispatchEvent(new CustomEvent('flashcards:database-updated'));
    } catch (error) {
      console.error('Failed to save cards for deck', error);
    }
  };
  useEffect(() => {
    // Reset on deck change and load from database
    isInitialLoadRef.current = true;
    
    let cancelled = false;

    const loadCardsForDeck = async () => {
      try {
        if (window.flashcards) {
          const db = await window.flashcards.loadDatabase();
          if (cancelled) return;

          const loadedCards = deck.cardIds
            .map((id) => db.cards[id])
            .filter((card): card is DeckCard => Boolean(card));

          setCards(loadedCards);
          isInitialLoadRef.current = false;
          return;
        }
      } catch (error) {
        console.error('Failed to load cards for deck', error);
      }

      // Fallback: populate empty shells for the known card IDs
      setCards(deck.cardIds.map((id) => ({ id, front: '', back: '' })));
      isInitialLoadRef.current = false;
    };

    loadCardsForDeck();

    return () => {
      cancelled = true;
    };
  }, [deck.id]);
  useEffect(() => {
    setTitle(deck.name);
  }, [deck.id, deck.name]);
  const updateCardField = (id: string, field: 'front' | 'back', value: string, { persist }: { persist?: boolean } = {}) => {
    setCards((prev) => {
      const updated = prev.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      );
      if (persist) {
        persistCards(updated);
      }
      return updated;
    });
  };
  const handleChangeCard = (id: string, field: 'front' | 'back', value: string) => {
    updateCardField(id, field, value, { persist: false });
  };
  const handleBlurCard = (id: string, field: 'front' | 'back', value: string) => {
    // Update the updatedAt timestamp when a card is edited
    setCards((prev) => {
      const updated = prev.map((card) =>
        card.id === id
          ? { ...card, [field]: value, updatedAt: new Date().toISOString() }
          : card
      );
      persistCards(updated);
      return updated;
    });
  };
  const handleDeleteCard = (id: string) => {
    setCards((prev) => {
      const updated = prev.filter((card) => card.id !== id);
      persistCards(updated);
      return updated;
    });
  };
  const handleAddCard = () => {
    // Clear the last added card ID first to ensure useEffect triggers on rapid clicks
    setLastAddedCardId(null);

    const nextId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `card_${Date.now()}`;

    const timestamp = new Date().toISOString();

    setCards((prev) => {
      const updated = [
        ...prev,
        {
          id: nextId,
          front: '',
          back: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];

      // Debounce persist to avoid race conditions on rapid clicks
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = setTimeout(() => {
        persistCards(updated);
        persistTimerRef.current = null;
      }, 500);

      return updated;
    });

    // Set the new card ID in next tick to ensure state change is detected
    setTimeout(() => setLastAddedCardId(nextId), 0);
  };
  const handleTitleChange = (value: string) => {
    setTitle(value);
  };
  const handleTitleBlur = async () => {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === deck.name) {
      setTitle(deck.name);
      return;
    }

    try {
      const result = await renameDeck(deck.id, nextTitle);
      if (result) {
        updateTabPayload('deck', result.deck);
      }
    } catch (error) {
      console.error('Failed to rename deck', error);
      toast('Rename failed', {
        description: 'Could not save deck title to disk.',
      });
      setTitle(deck.name); // Revert on error
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
      e.currentTarget.blur();
    }
  };
  const handleDeleteDeck = async () => {
    try {
      const result = await deleteDeck(deck.id);
      if (result) {
        closeTab(deck.id);
        toast('Delete Deck', {
          description: `Deck "${result.deckName}" (${result.cardCount} cards) has been deleted.`,
          action: {
            label: 'Undo',
            onClick: () => restoreDatabase(result.previous),
          },
          unstyled: true,
          classNames: {
            toast: 'bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-[356px]',
            title: 'text-foreground font-semibold text-sm',
            description: 'text-muted-foreground text-xs mt-0.5',
            actionButton: 'ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors duration-200 shrink-0',
          },
        });
      }
    } catch (error) {
      console.error('Failed to delete deck from DeckView', error);
      toast('Save failed', {
        description: 'Could not persist deck deletion to disk.',
      });
    }
    setDeleteOpen(false);
  };
  useEffect(() => {
    if (!lastAddedCardId) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scrollToBottom = () => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    };

    const raf = requestAnimationFrame(scrollToBottom);
    
    // Clear the lastAddedCardId after enough time for both scroll and focus
    const clearId = setTimeout(() => {
      setLastAddedCardId(null);
    }, 200);
    
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clearId);
    };
  }, [lastAddedCardId, cards.length]);

  return (
    <ScrollArea viewportRef={viewportRef} className='h-full overflow-auto'>
      <div className='flex flex-col gap-3 px-4 py-3'>
        <div className='flex align-center justify-center'>
          <InputGroup className='w-75 bg-accent/5 has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:bg-background'>
            <InputGroupInput
              id='title'
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder={deck.name}
              className='font-semibold placeholder:font-semibold placeholder:text-accent-foreground'
            />
            <InputGroupAddon align='block-start' className=''>
              <Label htmlFor='title' className='font-semibold text-foreground'>
                Title
              </Label>
            </InputGroupAddon>
          </InputGroup>
          <div className='ml-auto flex flex-col justify-between'>
            <div className='flex align-center gap-2'>
              <Button
                variant='default'
                className='gap-1 has-[>svg]:px-2'
                onClick={() => console.log('Clicked Practice')}
              >
                Practice
                <CirclePlay className='h-5 w-5' strokeWidth={1.5} />
              </Button>
              <Button
                variant='outline'
                className='gap-1 has-[>svg]:px-2'
                onClick={handleAddCard}
              >
                New Card
                <CirclePlus className='h-5 w-5' strokeWidth={1.5} />
              </Button>
              <DeckDeleteButton
                setDeleteOpen={setDeleteOpen}
              />
            </div>
            <div className='flex items-center justify-end gap-2'>
              <CardFilterPopover
                sortMode={sortSettings.sortMode}
                sortOrder={sortSettings.sortOrder}
                setSortMode={(mode) => setSortMode(deck.id, mode)}
                setSortOrder={(order) => setSortOrder(deck.id, order)}
              />
            </div>
          </div>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search cards...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(deck.id, e.target.value)}
            className='pl-9 bg-accent/5 focus-visible:bg-background'
          />
        </div>
        <DeckCardsPane
          cards={sortedAndFilteredCards}
          onChangeCard={handleChangeCard}
          onBlurCard={handleBlurCard}
          autoFocusCardId={lastAddedCardId}
          onDeleteCard={handleDeleteCard}
          onAddCard={handleAddCard}
        />
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deck and all of its cards from your files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeck}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}
