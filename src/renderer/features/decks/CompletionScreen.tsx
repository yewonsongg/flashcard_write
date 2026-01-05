import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePracticeStore } from './usePracticeStore';
import { useTabsStore } from '../tabs/useTabsStore';
import type { Deck } from '@/shared/flashcards/types';
import { RotateCcw, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface CompletionScreenProps {
  deck: Deck;
  validCardIds: string[];
}

export function CompletionScreen({ deck, validCardIds }: CompletionScreenProps) {
  const session = usePracticeStore((state) => state.sessionsByDeckId[deck.id]);
  const resetSession = usePracticeStore((state) => state.resetSession);
  const endSession = usePracticeStore((state) => state.endSession);

  // Tab management
  const closeTab = useTabsStore((state) => state.closeTab);
  const setActiveTabId = useTabsStore((state) => state.setActiveTabId);

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

  const handleRestart = () => {
    resetSession(deck.id, validCardIds);
  };

  const handleEnd = () => {
    // End the practice session
    endSession(deck.id);

    // Close the practice tab (format: "practice:deckId")
    const practiceTabId = `practice:${deck.id}`;
    closeTab(practiceTabId);

    // Refocus the corresponding deck tab
    setActiveTabId(deck.id);
  };

  const getEncouragementMessage = (accuracy: number) => {
    if (accuracy === 100) return 'Perfect score!';
    if (accuracy >= 80) return 'Great job!';
    if (accuracy >= 60) return 'Good effort!';
    if (accuracy >= 40) return 'Keep practicing!';
    return 'Try again!';
  };

  return (
    <div className='flex h-full items-center justify-center px-4'>
      <div className='flex w-full max-w-2xl flex-col items-center gap-6'>
        {/* Trophy/Completion Icon */}
        <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
          <Trophy className='h-10 w-10 text-primary' />
        </div>

        {/* Title */}
        <div className='flex flex-col items-center gap-2 text-center'>
          <h2 className='text-2xl font-semibold text-foreground'>
            Session Complete!
          </h2>
          <p className='text-sm text-muted-foreground'>
            {getEncouragementMessage(stats.accuracy)}
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

        {/* Action Buttons */}
        <div className='flex w-full gap-3'>
          <Button
            size='lg'
            variant='outline'
            onClick={handleEnd}
            className='flex-1'
          >
            End
          </Button>
          <Button
            size='lg'
            onClick={handleRestart}
            className='flex-1 gap-2'
          >
            <RotateCcw className='h-5 w-5' />
            Practice Again
          </Button>
        </div>
      </div>
    </div>
  );
}
