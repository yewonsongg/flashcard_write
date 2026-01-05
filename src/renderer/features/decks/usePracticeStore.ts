import { create } from 'zustand';
import { normalize } from '@/lib/utils';

type PracticePhase = 'all' | 'missed' | 'summary' | 'done';
type AnswerSide = 'front' | 'back';

type CardResult = {
    correct: number;
    wrong: number;
}

type PracticeSession = {
    deckId: string;
    sessionId: string;

    promptSide: AnswerSide;
    answerSide: AnswerSide;

    phase: PracticePhase;

    // active run
    queue: string[];
    index: number;

    // tracking missed cards
    missedSet: Record<string, true>;
    missedOrder: string[];

    // session-scoped stats
    resultsByCardId: Record<string, CardResult>;
}

interface PracticeStoreState {
    // v1 is indicated in case in the future i want to add an additional feature (which would be v2)
    version: 1;
    activeDeckId?: string | null;
    sessionsByDeckId: Record<string, PracticeSession | undefined>;

    getActiveSession: () => PracticeSession | undefined;
    getCurrentCardId: (deckId?: string) => string | undefined;
    getProgress: (deckId?: string) => 
        | { current: number; total: number; phase: PracticePhase }
        | undefined;

    startSession: (args: {
        deckId: string;
        cardIds: string[];
        promptSide?: AnswerSide;
        answerSide?: AnswerSide;
        shuffle?: boolean;
    }) => void;

    submitAnswer: (args: {
        deckId: string;
        cardId: string;
        submitted: string;
        correctAnswer: string;
    }) => { isCorrect: boolean; normalized: string };

    markIncorrectWithoutAdvancing: (args: {
        deckId: string;
        cardId: string;
    }) => void;

    advanceToNextCard: (deckId: string) => void;

    startMissedRound: (deckId: string, shuffle?: boolean) => void;
    continueFromSummary: (deckId: string, shuffle?: boolean) => void;
    resetSession: (deckId: string, cardIds: string[]) => void;
    endSession: (deckId: string) => void;

    // basically refreshed the ui with saved memory and all the new valid changes
    rehydrateSession: (args: {
        deckId: string;
        validCardIds: string[];
    }) => void;
}

// Memoization caches for selectors to prevent unnecessary re-renders
const progressCache = new Map<string, { current: number; total: number; phase: PracticePhase }>();
const currentCardIdCache = new Map<string, string | undefined>();

