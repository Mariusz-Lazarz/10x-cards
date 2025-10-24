import { Button } from "@/components/ui/button";

interface BulkSaveButtonProps {
  onSaveAll: () => void;
  onSaveAccepted: () => void;
  disabled: boolean;
  acceptedCount: number;
  totalCount: number;
}

export function BulkSaveButton({
  onSaveAll,
  onSaveAccepted,
  disabled,
  acceptedCount,
  totalCount,
}: BulkSaveButtonProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 bg-muted/50 rounded-lg border border-border shadow-sm">
      <div className="flex-1">
        <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
          Zapisz fiszki do bazy danych
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Masz {totalCount} {totalCount === 1 ? "fiszkę" : "fiszek"} do zapisania
          {acceptedCount > 0 && ` (${acceptedCount} zaakceptowanych)`}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:gap-3">
        <Button
          onClick={onSaveAccepted}
          disabled={disabled || acceptedCount === 0}
          variant="default"
          size="lg"
          className="w-full touch-manipulation min-h-[48px]"
          aria-label={`Zapisz ${acceptedCount} zaakceptowanych fiszek`}
        >
          <span className="text-sm sm:text-base">
            💾 Zapisz zaakceptowane ({acceptedCount})
          </span>
        </Button>
        <Button
          onClick={onSaveAll}
          disabled={disabled || totalCount === 0}
          variant="outline"
          size="lg"
          className="w-full touch-manipulation min-h-[48px]"
          aria-label={`Zapisz wszystkie ${totalCount} fiszek`}
        >
          <span className="text-sm sm:text-base">
            💾 Zapisz wszystkie ({totalCount})
          </span>
        </Button>
      </div>
    </div>
  );
}

