import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Deck, DeckCard } from '@/shared/flashcards/types';

export function PracticeView({ deck }: { deck: Deck }) {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [deckTitle, setDeckTitle] = useState(deck.name);

  // loads from the database
  useEffect(() => {
    let cancelled = false;

    const loadCardsForDeck = async () => {
      try {
        if (window.flashcards) {
          const db = await window.flashcards.loadDatabase();
          if (cancelled) return;

          const deckInDb = db.decks[deck.id];
          const cardIds = deckInDb?.cardIds ?? deck.cardIds;
          const loadedCards = cardIds
            .map((id) => db.cards[id])
            .filter((card): card is DeckCard => Boolean(card));

          setCards(loadedCards);
          if (deckInDb) {
            setDeckTitle(deckInDb.name);
          } else {
            setDeckTitle(deck.name);
          }
          return;
        }
      } catch (error) {
        console.error('Failed to load cards for practice', error);
      }

      setDeckTitle(deck.name);
      setCards(deck.cardIds.map((id) => ({ id, front: '', back: '' })));
    };

    loadCardsForDeck();

    const handler = () => loadCardsForDeck();
    window.addEventListener('flashcards:database-updated', handler);

    return () => {
      cancelled = true;
      window.removeEventListener('flashcards:database-updated', handler);
    };
  }, [deck.id, deck.cardIds, deck.name]);

  return (
    <ScrollArea className='h-full overflow-auto'>
      <div className='flex flex-col gap-4 px-4 py-4'>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <div className='text-xs text-muted-foreground'>Practice</div>
            <div className='truncate text-lg font-semibold text-foreground'>
              {deckTitle}
            </div>
          </div>
          <div className='shrink-0 text-xs text-muted-foreground'>
            {cards.length} cards
          </div>
        </div>

        {cards.length === 0 ? (
          <div className='text-sm text-muted-foreground'>
            No cards to practice yet.
          </div>
        ) : (
          <div className='grid gap-3'>
            {cards.map((card, index) => {
              return (
                <div></div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
