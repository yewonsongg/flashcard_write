import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { DeckCard } from "@/shared/flashcards/types";

interface DeckCardsPaneProps {
  cards: DeckCard[],
  onChangeCard: (id: string, field: 'front' | 'back', value: string) => void,
  onDeleteCard: (id: string) => void;
  onAddCard: () => void;
}

export const DeckCardsPane: React.FC<DeckCardsPaneProps> = ({
  cards, 
  onChangeCard,
  onDeleteCard,
  onAddCard,
}) => {
  return (
    <div className='flex-1 flex flex-col min-w-0 gap-3'>
      <EmptyCard onAdd={onAddCard} />

      {cards.map((card) => (
        <Card 
          key={card.id}
          className='border-border bg-background/80 gap-1 py-0'
        >
          <CardHeader className='px-3 pt-3 w-full flex flex-row items-center justify-between'>
            <span className="text-xs font-medium text-muted-foreground">
              Card #{card.id}
            </span>
          </CardHeader>
          <CardContent className='px-3 pb-3 w-full flex flex-row items-center justify-between gap-2'>
            <div className='flex flex-1 min-w-0 flex-col gap-1'>
              <label className='text-[11px] font-medium text-muted-foreground'>
                Front
              </label>
              <Textarea
                value={card.front}
                onChange={(e) => 
                  onChangeCard(card.id, 'front', e.target.value)
                }
                rows={2}
                className='w-full resize-none text-xs'
                placeholder='Front text'
              />
            </div>
            <div className='flex flex-1 min-w-0 flex-col gap-1'>
              <label className='text-[11px] font-medium text-muted-foreground'>
                Back
              </label>
              <Textarea
                value={card.back}
                onChange={(e) => 
                  onChangeCard(card.id, 'back', e.target.value)
                }
                rows={2}
                className='w-full resize-none text-xs'
                placeholder='Back text'
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface EmptyCardProps {
  onAdd: () => void;
}

const EmptyCard: React.FC<EmptyCardProps> = ({ onAdd }) => {
  return (
    <Card className='border-dashed border-muted-foreground/40 bg-muted/20'>
      <CardContent className='px-3 py-4 flex items-center justify-between gap-3'>
        <div className='flex flex-col'>
          <span className='text-xs font-medium text-muted-foreground'>
            Add a new card
          </span>
          <span className='text-[11px] text-muted-foreground/80'>
            Quickly append a blank card to this deck.
          </span>
        </div>
        <Button 
          size='sm'
          variant='outline'
          onClick={onAdd}
        >
          + Add
        </Button>
      </CardContent>
    </Card>
  )
}
