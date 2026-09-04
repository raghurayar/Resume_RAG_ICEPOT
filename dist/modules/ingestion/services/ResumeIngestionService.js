"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeIngestionService = void 0;
const promises_1 = require("node:fs/promises");
const env_1 = require("../../../config/env");
const ResumeIngestionRepository_1 = require("../repositories/ResumeIngestionRepository");
const AlgorithmResumeParser_1 = require("./AlgorithmResumeParser");
const EmbeddingService_1 = require("./EmbeddingService");
const LLMResumeParser_1 = require("./LLMResumeParser");
const ResumeParserService_1 = require("./ResumeParserService");
const textCleaner_1 = require("../utils/textCleaner");
class ResumeIngestionService {
    pdfParser = new ResumeParserService_1.ResumeParserService();
    algorithmParser = new AlgorithmResumeParser_1.AlgorithmResumeParser();
    llmParser = new LLMResumeParser_1.LLMResumeParser();
    embeddingService = new EmbeddingService_1.EmbeddingService();
    repository = new ResumeIngestionRepository_1.ResumeIngestionRepository();
    async ingestResume(file) {
        const totalStartedAt = Date.now();
        const temporaryFilePath = file.path;
        let rawText = '';
        try {
            const extractStartedAt = Date.now();
            rawText = await this.pdfParser.extractTextFromPdf(temporaryFilePath);
            const extractMs = Date.now() - extractStartedAt;
            if (!rawText)
                throw new Error('Resume extraction failed');
            const cleanStartedAt = Date.now();
            const cleanText = (0, textCleaner_1.cleanResumeText)(rawText);
            const cleanMs = Date.now() - cleanStartedAt;
            if (!cleanText)
                throw new Error('Resume extraction failed');
            const parseStartedAt = Date.now();
            const resume = env_1.env.useLlmParser
                ? await this.llmParser.parseResume(cleanText)
                : this.algorithmParser.parseResume(cleanText);
            const parseMs = Date.now() - parseStartedAt;
            const embeddingStartedAt = Date.now();
            const embedding = await this.embeddingService.generateEmbedding({ ...resume, rawText: cleanText });
            const embeddingMs = Date.now() - embeddingStartedAt;
            const mongoStartedAt = Date.now();
            const resumeId = await this.repository.storeResume(file.originalname, resume, cleanText, embedding);
            const mongoInsertMs = Date.now() - mongoStartedAt;
            return {
                resumeId,
                resume,
                embeddingModel: env_1.env.mistralEmbedModel,
                embeddingDimension: embedding.length,
                timings: {
                    extractMs,
                    cleanMs,
                    parseMs,
                    embeddingMs,
                    mongoInsertMs,
                    totalMs: Date.now() - totalStartedAt,
                },
            };
        }
        finally {
            await (0, promises_1.unlink)(temporaryFilePath).catch(() => undefined);
        }
    }
    async ingesttResume(file) {
        return this.ingestResume(file);
    }
}
exports.ResumeIngestionService = ResumeIngestionService;
