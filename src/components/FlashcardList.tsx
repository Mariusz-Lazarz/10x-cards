import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
  onReject: (id: string) => void;
}

export function FlashcardList({
  flashcards,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Brak fiszek do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4" role="list" aria-label="Lista wygenerowanych fiszek">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Wygenerowane fiszki ({flashcards.length})
      </h2>
      {flashcards.map((flashcard) => (
        <FlashcardListItem
          key={flashcard.id}
          flashcard={flashcard}
          onAccept={() => onAccept(flashcard.id)}
          onEdit={(front, back) => onEdit(flashcard.id, front, back)}
          onReject={() => onReject(flashcard.id)}
        />
      ))}
    </div>
  );
}

