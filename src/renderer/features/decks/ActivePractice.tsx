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
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [wasIncorrectOnFirstTry, setWasIncorrectOnFirstTry] = useState(false);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canSkipWithEnter = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const session = usePracticeStore((state) => state.sessionsByDeckId[deck.id]);
  const progress = usePracticeStore((state) => state.getProgress(deck.id));
  const currentCardId = usePracticeStore((state) => state.getCurrentCardId(deck.id));
  const submitAnswer = usePracticeStore((state) => state.submitAnswer);
  const markIncorrectWithoutAdvancing = usePracticeStore((state) => state.markIncorrectWithoutAdvancing);
  const advanceToNextCard = usePracticeStore((state) => state.advanceToNextCard);
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
    setWasIncorrectOnFirstTry(false);
    setShowingFeedback(false);

    // Auto-focus the input when card changes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      // Allow skipping feedback delay when showing feedback
      if (e.key === 'Enter' && showingFeedback && timeoutRef.current && canSkipWithEnter.current) {
        // Skip the delay and immediately move to next card
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        canSkipWithEnter.current = false;

        if (!currentCard || !progress || !session) return;

        // Determine if this is the last card BEFORE advancing
        const isLastCard = progress.current === progress.total;
        const answerContent = currentCard[session.answerSide];

        if (wasIncorrectOnFirstTry) {
          // Was incorrect on first try, successfully retried - just advance without submitting
          advanceToNextCard(deck.id);
        } else {
          // First attempt correct - submit and advance
          submitAnswer({
            deckId: deck.id,
            cardId: currentCard.id,
            submitted: userAnswer,
            correctAnswer: answerContent,
          });
        }

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
  }, [showingFeedback, wasCorrect, isSubmitted, wasIncorrectOnFirstTry, progress, session, deck.id, currentCard, userAnswer, submitAnswer, advanceToNextCard, startMissedRound]);

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
    if (!userAnswer.trim()) return;

    // Check the answer locally first (normalize it)
    const normalizedSubmitted = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = answerContent.trim().toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = normalizedSubmitted === normalizedCorrect;

    // Determine if this is the last card BEFORE advancing
    const isLastCard = progress.current === progress.total;

    if (wasIncorrectOnFirstTry) {
      // This is a retry after getting it wrong - only accept correct answers
      if (!isCorrect) {
        // Still wrong - do nothing, button stays disabled
        return;
      }

      // Retry successful - show feedback and advance WITHOUT incrementing correct counter
      setIsSubmitted(true);
      setWasCorrect(true);
      setShowingFeedback(true);

      // Enable Enter key skip after a short delay to prevent immediate triggering
      setTimeout(() => {
        canSkipWithEnter.current = true;
      }, 100);

      // Wait 2.5 seconds BEFORE advancing to next card
      timeoutRef.current = setTimeout(() => {
        canSkipWithEnter.current = false;
        // Advance to next card (card was already marked as incorrect)
        advanceToNextCard(deck.id);
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
      // Incorrect on first try - mark as wrong WITHOUT advancing the card
      markIncorrectWithoutAdvancing({
        deckId: deck.id,
        cardId: currentCard.id,
      });

      // Mark that this card was incorrect on first try, reset to allow retry
      setWasIncorrectOnFirstTry(true);
      setIsSubmitted(false);
      setUserAnswer('');
      setShowingFeedback(false);
      
      // Auto-focus the input for retry
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitted) {
      // Calculate if answer is correct
      const normalizedSubmitted = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedCorrect = answerContent.trim().toLowerCase().replace(/\s+/g, ' ');
      const isCorrect = normalizedSubmitted === normalizedCorrect;
      
      // Only allow submission if not in retry mode OR if in retry mode and answer is correct
      if (!wasIncorrectOnFirstTry || isCorrect) {
        handleSubmit();
      }
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
                ref={inputRef}
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

            {/* Show result after submission or when incorrect on first try */}
            {(isSubmitted || wasIncorrectOnFirstTry) && (
              <div className='flex flex-col gap-2'>
                <div className='text-xs font-medium uppercase text-muted-foreground'>
                  Correct Answer
                </div>
                <div className='text-lg text-foreground'>{answerContent}</div>
                {wasCorrect !== null && !wasIncorrectOnFirstTry && (
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
                {wasIncorrectOnFirstTry && !showingFeedback && (
                  <div className='flex items-center gap-2 text-sm text-orange-600'>
                    <XCircle className='h-4 w-4' />
                    <span>Type the correct answer to continue</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Controls */}
        <div className='flex w-full max-w-2xl flex-col gap-4'>
          {!isSubmitted && !wasIncorrectOnFirstTry ? (
            <Button
              size='lg'
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className='w-full gap-2'
            >
              Submit Answer
            </Button>
          ) : wasIncorrectOnFirstTry && !showingFeedback ? (
            // Retrying after incorrect - button disabled until correct answer is typed
            <Button
              size='lg'
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || userAnswer.trim().toLowerCase().replace(/\s+/g, ' ') !== answerContent.trim().toLowerCase().replace(/\s+/g, ' ')}
              className='w-full gap-2'
            >
              Submit Answer
            </Button>
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
