import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePracticeStore } from './usePracticeStore';
import { useDeckStore } from './useDeckStore';
import type { Deck, DeckCard } from '@/shared/flashcards/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface ActivePracticeProps {
  deck: Deck;
}

export function ActivePractice({ deck }: ActivePracticeProps) {
  console.count('active practice render')
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canSkipWithEnter = useRef(false);

  const session = usePracticeStore((state) => state.sessionsByDeckId[deck.id]);
  const progress = usePracticeStore((state) => state.getProgress(deck.id));
  const currentCardId = usePracticeStore((state) => state.getCurrentCardId(deck.id));
  const submitAnswer = usePracticeStore((state) => state.submitAnswer);
  const startMissedRound = usePracticeStore((state) => state.startMissedRound);
  const endSession = usePracticeStore((state) => state.endSession);

  const database = useDeckStore((state) => state.database);

  // Fetch current card from database
  const currentCard: DeckCard | undefined = useMemo(() => {
    if (!currentCardId || !database) return undefined;
    return database.cards[currentCardId];
  }, [currentCardId, database]);

  // Reset state when card changes
  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    canSkipWithEnter.current = false;
    setUserAnswer('');
    setIsSubmitted(false);
    setWasCorrect(null);
    setIsRetrying(false);
    setShowingFeedback(false);
  }, [currentCardId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Global Enter key handler for skipping feedback delay
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow skipping for both correct AND incorrect feedback (when showing feedback and can skip)
      if (e.key === 'Enter' && showingFeedback && timeoutRef.current && canSkipWithEnter.current) {
        // Skip the delay and immediately move to next card
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        canSkipWithEnter.current = false;

        if (!currentCard || !progress || !session) return;

        // Determine if this is the last card BEFORE submitting
        const isLastCard = progress.current === progress.total;
        const answerContent = currentCard[session.answerSide];

        submitAnswer({
          deckId: deck.id,
          cardId: currentCard.id,
          submitted: userAnswer,
          correctAnswer: answerContent,
        });

        // Call handleMoveNext indirectly by triggering the same logic
        if (isLastCard) {
          if (session.phase === 'all') {
            startMissedRound(deck.id, true);
          } else if (session.phase === 'missed') {
            startMissedRound(deck.id, true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [showingFeedback, wasCorrect, progress, session, deck.id, currentCard, userAnswer, submitAnswer, startMissedRound]);

  if (!session || !currentCard || !progress) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>Loading practice session...</p>
      </div>
    );
  }

  const promptContent = currentCard[session.promptSide];
  const answerContent = currentCard[session.answerSide];

  const handleSubmit = () => {
    if (!userAnswer.trim() || (isSubmitted && !isRetrying)) return;

    // Check the answer locally first (normalize it)
    const normalizedSubmitted = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = answerContent.trim().toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = normalizedSubmitted === normalizedCorrect;

    // Determine if this is the last card BEFORE submitting (which increments index)
    const isLastCard = progress.current === progress.total;

    if (isRetrying) {
      // On retry attempt
      setIsSubmitted(true);
      setWasCorrect(isCorrect);
      setShowingFeedback(true);

      // Enable Enter key skip after a short delay to prevent immediate triggering
      setTimeout(() => {
        canSkipWithEnter.current = true;
      }, 100);

      // Wait 2.5 seconds BEFORE submitting to store (which advances the card)
      timeoutRef.current = setTimeout(() => {
        canSkipWithEnter.current = false;
        submitAnswer({
          deckId: deck.id,
          cardId: currentCard.id,
          submitted: userAnswer,
          correctAnswer: answerContent,
        });
        handleMoveNext(isLastCard);
      }, 2500);
      return;
    }

    // First attempt
    setIsSubmitted(true);
    setWasCorrect(isCorrect);

    if (isCorrect) {
      // Correct on first try - show feedback THEN submit to store
      setShowingFeedback(true);

      // Enable Enter key skip after a short delay to prevent immediate triggering
      setTimeout(() => {
        canSkipWithEnter.current = true;
      }, 100);

      // Wait 2.5 seconds BEFORE submitting to store (which advances the card)
      timeoutRef.current = setTimeout(() => {
        canSkipWithEnter.current = false;
        submitAnswer({
          deckId: deck.id,
          cardId: currentCard.id,
          submitted: userAnswer,
          correctAnswer: answerContent,
        });
        handleMoveNext(isLastCard);
      }, 2500);
    } else {
      // Incorrect on first try - DON'T submit to store yet, just show retry UI
      // The card will only be marked wrong if they skip or fail the retry
      setShowingFeedback(false);
    }
  };

  const handleMoveNext = (wasLastCard?: boolean) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setShowingFeedback(false);

    // If we just finished the last card, check if we should start missed round or end
    if (wasLastCard === true) {
      if (session.phase === 'all') {
        // After completing all cards, start missed round
        startMissedRound(deck.id, true);
      } else if (session.phase === 'missed') {
        // After completing missed round, check if there are new missed cards
        startMissedRound(deck.id, true);
      }
    }
    // Otherwise the card has already auto-advanced due to index increment in submitAnswer
  };

  const handleRetry = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    setWasCorrect(null);
    setIsRetrying(true);
    setShowingFeedback(false);
  };

  const handleSkip = () => {
    // Determine if this is the last card BEFORE submitting
    const isLastCard = progress.current === progress.total;

    // User chose to skip without retrying - submit the wrong answer to store
    submitAnswer({
      deckId: deck.id,
      cardId: currentCard.id,
      submitted: userAnswer,
      correctAnswer: answerContent,
    });

    // Move to next card
    handleMoveNext(isLastCard);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitted) {
      // Not submitted yet - submit the answer
      handleSubmit();
    }
    // Note: Enter key handling for skipping feedback is done via global keydown listener
  };

  const handleEndSession = () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    endSession(deck.id);
  };

  const phaseLabel = session.phase === 'all' ? 'Practice' : 'Missed Cards';

  return (
    <div className='flex h-full flex-col px-4 py-6'>
      {/* Header with progress */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='text-xs text-muted-foreground'>{phaseLabel}</div>
          <div className='text-sm font-medium text-foreground'>
            {progress.current} / {progress.total}
          </div>
        </div>
        <Button variant='ghost' size='sm' onClick={handleEndSession}>
          End Session
        </Button>
      </div>

      {/* Progress bar */}
      {/* <div className='mb-6 h-2 w-full overflow-hidden rounded-full bg-accent'>
        <div
          className='h-full bg-primary transition-all duration-300'
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div> */}

      {/* Card display */}
      <div className='flex flex-1 flex-col items-center justify-center gap-6'>
        <Card className='w-full max-w-2xl p-8'>
          <div className='flex flex-col gap-6'>
            {/* Prompt */}
            <div className='flex flex-col gap-2'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>
                Question
              </div>
              <div className='text-lg text-foreground'>{promptContent}</div>
            </div>

            {/* Answer input section */}
            <div className='flex flex-col gap-2'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>
                Your Answer
              </div>
              <Input
                type='text'
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Type your answer and press Enter'
                disabled={isSubmitted}
                className='text-lg'
                autoFocus
              />
            </div>

            {/* Show result after submission */}
            {isSubmitted && (
              <div className='flex flex-col gap-2'>
                <div className='text-xs font-medium uppercase text-muted-foreground'>
                  Correct Answer
                </div>
                <div className='text-lg text-foreground'>{answerContent}</div>
                {wasCorrect !== null && (
                  <div className={`flex items-center gap-2 text-sm ${wasCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {wasCorrect ? (
                      <>
                        <CheckCircle className='h-4 w-4' />
                        <span>Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className='h-4 w-4' />
                        <span>Incorrect</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Controls */}
        <div className='flex w-full max-w-2xl flex-col gap-4'>
          {!isSubmitted ? (
            <Button
              size='lg'
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className='w-full gap-2'
            >
              Submit Answer
            </Button>
          ) : wasCorrect === false && !isRetrying && !showingFeedback ? (
            // Incorrect on first try - show retry options
            <div className='flex flex-col gap-3'>
              <Button
                size='lg'
                onClick={handleRetry}
                className='w-full gap-2'
              >
                Try Again
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={handleSkip}
                className='w-full gap-2'
              >
                Skip to Next Card
              </Button>
            </div>
          ) : showingFeedback ? (
            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <span>Moving to next card in 2.5s...</span>
              <span className='text-xs'>Press Enter to continue now</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
