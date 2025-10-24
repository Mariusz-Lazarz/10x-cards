import type { APIRoute } from 'astro';
import { z } from 'zod';

import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

// Validation schema
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Adres email jest wymagany' })
    .email('Niepoprawny format adresu email')
    .min(1, 'Adres email jest wymagany'),
  password: z
    .string({ required_error: 'Hasło jest wymagane' })
    .min(1, 'Hasło jest wymagane'),
});

// Custom error mapping for better UX
const mapSupabaseError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Nieprawidłowy email lub hasło',
    'Email not confirmed': 'Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.',
    'User not found': 'Nie znaleziono użytkownika z podanym adresem email',
    'Too many requests': 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.',
  };

  return errorMap[error] || `Błąd logowania: ${error}`;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: mapSupabaseError(error.message),
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Login error:', error);
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

