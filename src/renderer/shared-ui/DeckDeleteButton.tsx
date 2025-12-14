import { Trash2 } from "lucide-react";

type DeckDeleteButtonProps = {
  setDeleteOpen: (arg: boolean) => void;
}

export function DeckDeleteButton({
  setDeleteOpen,
}: DeckDeleteButtonProps) {
  return (
    <button
      onClick={() => setDeleteOpen(true)} 
      className='flex items-center justify-center rounded-full hover:bg-accent/10 hover:text-zinc-800 h-9 w-9'
    >
      <Trash2 className='h-6 w-6' strokeWidth={1.5} />
    </button>
  )
}