export const usePracticeStore = create<PracticeStoreState>((set, get) => ({
    version: 1,
    activeDeckId: undefined,
    sessionsByDeckId: {},

    getActiveSession: () => {
        const deckId = get().activeDeckId;
        if (!deckId) return undefined;
        return get().sessionsByDeckId[deckId];
    },

    getCurrentCardId: (deckId?: string) => {
        if (!deckId) return undefined;
        const session = get().sessionsByDeckId[deckId];
        if (!session) return undefined;
        
        const cardId = session.queue[session.index];
        
        // Return cached value if it's the same
        if (currentCardIdCache.get(deckId) === cardId) {
            return cardId;
        }
        
        currentCardIdCache.set(deckId, cardId);
        return cardId;
    },

    getProgress: (deckId?: string) => {
        if (!deckId) return undefined;
        const session = get().sessionsByDeckId[deckId];
        if (!session) return undefined;

        const current = session.index + 1;
        const total = session.queue.length;
        const phase = session.phase;
        
        // Return cached object if values haven't changed
        const cached = progressCache.get(deckId);
        if (cached && cached.current === current && cached.total === total && cached.phase === phase) {
            return cached;
        }
        
        const result = { current, total, phase };
        progressCache.set(deckId, result);
        return result;
    },

    startSession: ({ deckId, cardIds, promptSide = 'front', answerSide = 'back', shuffle = true }) => {
        const queue = shuffle 
            ? [...cardIds].sort(() => Math.random() - 0.5) 
            : [...cardIds];

        const session: PracticeSession = {
            deckId,
            sessionId: crypto.randomUUID(),
            promptSide,
            answerSide,
            phase: 'all',
            queue,
            index: 0,
            missedSet: {},
            missedOrder: [],
            resultsByCardId: {},
        };

        set((state) => ({
            ...state,
            activeDeckId: deckId,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: session,
            },
        }));
    },

    submitAnswer: ({ deckId, cardId, submitted, correctAnswer }) => {
        const session = get().sessionsByDeckId[deckId];
        if (!session) return { isCorrect: false, normalized: '' };

        const normalizedSubmitted = normalize(submitted);
        const normalizedCorrectAnswer = normalize(correctAnswer);
        const isCorrect = normalizedSubmitted === normalizedCorrectAnswer;


        // creating copies to not mutate existing sessions in-place
        const resultsByCardId = { ...session.resultsByCardId };
        const missedSet = { ...session.missedSet };
        const missedOrder = [ ...session.missedOrder ];

        // initialize if result entry doesn't already exist
        const previous = resultsByCardId[cardId] ?? { correct: 0, wrong: 0 };

        if (isCorrect) {
            resultsByCardId[cardId] = { ...previous, correct: previous.correct + 1 };
        } else {
            resultsByCardId[cardId] = { ...previous, wrong: previous.wrong + 1 };

            // you only add it into the set and list once, so you don't need to repeat the card multiple times during your missed rounds. this ensures that there are no duplicates (since i don't want to do it over and over again in the same round)
            if (!missedSet[cardId]) {
                missedSet[cardId] = true;
                missedOrder.push(cardId);
            }
        }

        // Only increment index - don't add to missed set here
        const nextIndex = session.index + 1;

        const nextSession: PracticeSession = {
            ...session,
            index: nextIndex,
            resultsByCardId,
            missedSet,
            missedOrder,
        };

        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: nextSession,
            }
        }));

        return { isCorrect, normalized: normalizedSubmitted };
    },

    markIncorrectWithoutAdvancing: ({ deckId, cardId }) => {
        const session = get().sessionsByDeckId[deckId];
        if (!session) return;

        // creating copies to not mutate existing sessions in-place
        const resultsByCardId = { ...session.resultsByCardId };
        const missedSet = { ...session.missedSet };
        const missedOrder = [ ...session.missedOrder ];

        // initialize if result entry doesn't already exist
        const previous = resultsByCardId[cardId] ?? { correct: 0, wrong: 0 };

        // Mark as wrong and add to missed cards
        resultsByCardId[cardId] = { ...previous, wrong: previous.wrong + 1 };

        // Add to missed set if not already there
        if (!missedSet[cardId]) {
            missedSet[cardId] = true;
            missedOrder.push(cardId);
        }

        // Update session WITHOUT incrementing index
        const nextSession: PracticeSession = {
            ...session,
            resultsByCardId,
            missedSet,
            missedOrder,
        };

        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: nextSession,
            }
        }));
    },

    advanceToNextCard: (deckId) => {

        const session = get().sessionsByDeckId[deckId];
        if (!session) return;

        const nextIndex = session.index + 1;

        const nextSession: PracticeSession = {
            ...session,
            index: nextIndex,
        };

        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: nextSession,
            }
        }));
    },

    startMissedRound: (deckId, shuffle) => {
        const session = get().sessionsByDeckId[deckId];
        if (!session) return;

        if (session.missedOrder.length === 0) {
            const doneSession: PracticeSession = { ...session, phase: 'done' };
            set((state) => ({
                ...state,
                sessionsByDeckId: {
                    ...state.sessionsByDeckId,
                    [deckId]: doneSession
                }
            }));
            return;
        }

        // Show summary instead of immediately starting missed round
        const summarySession: PracticeSession = { ...session, phase: 'summary' };
        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: summarySession
            }
        }));
    },

    continueFromSummary: (deckId, shuffle) => {
        const session = get().sessionsByDeckId[deckId];
        if (!session) return;

        const queue = shuffle 
            ? [...session.missedOrder].sort(() => Math.random() - 0.5)
            : [...session.missedOrder];

        const nextSession: PracticeSession = {
            ...session,
            phase: 'missed',
            queue: queue,
            index: 0,
            missedSet: {},
            missedOrder: [],
            resultsByCardId: {}, // Reset stats for new phase
        };

        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: nextSession
            }
        }))   
    },

    resetSession: (deckId: string, cardIds: string[]) => {
        // clear current session
        set((state) => {
            const nextSessions = { ...state.sessionsByDeckId };
            delete nextSessions[deckId];
            return {
                ...state,
                activeDeckId: state.activeDeckId === deckId ? undefined : state.activeDeckId,
                sessionsByDeckId: nextSessions,
            };
        });
        
        // restart the session
        get().startSession( { deckId, cardIds });
    },

    // chat said that this version is good for a post-session summary screen, a practice again / reset button, and possibly stats so i will keep it like that. i want to be able to practice the set again automatically if i wanted to
    endSession: (deckId: string) => {
        const session = get().sessionsByDeckId[deckId];
        if(!session) return;

        const nextSession: PracticeSession = {
            ...session,
            phase: 'done'
        }
        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: nextSession
            }
        }))
    },

    rehydrateSession: ({ deckId, validCardIds }) => {
        const session = get().sessionsByDeckId[deckId];
        if (!session) return undefined;

        const validSet: Record<string, true> = {};
        for (let i = 0; i < validCardIds.length; i++) {
            validSet[validCardIds[i]] = true;
        }

        const nextQueue = session.queue.filter((id) => validSet[id]);
        const nextMissedOrder = session.missedOrder.filter((id) => validSet[id]);
        const nextMissedSet: Record<string, true> = {};
        for (let i = 0; i < nextMissedOrder.length; i++) {
            nextMissedSet[nextMissedOrder[i]] = true;
        }

        const nextResultsByCardId: Record<string, CardResult> = {};
        for (const [cardId, result] of Object.entries(session.resultsByCardId)) {
            if (validSet[cardId]) {
                nextResultsByCardId[cardId] = result;
            }
        }

        const nextIndex = Math.min(session.index, nextQueue.length);

        const isSameQueue =
            nextQueue.length === session.queue.length &&
            nextQueue.every((id, i) => id === session.queue[i]);

        const isSameMissedOrder =
            nextMissedOrder.length === session.missedOrder.length &&
            nextMissedOrder.every((id, i) => id === session.missedOrder[i]);

        const isSameResults = (() => {
            const currentEntries = Object.entries(session.resultsByCardId);
            const nextEntries = Object.entries(nextResultsByCardId);
            if (currentEntries.length !== nextEntries.length) return false;
            for (let i = 0; i < currentEntries.length; i++) {
                const [cardId, result] = currentEntries[i];
                const next = nextResultsByCardId[cardId];
                if (!next || next.correct !== result.correct || next.wrong !== result.wrong) {
                    return false;
                }
            }
            return true;
        })();

        if (isSameQueue && isSameMissedOrder && isSameResults && nextIndex === session.index) {
            return;
        }

        const refreshedSession: PracticeSession = {
            ...session,
            queue: nextQueue,
            index: nextIndex,
            missedOrder: nextMissedOrder,
            missedSet: nextMissedSet,
            resultsByCardId: nextResultsByCardId
        }

        set((state) => ({
            ...state,
            sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: refreshedSession,
            }
        }))
    },
}))