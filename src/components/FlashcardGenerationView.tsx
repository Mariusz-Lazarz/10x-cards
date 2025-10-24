import { useState } from "react";
import { toast } from "sonner";
import type {
  GenerateFlashcardsCommand,
  GenerationCreateResponseDto,
} from "@/types";
import { TextInputArea } from "@/components/TextInputArea";
import { GenerateButton } from "@/components/GenerateButton";
import { FlashcardList } from "@/components/FlashcardList";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { BulkSaveButton } from "@/components/BulkSaveButton";

// Extended ViewModel for flashcard proposals with UI state
export interface FlashcardProposalViewModel {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  accepted: boolean;
  edited: boolean;
  id: string; // local unique identifier for React keys
}

export default function FlashcardGenerationView() {
  const [textValue, setTextValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);

  // Validation: text must be between 1000 and 10000 characters
  const isTextValid = textValue.length >= 1000 && textValue.length <= 10000;
  const canGenerate = isTextValid && !isLoading;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setFlashcards([]);
    setGenerationId(null);

    const loadingToast = toast.loading("Generowanie fiszek...");

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: textValue,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: GenerationCreateResponseDto = await response.json();

      // Convert proposals to view models with UI state
      const viewModels: FlashcardProposalViewModel[] =
        data.flashcards_proposals.map((proposal, index) => ({
          ...proposal,
          accepted: false,
          edited: false,
          id: `${data.generation_id}-${index}`,
        }));

      setFlashcards(viewModels);
      setGenerationId(data.generation_id);
      
      toast.success(`Wygenerowano ${data.generated_count} fiszek!`, {
        id: loadingToast,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił nieznany błąd";
      toast.error(`Błąd: ${message}`, {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, accepted: !card.accepted } : card
      )
    );
  };

  const handleEdit = (id: string, front: string, back: string) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            front,
            back,
            edited: true,
            source: "ai-edited" as const,
          };
        }
        return card;
      })
    );
  };

  const handleReject = (id: string) => {
    setFlashcards((prev) => prev.filter((card) => card.id !== id));
  };

  const handleSaveAll = async () => {
    if (!generationId) return;

    const loadingToast = toast.loading("Zapisywanie fiszek...");

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: flashcards.map((card) => ({
            front: card.front,
            back: card.back,
            source: card.edited ? "ai-edited" : "ai-full",
            generation_id: generationId,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      toast.success(`Zapisano wszystkie ${flashcards.length} fiszek!`, {
        id: loadingToast,
      });
      
      // Clear flashcards after successful save
      setFlashcards([]);
      setGenerationId(null);
      setTextValue("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił błąd podczas zapisu";
      toast.error(`Błąd: ${message}`, {
        id: loadingToast,
      });
    }
  };

  const handleSaveAccepted = async () => {
    if (!generationId) return;

    const acceptedCards = flashcards.filter((card) => card.accepted);

    if (acceptedCards.length === 0) {
      toast.warning("Nie zaznaczono żadnych fiszek do zapisu");
      return;
    }

    const loadingToast = toast.loading("Zapisywanie zaakceptowanych fiszek...");

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: acceptedCards.map((card) => ({
            front: card.front,
            back: card.back,
            source: card.edited ? "ai-edited" : "ai-full",
            generation_id: generationId,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      toast.success(`Zapisano ${acceptedCards.length} zaakceptowanych fiszek!`, {
        id: loadingToast,
      });
      
      // Clear flashcards after successful save
      setFlashcards([]);
      setGenerationId(null);
      setTextValue("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił błąd podczas zapisu";
      toast.error(`Błąd: ${message}`, {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl min-h-screen">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 scroll-mt-4">
        Generuj fiszki z tekstu
      </h1>

      <div className="mb-6 sm:mb-8">
        <TextInputArea
          value={textValue}
          onChange={setTextValue}
          placeholder="Wklej tutaj tekst (1000-10000 znaków)..."
          isValid={isTextValid}
          currentLength={textValue.length}
        />
      </div>

      <div className="mb-6 sm:mb-8">
        <GenerateButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          isLoading={isLoading}
        />
      </div>

      {isLoading && <SkeletonLoader />}

      {!isLoading && flashcards.length > 0 && (
        <>
          <FlashcardList
            flashcards={flashcards}
            onAccept={handleAccept}
            onEdit={handleEdit}
            onReject={handleReject}
          />

          <div className="mt-6 sm:mt-8 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0 sm:mx-0 sm:px-0">
            <BulkSaveButton
              onSaveAll={handleSaveAll}
              onSaveAccepted={handleSaveAccepted}
              disabled={flashcards.length === 0}
              acceptedCount={flashcards.filter((card) => card.accepted).length}
              totalCount={flashcards.length}
            />
          </div>
        </>
      )}
    </div>
  );
}

