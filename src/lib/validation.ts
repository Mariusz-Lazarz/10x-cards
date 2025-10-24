// src/lib/validation.ts
import { z } from 'zod';

/**
 * Validation schema for the GenerateFlashcardsCommand
 * Ensures source_text is between 1000 and 10000 characters
 */
export const generateFlashcardsCommandSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters long')
    .max(10000, 'Source text cannot exceed 10000 characters'),
});

/**
 * Validation schema for FlashcardCreateDto
 * Validates individual flashcard data including:
 * - front: max 200 characters
 * - back: max 500 characters
 * - source: must be one of the allowed values
 * - generation_id: nullable number
 */
export const flashcardCreateDtoSchema = z
  .object({
    front: z
      .string()
      .min(1, 'Front text is required')
      .max(200, 'Front text cannot exceed 200 characters'),
    back: z
      .string()
      .min(1, 'Back text is required')
      .max(500, 'Back text cannot exceed 500 characters'),
    source: z.enum(['ai-full', 'ai-edited', 'manual']),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      // For manual flashcards, generation_id must be null
      if (data.source === 'manual') {
        return data.generation_id === null;
      }
      // For AI sources, generation_id is required (not null)
      if (data.source === 'ai-full' || data.source === 'ai-edited') {
        return data.generation_id !== null;
      }
      return true;
    },
    {
      message:
        'generation_id must be null for manual source and required for ai-full/ai-edited sources',
      path: ['generation_id'],
    }
  );

/**
 * Validation schema for FlashcardsCreateCommand
 * Validates the command to create one or more flashcards
 */
export const flashcardsCreateCommandSchema = z.object({
  flashcards: z
    .array(flashcardCreateDtoSchema)
    .min(1, 'At least one flashcard is required'),
});

