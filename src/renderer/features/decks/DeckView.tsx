import type { Deck } from "@/shared/flashcards/types"

export function DeckView({ deck }: { deck: Deck }) {

  return (
    <div className='h-full overflow-auto px-4 py-3'>
      <h2 className='text-lg font-semibold mb-2'>{deck.name}</h2>
      <p className='text-sm text-zinc-500'>
        Deck editor / preview here.
      </p>
    </div>
  )
}