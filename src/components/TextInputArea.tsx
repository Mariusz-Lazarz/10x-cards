interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isValid: boolean;
  currentLength: number;
}

export function TextInputArea({
  value,
  onChange,
  placeholder,
  isValid,
  currentLength,
}: TextInputAreaProps) {
  const minLength = 1000;
  const maxLength = 10000;

  const getValidationMessage = () => {
    if (currentLength === 0) {
      return `Wpisz tekst (min. ${minLength} znaków)`;
    }
    if (currentLength < minLength) {
      return `Zbyt krótki tekst: ${currentLength}/${minLength} znaków`;
    }
    if (currentLength > maxLength) {
      return `Zbyt długi tekst: ${currentLength}/${maxLength} znaków`;
    }
    return `Długość tekstu: ${currentLength} znaków`;
  };

  const getValidationColor = () => {
    if (currentLength === 0) return "text-muted-foreground";
    if (isValid) return "text-green-600 dark:text-green-500";
    return "text-destructive";
  };

  return (
    <div className="space-y-2">
      <label htmlFor="source-text" className="block text-sm sm:text-base font-medium">
        Tekst źródłowy
      </label>
      <textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 text-sm sm:text-base border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
          currentLength > 0 && !isValid
            ? "border-destructive"
            : "border-input"
        }`}
        aria-invalid={currentLength > 0 && !isValid}
        aria-describedby="text-validation"
      />
      <p
        id="text-validation"
        className={`text-sm ${getValidationColor()}`}
        role="status"
        aria-live="polite"
      >
        {getValidationMessage()}
      </p>
    </div>
  );
}

