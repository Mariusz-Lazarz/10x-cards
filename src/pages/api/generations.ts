// src/pages/api/generations.ts
import type { APIRoute } from 'astro';
import { generateFlashcardsCommandSchema } from '../../lib/validation';
import { GenerationService } from '../../lib/generation.service';
import { supabaseAdmin } from '../../db/supabase.client';
import type { GenerateFlashcardsCommand } from '../../types';

export const prerender = false;

/**
 * POST /api/generations
 *
 * Initiates the AI flashcard generation process.
 * Requires authentication - uses authenticated user ID from Astro.locals.
 * Uses admin client to bypass RLS policies.
 *
 * Request Body:
 * - source_text: string (1000-10000 characters)
 *
 * Response (201):
 * - generation_id: number
 * - flashcards_proposals: FlashcardProposalDto[]
 * - generated_count: number
 *
 * Error Responses:
 * - 401: Unauthorized (user not authenticated)
 * - 400: Invalid request data (validation error)
 * - 500: Internal server error (AI service or database error)
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

    // 2. Parse and validate request body
    let requestBody: GenerateFlashcardsCommand;

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

    // 3. Validate input using Zod schema
    const validation = generateFlashcardsCommandSchema.safeParse(requestBody);

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

    // 4. Call generation service with authenticated user ID (using admin client to bypass RLS)
    const generationService = new GenerationService(supabaseAdmin);
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      locals.user.id
    );

    // 5. Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging (include user context for troubleshooting)
    console.error('[POST /api/generations] Error:', {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    // Return generic error to client (don't expose internal details)
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message:
          'An error occurred while generating flashcards. Please try again later.',
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

