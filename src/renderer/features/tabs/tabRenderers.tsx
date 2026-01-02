import type { TabRendererRegistry } from '@/shared/tabTypes';
import { DeckView } from '../decks/DeckView';
import { PracticeView } from '../decks/PracticeView';

export const tabRenderers: TabRendererRegistry = {
  deck: (tab) => <DeckView deck={tab.payload} />,
  practice: (tab) => <PracticeView deck={tab.payload} />,
};
