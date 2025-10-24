import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/FormField";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Pobierz token z URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    
    if (!tokenParam) {
      toast.error("Brak tokenu resetującego. Link może być nieprawidłowy.");
    }
    
    setToken(tokenParam);
  }, []);

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Hasło jest wymagane";
    }
    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Hasło musi zawierać małą literę";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Hasło musi zawierać wielką literę";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Hasło musi zawierać cyfrę";
    }
    return undefined;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | undefined => {
    if (!confirmPassword) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (password !== confirmPassword) {
      return "Hasła muszą być identyczne";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Brak tokenu resetującego");
      return;
    }

    if (!validateForm()) {
      toast.error("Popraw błędy w formularzu");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Resetowanie hasła...");

    try {
      // TODO: Implementacja wywołania API /api/auth/reset-password
      // Symulacja opóźnienia dla celów demonstracyjnych
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Hasło zostało pomyślnie zresetowane!", {
        id: loadingToast,
      });

      // TODO: Przekierowanie do strony logowania
      // setTimeout(() => {
      //   window.location.href = "/login";
      // }, 2000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas resetowania hasła";
      toast.error(`Błąd: ${message}`, {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
    if (confirmPassword && errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, confirmPassword),
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(password, value),
      }));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resetowanie hasła</CardTitle>
          <CardDescription>
            Wprowadź nowe hasło do swojego konta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <FormField
              id="password"
              label="Nowe hasło"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              error={errors.password}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            <FormField
              id="confirm-password"
              label="Powtórz nowe hasło"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            <div className="text-xs text-muted-foreground">
              <p>Hasło musi zawierać:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Co najmniej 8 znaków</li>
                <li>Małą literę (a-z)</li>
                <li>Wielką literę (A-Z)</li>
                <li>Cyfrę (0-9)</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !token}
              size="lg"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Resetowanie...
                </>
              ) : (
                "Zresetuj hasło"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              <a
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Wróć do logowania
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

