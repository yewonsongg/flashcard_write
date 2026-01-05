import { Button } from '@/components/ui/button';
import { usePracticeStore } from './usePracticeStore';
import type { Deck } from '@/shared/flashcards/types';
import { CirclePlay } from 'lucide-react';

interface StartScreenProps {
  deck: Deck;
  validCardIds: string[];
}

export function StartScreen({ deck, validCardIds }: StartScreenProps) {
  const startSession = usePracticeStore((state) => state.startSession);


  const handleStart = () => {
    if (validCardIds.length === 0) return;
    startSession({
      deckId: deck.id,
      cardIds: validCardIds,
      promptSide: 'front',
      answerSide: 'back',
      shuffle: true,
    });
  };

  return (
    <div className='flex h-full items-center justify-center'>
      <div className='flex flex-col items-center gap-6 px-4 text-center'>
        <div className='flex flex-col gap-2'>
          <h2 className='text-2xl font-semibold text-foreground'>
            Ready to Practice?
          </h2>
          <p className='text-sm text-muted-foreground'>
            {validCardIds.length === 0
              ? 'No cards available to practice'
              : `${validCardIds.length} card${validCardIds.length === 1 ? '' : 's'} ready`
            }
          </p>
        </div>

        <Button
          size='lg'
          onClick={handleStart}
          disabled={validCardIds.length === 0}
          className='gap-2'
        >
          Start Practice
          <CirclePlay className='h-5 w-5' strokeWidth={1.5} />
        </Button>

        {validCardIds.length === 0 && (
          <p className='text-xs text-muted-foreground max-w-md'>
            Add some cards to this deck or adjust your search/filter to begin practicing.
          </p>
        )}
      </div>
    </div>
  );
}
