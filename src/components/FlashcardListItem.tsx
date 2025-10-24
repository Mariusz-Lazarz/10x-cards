import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  onAccept: () => void;
  onEdit: (front: string, back: string) => void;
  onReject: () => void;
}

export function FlashcardListItem({
  flashcard,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const maxFrontLength = 200;
  const maxBackLength = 500;

  const handleEditClick = () => {
    if (isEditing) {
      // Validate before saving
      const errors: string[] = [];
      if (editedFront.trim().length === 0) {
        errors.push("Przód fiszki nie może być pusty");
      }
      if (editedFront.length > maxFrontLength) {
        errors.push(`Przód fiszki może mieć maksymalnie ${maxFrontLength} znaków`);
      }
      if (editedBack.trim().length === 0) {
        errors.push("Tył fiszki nie może być pusty");
      }
      if (editedBack.length > maxBackLength) {
        errors.push(`Tył fiszki może mieć maksymalnie ${maxBackLength} znaków`);
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Save changes
      onEdit(editedFront.trim(), editedBack.trim());
      setValidationErrors([]);
      setIsEditing(false);
      toast.success("Zapisano zmiany w fiszce");
    } else {
      // Enter edit mode
      setIsEditing(true);
      setValidationErrors([]);
    }
  };

  const handleCancelEdit = () => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setValidationErrors([]);
    setIsEditing(false);
  };

  const isFrontValid = editedFront.trim().length > 0 && editedFront.length <= maxFrontLength;
  const isBackValid = editedBack.trim().length > 0 && editedBack.length <= maxBackLength;

  return (
    <div
      className={`border rounded-lg p-4 sm:p-6 transition-all scroll-mt-4 ${
        flashcard.accepted
          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
          : "border-border"
      } ${flashcard.edited ? "border-l-4 border-l-blue-500" : ""}`}
      role="listitem"
      tabIndex={-1}
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Front of flashcard */}
        <div>
          <label
            htmlFor={`front-${flashcard.id}`}
            className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2"
          >
            Przód fiszki
          </label>
          {isEditing ? (
            <div>
              <input
                id={`front-${flashcard.id}`}
                type="text"
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                className={`w-full p-2 sm:p-3 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                  !isFrontValid ? "border-destructive" : "border-input"
                }`}
                maxLength={maxFrontLength}
                aria-invalid={!isFrontValid}
                aria-describedby={`front-validation-${flashcard.id}`}
              />
              <p
                id={`front-validation-${flashcard.id}`}
                className={`text-xs mt-1 ${
                  isFrontValid ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {editedFront.length}/{maxFrontLength} znaków
              </p>
            </div>
          ) : (
            <p className="text-base sm:text-lg font-medium break-words">{flashcard.front}</p>
          )}
        </div>

        {/* Back of flashcard */}
        <div>
          <label
            htmlFor={`back-${flashcard.id}`}
            className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2"
          >
            Tył fiszki
          </label>
          {isEditing ? (
            <div>
              <textarea
                id={`back-${flashcard.id}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                className={`w-full p-2 sm:p-3 text-sm sm:text-base border rounded-md min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-ring ${
                  !isBackValid ? "border-destructive" : "border-input"
                }`}
                maxLength={maxBackLength}
                aria-invalid={!isBackValid}
                aria-describedby={`back-validation-${flashcard.id}`}
              />
              <p
                id={`back-validation-${flashcard.id}`}
                className={`text-xs mt-1 ${
                  isBackValid ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {editedBack.length}/{maxBackLength} znaków
              </p>
            </div>
          ) : (
            <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{flashcard.back}</p>
          )}
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div
            className="p-3 bg-destructive/10 border border-destructive rounded-md"
            role="alert"
            aria-live="polite"
          >
            <ul className="list-disc list-inside text-xs sm:text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status badges */}
        <div className="flex gap-2 items-center">
          {flashcard.accepted && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Zaakceptowana
            </span>
          )}
          {flashcard.edited && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              ✎ Edytowana
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!isEditing && (
            <Button
              onClick={onAccept}
              variant={flashcard.accepted ? "default" : "outline"}
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              aria-pressed={flashcard.accepted}
              aria-label={
                flashcard.accepted
                  ? "Cofnij zaakceptowanie fiszki"
                  : "Zaakceptuj fiszkę"
              }
            >
              <span className="text-sm sm:text-base">
                {flashcard.accepted ? "✓ Zaakceptowano" : "Zaakceptuj"}
              </span>
            </Button>
          )}

          <Button
            onClick={handleEditClick}
            variant="outline"
            size="sm"
            className="touch-manipulation min-h-[44px] sm:min-h-0"
            aria-label={isEditing ? "Zapisz zmiany" : "Edytuj fiszkę"}
          >
            <span className="text-sm sm:text-base">
              {isEditing ? "💾 Zapisz" : "✎ Edytuj"}
            </span>
          </Button>

          {isEditing ? (
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              aria-label="Anuluj edycję"
            >
              <span className="text-sm sm:text-base">Anuluj</span>
            </Button>
          ) : (
            <Button
              onClick={onReject}
              variant="destructive"
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              aria-label="Odrzuć fiszkę"
            >
              <span className="text-sm sm:text-base">✕ Odrzuć</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

