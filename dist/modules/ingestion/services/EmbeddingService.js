"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = exports.EmbeddingServiceError = void 0;
const env_1 = require("../../../config/env");
class EmbeddingServiceError extends Error {
    errorCode;
    constructor(errorCode, message) {
        super(message);
        this.errorCode = errorCode;
    }
}
exports.EmbeddingServiceError = EmbeddingServiceError;
class EmbeddingService {
    buildEmbeddingText(input) {
        return [
            input.name,
            input.role,
            input.skills.join(', '),
            input.company,
            input.experienceSummary,
            input.rawText,
        ].filter(Boolean).join('\n');
    }
    async generateEmbedding(input) {
        if (!env_1.env.mistralApiKey) {
            throw new EmbeddingServiceError('EMBEDDING_CONFIGURATION_MISSING', 'MISTRAL_API_KEY is required');
        }
        const mistralResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env_1.env.mistralApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: env_1.env.mistralEmbedModel,
                input: [this.buildEmbeddingText(input)],
            }),
        });
        if (!mistralResponse.ok) {
            throw new EmbeddingServiceError('EMBEDDING_REQUEST_FAILED', `Mistral request failed with HTTP ${mistralResponse.status}`);
        }
        const payload = await mistralResponse.json();
        const embedding = payload.data?.[0]?.embedding;
        if (!Array.isArray(embedding) || !embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
            throw new EmbeddingServiceError('EMBEDDING_INVALID_RESPONSE', 'Mistral returned an invalid embedding');
        }
        if (embedding.length !== env_1.env.embeddingDimension) {
            throw new EmbeddingServiceError('EMBEDDING_INVALID_DIMENSION', 'Mistral returned an unexpected embedding dimension');
        }
        return embedding;
    }
}
exports.EmbeddingService = EmbeddingService;
