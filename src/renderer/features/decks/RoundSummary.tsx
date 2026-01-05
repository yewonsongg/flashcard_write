import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePracticeStore } from './usePracticeStore';
import type { Deck } from '@/shared/flashcards/types';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface RoundSummaryProps {
  deck: Deck;
}

export function RoundSummary({ deck }: RoundSummaryProps) {
  const session = usePracticeStore((state) => state.sessionsByDeckId[deck.id]);
  const continueFromSummary = usePracticeStore((state) => state.continueFromSummary);

  const stats = useMemo(() => {
    if (!session) return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };

    let totalCorrect = 0;
    let totalIncorrect = 0;

    Object.values(session.resultsByCardId).forEach((result) => {
      totalCorrect += result.correct;
      totalIncorrect += result.wrong;
    });

    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;

    return {
      total,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      accuracy,
    };
  }, [session]);

  const handleContinue = () => {
    continueFromSummary(deck.id, true);
  };

  if (!session) return null;

  const missedCount = session.missedOrder.length;

  return (
    <div className='flex h-full items-center justify-center px-4'>
      <div className='flex w-full max-w-2xl flex-col items-center gap-6'>
        {/* Title */}
        <div className='flex flex-col items-center gap-2 text-center'>
          <h2 className='text-2xl font-semibold text-foreground'>
            Round Complete!
          </h2>
          <p className='text-sm text-muted-foreground'>
            {missedCount > 0 
              ? `${missedCount} card${missedCount === 1 ? '' : 's'} to review`
              : 'All cards answered correctly!'}
          </p>
        </div>

        {/* Stats Card */}
        <Card className='w-full p-6'>
          <div className='flex flex-col gap-4'>
            {/* Accuracy */}
            <div className='flex flex-col items-center gap-2 border-b pb-4'>
              <div className='text-sm font-medium text-muted-foreground'>
                Accuracy
              </div>
              <div className='text-4xl font-bold text-foreground'>
                {stats.accuracy.toFixed(0)}%
              </div>
            </div>

            {/* Details */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col items-center gap-2 rounded-lg bg-green-500/10 p-4'>
                <CheckCircle className='h-6 w-6 text-green-500' />
                <div className='text-2xl font-semibold text-foreground'>
                  {stats.correct}
                </div>
                <div className='text-xs text-muted-foreground'>Correct</div>
              </div>

              <div className='flex flex-col items-center gap-2 rounded-lg bg-red-500/10 p-4'>
                <XCircle className='h-6 w-6 text-red-500' />
                <div className='text-2xl font-semibold text-foreground'>
                  {stats.incorrect}
                </div>
                <div className='text-xs text-muted-foreground'>Incorrect</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Continue Button */}
        <Button
          size='lg'
          onClick={handleContinue}
          className='w-full gap-2'
        >
          {missedCount > 0 ? 'Review Missed Cards' : 'Finish Session'}
          <ArrowRight className='h-5 w-5' />
        </Button>
      </div>
    </div>
  );
}
