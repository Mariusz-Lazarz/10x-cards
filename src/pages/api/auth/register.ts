import type { APIRoute } from 'astro';
import { z } from 'zod';

import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

// Validation schema - matches frontend validation
const registerSchema = z.object({
  email: z
    .string({ required_error: 'Adres email jest wymagany' })
    .email('Niepoprawny format adresu email')
    .min(1, 'Adres email jest wymagany'),
  password: z
    .string({ required_error: 'Hasło jest wymagane' })
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/(?=.*[a-z])/, 'Hasło musi zawierać małą literę')
    .regex(/(?=.*[A-Z])/, 'Hasło musi zawierać wielką literę')
    .regex(/(?=.*\d)/, 'Hasło musi zawierać cyfrę'),
  confirmPassword: z
    .string({ required_error: 'Potwierdzenie hasła jest wymagane' })
    .min(1, 'Potwierdzenie hasła jest wymagane'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

// Custom error mapping for better UX
const mapSupabaseError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': 'Użytkownik z tym adresem email już istnieje',
    'Email address is invalid': 'Niepoprawny format adresu email',
    'Password should be at least 6 characters': 'Hasło jest zbyt krótkie (min. 8 znaków)',
    'Signup requires a valid password': 'Hasło jest wymagane',
    'Unable to validate email address: invalid format': 'Niepoprawny format adresu email',
    'Database error saving new user': 'Błąd bazy danych. Spróbuj ponownie.',
    'Too many requests': 'Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę.',
  };

  // Check if error message contains key phrases
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  return `Błąd rejestracji: ${error}`;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: firstError.message,
          field: firstError.path[0],
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase instance with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: mapSupabaseError(error.message),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Check if email confirmation is required
    const needsEmailConfirmation = data.user && !data.session;

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        needsEmailConfirmation,
        message: needsEmailConfirmation
          ? 'Konto utworzone! Sprawdź swoją skrzynkę email aby potwierdzić adres.'
          : 'Konto utworzone pomyślnie!',
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};

