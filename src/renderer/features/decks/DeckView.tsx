import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";

import { Trash2, CirclePlay } from 'lucide-react';

import type { Deck, DeckCard } from "@/shared/flashcards/types"
import { DeckCardsPane } from './DeckCardsPane';

export function DeckView({ deck }: { deck: Deck }) {
  const viewportRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [cards, setCards] = useState<DeckCard[]>([]);

  useEffect(() => {
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
          return;
        }
      } catch (error) {
        console.error('Failed to load cards for deck', error);
      }

      // Fallback: populate empty shells for the known card IDs
      setCards(deck.cardIds.map((id) => ({ id, front: '', back: '' })));
    };

    loadCardsForDeck();

    return () => {
      cancelled = true;
    };
  }, [deck.cardIds, deck.id]);
  const handleChangeCard = (id: string, field: 'front' | 'back', value: string) => {
    setCards((prev) => 
      prev.map((card) =>
        card.id === id
          ? { ...card, [field]: value }
          : card
      )
    );
  };
  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };
  const handleAddCard = () => {
    setCards((prev) => {
      const nextId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `card_${Date.now()}`;
      return [
        ...prev,
        {
          id: nextId,
          front: '',
          back: '',
        },
      ];
    });
  };
  return (
    <ScrollArea viewportRef={viewportRef} className='h-full overflow-auto'>
      <div className='flex flex-col gap-3 px-4 py-3'>
        <div className='flex align-center justify-center'>
          <InputGroup className='w-75 bg-background'>
            <InputGroupInput 
              id='title' 
              placeholder={deck.name} 
              className='placeholder:font-semibold placeholder:text-accent-foreground'
            />
            <InputGroupAddon align='block-start' className=''>
              <Label htmlFor='title' className='font-normal text-foreground'>
                Title
              </Label>
            </InputGroupAddon>
          </InputGroup>
          <div className='ml-auto flex align-center gap-2'>
            <Button
              variant='default'
              className=''
            >
              Practice
              <CirclePlay className='h-5 w-5' strokeWidth={1.5} />
            </Button>
            <span className='flex items-center justify-center rounded-full hover:bg-accent/10 hover:text-zinc-800 h-9 w-9'>
              <Trash2 className='h-6 w-6' strokeWidth={1.5} />
            </span>
          </div>
        </div>
        <DeckCardsPane 
          cards={cards}
          onChangeCard={handleChangeCard}
          onDeleteCard={handleDeleteCard}
          onAddCard={handleAddCard}
        />
      </div>
    </ScrollArea>
  )
}
