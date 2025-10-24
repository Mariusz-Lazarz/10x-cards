import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UserNavProps {
  user: {
    id: string;
    email?: string;
  };
}

export default function UserNav({ user }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const loadingToast = toast.loading("Wylogowywanie...");

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Wystąpił błąd podczas wylogowania');
      }

      toast.success("Wylogowano pomyślnie!", {
        id: loadingToast,
      });

      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wystąpił błąd podczas wylogowania";
      toast.error(message, {
        id: loadingToast,
      });
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" aria-label="Główna nawigacja">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <a 
              href="/" 
              className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
              aria-label="Strona główna 10xCards"
            >
              10xCards
            </a>
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="/generate"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Generuj fiszki"
              >
                Generuj fiszki
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user.email && (
              <span 
                className="hidden md:inline-block text-sm text-muted-foreground truncate max-w-[200px]"
                title={user.email}
                aria-label={`Zalogowany jako ${user.email}`}
              >
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              aria-label="Wyloguj się z aplikacji"
            >
              {isLoggingOut ? (
                <>
                  <span className="inline-block animate-spin mr-1">⏳</span>
                  Wylogowywanie...
                </>
              ) : (
                "Wyloguj"
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

