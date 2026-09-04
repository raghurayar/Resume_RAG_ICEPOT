"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parsePort = (value) => {
    const port = Number(value ?? 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535');
    }
    return port;
};
const requireValue = (name) => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is required. Create a local .env file from .env.example.`);
    }
    return value;
};
const parseBoolean = (value) => value?.toLowerCase() === 'true';
exports.env = {
    port: parsePort(process.env.PORT),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    mongodbUri: requireValue('MONGODB_URI'),
    mongodbDbName: requireValue('MONGODB_DB_NAME'),
    maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 5),
    useLlmParser: parseBoolean(process.env.USE_LLM_PARSER),
    groqApiKey: process.env.GROQ_API_KEY?.trim(),
    groqModel: process.env.GROQ_MODEL?.trim() ?? 'llama-3.1-8b-instant',
    mistralApiKey: process.env.MISTRAL_API_KEY?.trim(),
    mistralEmbedModel: process.env.MISTRAL_EMBED_MODEL?.trim() ?? 'mistral-embed',
    embeddingDimension: Number(process.env.EMBEDDING_DIMENSION ?? 1024),
};
