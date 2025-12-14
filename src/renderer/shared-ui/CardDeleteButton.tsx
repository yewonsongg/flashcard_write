import { Trash2 } from "lucide-react";

type CardDeleteButtonProps = {
  cardId: string;
  onDeleteCard: (id: string) => void;
}

export function CardDeleteButton({
  cardId,
  onDeleteCard,
}: CardDeleteButtonProps) {
  return (
    <button
      type='button'
      onClick={() => onDeleteCard(cardId)}
      className='flex items-center justify-center rounded-full hover:bg-accent/10 hover:text-zinc-800 h-5 w-5'
    >
      <Trash2 className='h-3.5 w-3.5' strokeWidth={2} />
    </button>
  );
}
