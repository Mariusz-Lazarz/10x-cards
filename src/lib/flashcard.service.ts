// src/lib/flashcard.service.ts
import type { SupabaseClient } from '../db/supabase.client';
import type { FlashcardCreateDto, FlashcardDto } from '../types';

/**
 * FlashcardService handles business logic for flashcard operations.
 * Manages database interactions for creating, updating, and retrieving flashcards.
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates multiple flashcards in a single batch operation.
   *
   * @param flashcards - Array of flashcard data to create
   * @param userId - ID of the user creating the flashcards
   * @returns Array of created flashcards with their IDs
   * @throws Error if database operation fails
   */
  async createFlashcards(
    flashcards: FlashcardCreateDto[],
    userId: string
  ): Promise<FlashcardDto[]> {
    if (!flashcards || flashcards.length === 0) {
      throw new Error('At least one flashcard is required');
    }

    // Prepare flashcard data for batch insert
    const flashcardsToInsert = flashcards.map((flashcard) => ({
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      generation_id: flashcard.generation_id,
      user_id: userId,
    }));

    // Perform batch insert
    const { data, error } = await this.supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select('id, front, back, source, generation_id, created_at, updated_at');

    if (error) {
      console.error('Database error while creating flashcards:', error);
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No flashcards were created');
    }

    return data as FlashcardDto[];
  }
}

