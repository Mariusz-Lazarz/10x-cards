// src/pages/api/flashcards.ts
import type { APIRoute } from 'astro';
import { flashcardsCreateCommandSchema } from '../../lib/validation';
import { FlashcardService } from '../../lib/flashcard.service';
import { supabaseAdmin } from '../../db/supabase.client';
import type { FlashcardsCreateCommand } from '../../types';

export const prerender = false;

/**
 * POST /api/flashcards
 *
 * Creates one or more flashcards (manually created or AI-generated).
 * Requires authentication - uses authenticated user ID from Astro.locals.
 * Uses admin client to bypass RLS policies.
 *
 * Request Body:
 * - flashcards: FlashcardCreateDto[] (array of flashcards to create)
 *   - front: string (max 200 characters)
 *   - back: string (max 500 characters)
 *   - source: "ai-full" | "ai-edited" | "manual"
 *   - generation_id: number | null (required for AI sources, must be null for manual)
 *
 * Response (201):
 * - flashcards: FlashcardDto[] (array of created flashcards)
 *
 * Error Responses:
 * - 401: Unauthorized (user not authenticated)
 * - 400: Invalid request data (validation error)
 * - 500: Internal server error (database error)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication (middleware should handle this, but verify)
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Parse request body
    let requestBody: FlashcardsCreateCommand;

    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Validate input using Zod schema (includes generation_id consistency check)
    const validation = flashcardsCreateCommandSchema.safeParse(requestBody);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 4. Call flashcard service with authenticated user ID (using admin client to bypass RLS)
    const flashcardService = new FlashcardService(supabaseAdmin);
    const createdFlashcards = await flashcardService.createFlashcards(
      validation.data.flashcards,
      locals.user.id
    );

    // 5. Return successful response
    return new Response(
      JSON.stringify({
        flashcards: createdFlashcards,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging (include user context for troubleshooting)
    console.error('[POST /api/flashcards] Error:', {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    // Return generic error to client (don't expose internal details)
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message:
          'An error occurred while creating flashcards. Please try again later.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

