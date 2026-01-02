import type { TabRegistry } from '@/shared/tabTypes';

export const tabDefinitions: TabRegistry = {
  deck: {
    type: 'deck',
    getId: (deck) => deck.id,
    getTitle: (deck) => deck.name,
  },
  practice: {
    type: 'practice',
    getId: (deck) => `practice:${deck.id}`,
    getTitle: (deck) => `Practice: ${deck.name}`,
  },
};
