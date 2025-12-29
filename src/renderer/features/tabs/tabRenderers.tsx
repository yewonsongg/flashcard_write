import type { TabRendererRegistry } from '@/shared/tabTypes';
import { DeckView } from '../decks/DeckView';

export const tabRenderers: TabRendererRegistry = {
  deck: (tab) => <DeckView deck={tab.payload} />,
};
