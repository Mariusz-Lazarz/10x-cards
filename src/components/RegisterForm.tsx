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
  password?: string;
  confirmPassword?: string;
}

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
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
    const loadingToast = toast.loading("Rejestracja...");

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd podczas rejestracji');
      }

      // Success message (different if email confirmation is needed)
      const successMessage = data.message || "Rejestracja pomyślna! Przekierowywanie...";
      toast.success(successMessage, {
        id: loadingToast,
        duration: data.needsEmailConfirmation ? 6000 : 3000,
      });

      // Redirect to generate page (user is auto-logged in if no email confirmation needed)
      // If email confirmation needed, redirect to login with a message
      setTimeout(() => {
        if (data.needsEmailConfirmation) {
          window.location.href = "/auth/login";
        } else {
          window.location.href = "/generate";
        }
      }, data.needsEmailConfirmation ? 3000 : 500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji";
      toast.error(message, {
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
          <CardTitle>Rejestracja</CardTitle>
          <CardDescription>
            Utwórz nowe konto w aplikacji 10xCards
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

            <FormField
              id="password"
              label="Hasło"
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
              label="Powtórz hasło"
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
              disabled={isLoading}
              size="lg"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Rejestracja...
                </>
              ) : (
                "Zarejestruj się"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Masz już konto?{" "}
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

