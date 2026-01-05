import { useEffect } from 'react';
import { usePracticeStore } from './usePracticeStore';
import { StartScreen } from './StartScreen';
import { ActivePractice } from './ActivePractice';
import { CompletionScreen } from './CompletionScreen';
import { RoundSummary } from './RoundSummary';
import type { Deck } from '@/shared/flashcards/types';

interface PracticeSessionProps {
  deck: Deck;
  validCardIds: string[];
}

export function PracticeSession({ deck, validCardIds }: PracticeSessionProps) {
  const session = usePracticeStore((state) => state.sessionsByDeckId[deck.id]);
  const rehydrateSession = usePracticeStore((state) => state.rehydrateSession);

  // Rehydrate session whenever validCardIds change
  useEffect(() => {
    if (session && validCardIds.length > 0) {
      rehydrateSession({ deckId: deck.id, validCardIds });
    }
  }, [validCardIds, deck.id, session, rehydrateSession]);

  // No session or session ended - show start screen
  if (!session) {
    return <StartScreen deck={deck} validCardIds={validCardIds} />;
  }

  // Session completed - show completion screen
  if (session.phase === 'done') {
    return <CompletionScreen deck={deck} validCardIds={validCardIds} />;
  }

  // Phase summary - show stats between phases
  if (session.phase === 'summary') {
    return <RoundSummary deck={deck} />;
  }

  // Active session - show practice view
  return <ActivePractice deck={deck} />;
}
