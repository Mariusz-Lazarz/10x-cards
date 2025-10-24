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
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
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
    const loadingToast = toast.loading("Logowanie...");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd podczas logowania');
      }

      toast.success("Logowanie pomyślne! Przekierowywanie...", {
        id: loadingToast,
      });

      // Redirect to main application view (flashcard generation)
      setTimeout(() => {
        window.location.href = "/generate";
      }, 500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił błąd podczas logowania";
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
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logowanie</CardTitle>
          <CardDescription>
            Zaloguj się do swojego konta 10xCards
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
              autoComplete="current-password"
            />

            <div className="text-sm text-right">
              <a
                href="/auth/forgot-password"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Zapomniałeś hasła?
              </a>
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
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Nie masz konta?{" "}
              <a
                href="/auth/register"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Zarejestruj się
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

