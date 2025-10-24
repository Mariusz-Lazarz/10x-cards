// src/lib/generation.service.ts
import type {
  FlashcardProposalDto,
  GenerationCreateResponseDto,
} from '../types';
import type { SupabaseClient } from '../db/supabase.client';
import { createHash } from 'crypto';
import { OpenRouterService, OpenRouterError, OpenRouterErrorCode } from './openrouter.service';

/**
 * Service for handling flashcard generation operations
 */
export class GenerationService {
  private supabase: SupabaseClient;
  private openRouter: OpenRouterService;
  private readonly MODEL_NAME = 'openai/gpt-4o-mini';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.openRouter = new OpenRouterService({
      timeout: 90000, // 90 seconds for flashcard generation
      maxRetries: 3,
    });

    // Configure OpenRouter for flashcard generation
    this.configureOpenRouter();
  }

  /**
   * Configures the OpenRouter service with the system prompt and JSON mode
   */
  private configureOpenRouter(): void {
    // Set the model
    this.openRouter.setModel(this.MODEL_NAME, {
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Set system message for flashcard generation
    const systemMessage = `You are an expert educational AI assistant specialized in creating high-quality flashcards for learning.

Your task is to generate exactly 5 flashcards from the provided text. Each flashcard should:
1. Have a clear, focused question on the front (max 200 characters)
2. Have a comprehensive, accurate answer on the back (max 500 characters)
3. Cover different aspects or key concepts from the source text
4. Be educationally valuable and promote active recall
5. Use clear, concise language

Guidelines:
- Focus on important concepts, facts, definitions, or relationships
- Avoid trivial or overly complex questions
- Make questions specific and answerable
- Ensure answers are complete and self-contained
- Vary the question types (what, why, how, when, define, etc.)

IMPORTANT: You must respond with valid JSON in the following format:
{
  "flashcards": [
    {
      "front": "Question text here (max 200 chars)",
      "back": "Answer text here (max 500 chars)"
    }
  ]
}

Generate exactly 5 flashcards in this JSON format.`;

    this.openRouter.setSystemMessage(systemMessage);

    // Enable JSON mode for structured response
    this.openRouter.enableJsonMode();
  }

  /**
   * Generates flashcard proposals from source text using OpenRouter AI
   *
   * @param sourceText - The text to generate flashcards from
   * @param userId - The ID of the authenticated user
   * @returns Generation response with flashcard proposals
   */
  async generateFlashcards(
    sourceText: string,
    userId: string
  ): Promise<GenerationCreateResponseDto> {
    const startTime = Date.now();

    try {
      // Generate flashcard proposals using OpenRouter
      const flashcardsProposals = await this.callAIService(sourceText);
      const generatedCount = flashcardsProposals.length;

      // Get metadata from OpenRouter
      const metadata = this.openRouter.getLastRequestMetadata();
      const generationDuration = metadata?.duration || Date.now() - startTime;

      // Calculate metadata
      const sourceTextHash = this.calculateHash(sourceText);
      const sourceTextLength = sourceText.length;

      // Save generation metadata to database
      const { data: generation, error: generationError } = await this.supabase
        .from('generations')
        .insert({
          user_id: userId,
          model: this.MODEL_NAME,
          generated_count: generatedCount,
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          generation_duration: generationDuration,
        })
        .select('id')
        .single();

      if (generationError) {
        console.error('Failed to save generation metadata:', generationError);
        throw new Error('Failed to save generation metadata');
      }

      return {
        generation_id: generation.id,
        flashcards_proposals: flashcardsProposals,
        generated_count: generatedCount,
      };
    } catch (error) {
      // Log error to generation_error_logs table
      await this.logGenerationError(
        error,
        sourceText,
        this.MODEL_NAME,
        userId,
        Date.now() - startTime
      );
      throw error;
    }
  }

  /**
   * Calls the OpenRouter AI service to generate flashcards
   *
   * @param sourceText - The text to generate flashcards from
   * @returns Array of flashcard proposals
   * @throws {Error} If the AI service call fails
   */
  private async callAIService(
    sourceText: string
  ): Promise<FlashcardProposalDto[]> {
    try {
      // Prepare the user message with the source text
      const userMessage = `Generate 5 educational flashcards from the following text:\n\n${sourceText}`;

      // Call OpenRouter API
      interface AIResponse {
        flashcards: Array<{
          front: string;
          back: string;
        }>;
      }

      const response = await this.openRouter.sendChatMessage<AIResponse>(userMessage);

      // Validate response
      if (!response.flashcards || !Array.isArray(response.flashcards)) {
        throw new Error('Invalid response format from AI service');
      }

      if (response.flashcards.length !== 5) {
        console.warn(
          `Expected 5 flashcards, got ${response.flashcards.length}. Using available flashcards.`
        );
      }

      // Transform to FlashcardProposalDto format
      return response.flashcards.map((card) => ({
        front: card.front.substring(0, 200), // Ensure max length
        back: card.back.substring(0, 500), // Ensure max length
        source: 'ai-full' as const,
      }));
    } catch (error) {
      // Log OpenRouter-specific errors
      if (error instanceof OpenRouterError) {
        console.error(`[GenerationService] OpenRouter error [${error.code}]:`, error.message);
        
        // Provide more user-friendly error messages
        if (error.code === OpenRouterErrorCode.AUTHENTICATION_ERROR) {
          throw new Error('AI service authentication failed. Please check your API key.');
        } else if (error.code === OpenRouterErrorCode.RATE_LIMIT_ERROR) {
          throw new Error('AI service rate limit exceeded. Please try again later.');
        } else if (error.code === OpenRouterErrorCode.TIMEOUT_ERROR) {
          throw new Error('AI service request timed out. Please try again.');
        } else if (error.code === OpenRouterErrorCode.NETWORK_ERROR) {
          throw new Error('Network error while connecting to AI service. Please check your connection.');
        }
        
        throw new Error(`AI service error: ${error.message}`);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Logs generation errors to the database
   *
   * @param error - The error that occurred
   * @param sourceText - The source text that caused the error
   * @param model - The AI model being used
   * @param userId - The ID of the user
   * @param duration - How long the generation attempt took
   */
  private async logGenerationError(
    error: unknown,
    sourceText: string,
    model: string,
    userId: string,
    duration: number
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR';

    const sourceTextHash = this.calculateHash(sourceText);
    const sourceTextLength = sourceText.length;

    try {
      await this.supabase.from('generation_error_logs').insert({
        user_id: userId,
        error_code: errorCode,
        error_message: errorMessage,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });
    } catch (logError) {
      // If logging fails, at least log to console
      console.error('Failed to log generation error:', logError);
      console.error('Original error:', error);
    }
  }

  /**
   * Calculates SHA-256 hash of the source text
   *
   * @param text - The text to hash
   * @returns Hex string representation of the hash
   */
  private calculateHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }
}

