// src/lib/openrouter.service.ts

/**
 * Configuration parameters for the OpenRouter AI model
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

/**
 * Message in the chat format used by OpenRouter API
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * JSON Schema definition for structured outputs
 */
interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Response format configuration for structured outputs
 */
interface ResponseFormat {
  type: 'json_object';
}

/**
 * Request payload sent to OpenRouter API
 */
interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
}

/**
 * Response from OpenRouter API
 */
interface ApiResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

/**
 * Configuration options for OpenRouter service initialization
 */
interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Error codes for OpenRouter service
 */
export enum OpenRouterErrorCode {
  MISSING_API_KEY = 'MISSING_API_KEY',
  MISSING_USER_MESSAGE = 'MISSING_USER_MESSAGE',
  HTTP_ERROR = 'HTTP_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_FAILED = 'REQUEST_FAILED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for OpenRouter service errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: OpenRouterErrorCode,
    public statusCode?: number,
    public originalError?: unknown,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Metadata about an API request/response
 */
export interface RequestMetadata {
  model: string;
  requestStartTime: number;
  requestEndTime?: number;
  duration?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  attempt: number;
  success: boolean;
  errorCode?: OpenRouterErrorCode;
  errorMessage?: string;
}

/**
 * Service for communicating with OpenRouter AI API
 * Handles chat message generation with structured JSON outputs
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  private currentSystemMessage: string = '';
  private currentUserMessage: string = '';
  private currentResponseFormat?: ResponseFormat;
  private currentModelName: string = 'gpt-4o-mini';
  private currentModelParameters: ModelParameters = {
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 4096,
  };

  // Store last request metadata for debugging
  private lastRequestMetadata?: RequestMetadata;

  /**
   * Creates a new OpenRouterService instance
   *
   * @param config - Configuration options for the service
   * @throws {OpenRouterError} If API key is not provided
   */
  constructor(config: OpenRouterConfig = {}) {
    // Get API key from config or environment variable
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY;

    if (!this.apiKey) {
      throw new OpenRouterError(
        'OpenRouter API key is required. Provide it via config or OPENROUTER_API_KEY environment variable.',
        OpenRouterErrorCode.MISSING_API_KEY
      );
    }

    // Initialize configuration with defaults
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.timeout = config.timeout || 60000; // 60 seconds
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  /**
   * Sets the system message for the chat
   *
   * @param message - The system message to set
   */
  setSystemMessage(message: string): void {
    this.currentSystemMessage = message;
  }

  /**
   * Sets the user message for the chat
   *
   * @param message - The user message to set
   */
  setUserMessage(message: string): void {
    this.currentUserMessage = message;
  }

  /**
   * Enables JSON mode for structured responses
   * Note: You should still describe the desired JSON structure in your prompt
   */
  enableJsonMode(): void {
    this.currentResponseFormat = {
      type: 'json_object',
    };
  }

  /**
   * Disables JSON mode (returns plain text)
   */
  disableJsonMode(): void {
    this.currentResponseFormat = undefined;
  }

  /**
   * Sets the AI model and its parameters
   *
   * @param name - The model name (e.g., 'anthropic/claude-3.5-sonnet')
   * @param parameters - Model parameters (temperature, top_p, etc.)
   */
  setModel(name: string, parameters: ModelParameters = {}): void {
    this.currentModelName = name;
    this.currentModelParameters = {
      ...this.currentModelParameters,
      ...parameters,
    };
  }

  /**
   * Gets the metadata from the last API request
   *
   * @returns The metadata from the last request, or undefined if no requests have been made
   */
  getLastRequestMetadata(): RequestMetadata | undefined {
    return this.lastRequestMetadata;
  }

  /**
   * Sends a chat message to the OpenRouter API
   *
   * @param userMessage - The user message to send (optional if already set via setUserMessage)
   * @returns The parsed response from the API
   * @throws {OpenRouterError} If the request fails or validation errors occur
   */
  async sendChatMessage<T = unknown>(userMessage?: string): Promise<T> {
    const startTime = Date.now();

    try {
      // Use provided message or fall back to the current user message
      const messageToSend = userMessage || this.currentUserMessage;

      if (!messageToSend) {
        throw new OpenRouterError(
          'User message is required. Provide it via parameter or setUserMessage().',
          OpenRouterErrorCode.MISSING_USER_MESSAGE
        );
      }

      // Build the request payload
      const payload = this.buildRequestPayload(messageToSend);

      // Execute the request with retry logic
      const response = await this.executeRequest(payload);

      // Parse and return the response
      const result = this.parseResponse<T>(response);

      // Store successful request metadata
      this.lastRequestMetadata = {
        model: this.currentModelName,
        requestStartTime: startTime,
        requestEndTime: Date.now(),
        duration: Date.now() - startTime,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
        attempt: 1,
        success: true,
      };

      // Log successful request (without sensitive data)
      this.logRequest(this.lastRequestMetadata);

      return result;
    } catch (error) {
      // Store error metadata
      const errorCode =
        error instanceof OpenRouterError
          ? error.code
          : OpenRouterErrorCode.UNKNOWN_ERROR;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.lastRequestMetadata = {
        model: this.currentModelName,
        requestStartTime: startTime,
        requestEndTime: Date.now(),
        duration: Date.now() - startTime,
        attempt: 1,
        success: false,
        errorCode,
        errorMessage,
      };

      // Log failed request (without sensitive data)
      this.logRequest(this.lastRequestMetadata);

      throw error;
    }
  }

  /**
   * Builds the request payload for the OpenRouter API
   *
   * @param userMessage - The user message to include
   * @returns The complete request payload
   */
  private buildRequestPayload(userMessage: string): RequestPayload {
    const messages: ChatMessage[] = [];

    // Add system message if provided
    if (this.currentSystemMessage) {
      messages.push({
        role: 'system',
        content: this.currentSystemMessage,
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Build payload with model and parameters
    const payload: RequestPayload = {
      model: this.currentModelName,
      messages,
      ...this.currentModelParameters,
    };

    // Add response format if configured
    if (this.currentResponseFormat) {
      payload.response_format = this.currentResponseFormat;
    }

    return payload;
  }

  /**
   * Executes the HTTP request to OpenRouter API with retry logic
   *
   * @param payload - The request payload
   * @returns The API response
   * @throws {OpenRouterError} If all retry attempts fail
   */
  private async executeRequest(payload: RequestPayload): Promise<ApiResponse> {
    let lastError: unknown;

    // Log request payload in development (without API key)
    if (import.meta.env.MODE === 'development') {
      console.log('[OpenRouter] Request payload:', {
        model: payload.model,
        messageCount: payload.messages.length,
        systemMessageLength: payload.messages[0]?.role === 'system' ? payload.messages[0].content.length : 0,
        userMessageLength: payload.messages.find(m => m.role === 'user')?.content.length || 0,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
        response_format: payload.response_format,
      });
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': import.meta.env.SITE || 'https://localhost',
            'X-Title': '10x Flashcards App',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Log error details in development
          if (import.meta.env.MODE === 'development') {
            console.error('[OpenRouter] HTTP Error:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
            });
          }
          
          // Determine specific error code based on status
          let errorCode = OpenRouterErrorCode.HTTP_ERROR;
          let retryable = false;

          if (response.status === 401 || response.status === 403) {
            errorCode = OpenRouterErrorCode.AUTHENTICATION_ERROR;
          } else if (response.status === 429) {
            errorCode = OpenRouterErrorCode.RATE_LIMIT_ERROR;
            retryable = true;
          } else if (response.status >= 500) {
            errorCode = OpenRouterErrorCode.HTTP_ERROR;
            retryable = true;
          }

          throw new OpenRouterError(
            errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            errorCode,
            response.status,
            errorData,
            retryable
          );
        }

        // Parse and return successful response
        const data = (await response.json()) as ApiResponse;
        return data;
      } catch (error) {
        lastError = error;

        // Handle timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new OpenRouterError(
            `Request timed out after ${this.timeout}ms`,
            OpenRouterErrorCode.TIMEOUT_ERROR,
            undefined,
            error,
            true
          );
          lastError = timeoutError;

          // Retry timeout errors
          if (attempt < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, attempt);
            console.warn(`[OpenRouter] Timeout on attempt ${attempt + 1}, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw timeoutError;
        }

        // Handle network errors
        if (error instanceof TypeError) {
          const networkError = new OpenRouterError(
            `Network error: ${error.message}`,
            OpenRouterErrorCode.NETWORK_ERROR,
            undefined,
            error,
            true
          );
          lastError = networkError;

          // Retry network errors
          if (attempt < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, attempt);
            console.warn(`[OpenRouter] Network error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw networkError;
        }

        // Don't retry on authentication errors or validation errors
        if (
          error instanceof OpenRouterError &&
          !error.retryable
        ) {
          throw error;
        }

        // If we haven't exhausted retries, wait and try again
        if (attempt < this.maxRetries && error instanceof OpenRouterError && error.retryable) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(`[OpenRouter] Retryable error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // All retries exhausted
        if (error instanceof OpenRouterError) {
          throw error;
        }

        throw new OpenRouterError(
          `Request failed after ${this.maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          OpenRouterErrorCode.REQUEST_FAILED,
          undefined,
          error
        );
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new OpenRouterError(
      'Request failed: Unknown error',
      OpenRouterErrorCode.UNKNOWN_ERROR,
      undefined,
      lastError
    );
  }

  /**
   * Parses the API response and extracts the message content
   *
   * @param response - The raw API response
   * @returns The parsed content (as JSON if response_format is set)
   * @throws {OpenRouterError} If the response is invalid or JSON parsing fails
   */
  private parseResponse<T>(response: ApiResponse): T {
    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError(
        'Invalid API response: no choices returned',
        OpenRouterErrorCode.INVALID_RESPONSE
      );
    }

    const content = response.choices[0].message.content;

    if (!content) {
      throw new OpenRouterError(
        'Invalid API response: empty content',
        OpenRouterErrorCode.EMPTY_RESPONSE
      );
    }

    // If response format is set, parse as JSON
    if (this.currentResponseFormat) {
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new OpenRouterError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          OpenRouterErrorCode.JSON_PARSE_ERROR,
          undefined,
          error
        );
      }
    }

    // Return as-is if no response format is set
    return content as T;
  }

  /**
   * Logs request metadata without sensitive information
   * Only logs in development mode or when explicitly enabled
   *
   * @param metadata - The request metadata to log
   */
  private logRequest(metadata: RequestMetadata): void {
    // Only log in development or if explicitly enabled
    if (import.meta.env.MODE !== 'development' && !import.meta.env.OPENROUTER_ENABLE_LOGGING) {
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      model: metadata.model,
      duration: metadata.duration ? `${metadata.duration}ms` : 'N/A',
      success: metadata.success,
      tokens: metadata.totalTokens
        ? {
            prompt: metadata.promptTokens,
            completion: metadata.completionTokens,
            total: metadata.totalTokens,
          }
        : undefined,
      error: metadata.errorCode
        ? {
            code: metadata.errorCode,
            message: metadata.errorMessage,
          }
        : undefined,
    };

    if (metadata.success) {
      console.log('[OpenRouter] Request successful:', logData);
    } else {
      console.error('[OpenRouter] Request failed:', logData);
    }
  }
}

