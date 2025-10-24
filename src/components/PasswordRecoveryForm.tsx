import { useState } from "react";
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
  email?: string;
}

export default function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return "Adres email jest wymagany";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Niepoprawny format adresu email";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Popraw błędy w formularzu");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Wysyłanie linku resetującego...");

    try {
      // TODO: Implementacja wywołania API /api/auth/forgot-password
      // Symulacja opóźnienia dla celów demonstracyjnych
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Link resetujący został wysłany na podany adres email", {
        id: loadingToast,
      });

      setIsSent(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas wysyłania linku";
      toast.error(`Błąd: ${message}`, {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
            <CardDescription>
              Wysłaliśmy link resetujący hasło na adres <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Jeśli nie otrzymasz wiadomości w ciągu kilku minut:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Sprawdź folder spam</li>
                <li>Upewnij się, że podałeś poprawny adres email</li>
                <li>Spróbuj ponownie wysłać link</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsSent(false)}
              size="lg"
            >
              Wyślij ponownie
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
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Odzyskiwanie hasła</CardTitle>
          <CardDescription>
            Podaj adres email powiązany z Twoim kontem
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <FormField
              id="email"
              label="Adres email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              placeholder="twoj@email.com"
              required
              autoComplete="email"
            />

            <div className="text-sm text-muted-foreground">
              Wyślemy na ten adres link umożliwiający zresetowanie hasła
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Wysyłanie...
                </>
              ) : (
                "Wyślij link resetujący"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Pamiętasz hasło?{" "}
              <a
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Zaloguj się
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

