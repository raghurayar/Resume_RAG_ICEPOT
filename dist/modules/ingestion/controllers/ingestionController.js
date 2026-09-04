"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestResumeBatch = exports.ingestResume = exports.storeResume = exports.embedResume = exports.parseResumeWithLlm = exports.parseResume = exports.detectResumeSkills = exports.cleanResume = exports.extractResumeText = exports.uploadResume = void 0;
const promises_1 = require("node:fs/promises");
const env_1 = require("../../../config/env");
const skills_1 = require("../../../config/skills");
const AlgorithmResumeParser_1 = require("../services/AlgorithmResumeParser");
const LLMResumeParser_1 = require("../services/LLMResumeParser");
const EmbeddingService_1 = require("../services/EmbeddingService");
const ResumeIngestionRepository_1 = require("../repositories/ResumeIngestionRepository");
const ResumeParserService_1 = require("../services/ResumeParserService");
const textCleaner_1 = require("../utils/textCleaner");
const errorHandler_1 = require("../../../middleware/errorHandler");
const ResumeIngestionService_1 = require("../services/ResumeIngestionService");
const resumeParserService = new ResumeParserService_1.ResumeParserService();
const algorithmResumeParser = new AlgorithmResumeParser_1.AlgorithmResumeParser();
const llmResumeParser = new LLMResumeParser_1.LLMResumeParser();
const embeddingService = new EmbeddingService_1.EmbeddingService();
const resumeRepository = new ResumeIngestionRepository_1.ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService_1.ResumeIngestionService();
const uploadResume = (request, response) => {
    if (!request.file) {
        (0, errorHandler_1.sendError)(response, request, 400, 'FILE_REQUIRED', 'Resume PDF is required');
        return;
    }
    response.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        file: {
            originalName: request.file.originalname,
            mimeType: request.file.mimetype,
            size: request.file.size,
        },
    });
};
exports.uploadResume = uploadResume;
const extractResumeText = async (request, response) => {
    if (!request.file) {
        (0, errorHandler_1.sendError)(response, request, 400, 'FILE_REQUIRED', 'Resume PDF is required');
        return;
    }
    const temporaryFilePath = request.file.path;
    try {
        const rawText = await resumeParserService.extractTextFromPdf(temporaryFilePath);
        await (0, promises_1.unlink)(temporaryFilePath).catch(() => undefined);
        if (!rawText) {
            (0, errorHandler_1.sendError)(response, request, 422, 'RESUME_EXTRACTION_FAILED', 'Resume extraction failed');
            return;
        }
        response.status(200).json({
            success: true,
            rawText,
            characters: rawText.length,
        });
    }
    catch (error) {
        console.error('Resume extraction failed', error);
        await (0, promises_1.unlink)(temporaryFilePath).catch(() => undefined);
        (0, errorHandler_1.sendError)(response, request, 422, 'RESUME_EXTRACTION_FAILED', 'Resume extraction failed');
    }
};
exports.extractResumeText = extractResumeText;
const cleanResume = (request, response) => {
    if (typeof request.body?.rawText !== 'string') {
        response.status(400).json({
            success: false,
            errorCode: 'INVALID_REQUEST',
            message: 'rawText must be a string',
        });
        return;
    }
    response.status(200).json({
        success: true,
        cleanText: (0, textCleaner_1.cleanResumeText)(request.body.rawText),
    });
};
exports.cleanResume = cleanResume;
const detectResumeSkills = (request, response) => {
    if (typeof request.body?.rawText !== 'string') {
        response.status(400).json({
            success: false,
            errorCode: 'INVALID_REQUEST',
            message: 'rawText must be a string',
        });
        return;
    }
    response.status(200).json({
        success: true,
        skills: (0, skills_1.detectSkills)(request.body.rawText),
    });
};
exports.detectResumeSkills = detectResumeSkills;
const parseResume = (request, response) => {
    if (typeof request.body?.rawText !== 'string') {
        response.status(400).json({
            success: false,
            errorCode: 'INVALID_REQUEST',
            message: 'rawText must be a string',
        });
        return;
    }
    response.status(200).json({
        success: true,
        resume: algorithmResumeParser.parseResume(request.body.rawText),
    });
};
exports.parseResume = parseResume;
const parseResumeWithLlm = async (request, response) => {
    if (!env_1.env.useLlmParser) {
        response.status(400).json({ success: false, errorCode: 'LLM_PARSER_DISABLED', message: 'LLM resume parser is disabled' });
        return;
    }
    if (typeof request.body?.rawText !== 'string') {
        response.status(400).json({ success: false, errorCode: 'INVALID_REQUEST', message: 'rawText must be a string' });
        return;
    }
    try {
        response.status(200).json({ success: true, resume: await llmResumeParser.parseResume(request.body.rawText) });
    }
    catch (error) {
        if (error instanceof LLMResumeParser_1.LLMParserError) {
            response.status(502).json({ success: false, errorCode: error.errorCode, message: error.message });
            return;
        }
        response.status(502).json({ success: false, errorCode: 'LLM_REQUEST_FAILED', message: 'LLM resume parsing failed' });
    }
};
exports.parseResumeWithLlm = parseResumeWithLlm;
const embedResume = async (request, response) => {
    const { name, role, skills, company, experienceSummary, rawText } = request.body ?? {};
    if (typeof rawText !== 'string' || !Array.isArray(skills) || !skills.every((skill) => typeof skill === 'string')) {
        response.status(400).json({ success: false, errorCode: 'INVALID_REQUEST', message: 'rawText and skills are required' });
        return;
    }
    try {
        const embedding = await embeddingService.generateEmbedding({ name, role, skills, company, experienceSummary, rawText });
        response.status(200).json({
            success: true,
            model: env_1.env.mistralEmbedModel,
            dimension: embedding.length,
            embedding,
        });
    }
    catch (error) {
        if (error instanceof EmbeddingService_1.EmbeddingServiceError) {
            (0, errorHandler_1.sendError)(response, request, 502, 'EMBEDDING_FAILED', 'Mistral embedding failed');
            return;
        }
        (0, errorHandler_1.sendError)(response, request, 502, 'EMBEDDING_FAILED', 'Mistral embedding failed');
    }
};
exports.embedResume = embedResume;
const storeResume = async (request, response) => {
    const { fileName, resume, rawText, embedding } = request.body ?? {};
    if (typeof fileName !== 'string' || !fileName.trim() || typeof rawText !== 'string' || !rawText.trim()
        || !resume || typeof resume !== 'object' || !Array.isArray(resume.skills)) {
        response.status(400).json({ success: false, errorCode: 'INVALID_REQUEST', message: 'fileName, resume, rawText, and skills are required' });
        return;
    }
    if (!Array.isArray(embedding) || embedding.length !== env_1.env.embeddingDimension) {
        response.status(400).json({
            success: false,
            errorCode: 'EMBEDDING_DIMENSION_MISMATCH',
            message: `embedding must contain exactly ${env_1.env.embeddingDimension} numbers`,
            expectedDimension: env_1.env.embeddingDimension,
            receivedDimension: Array.isArray(embedding) ? embedding.length : 0,
        });
        return;
    }
    if (!embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
        response.status(400).json({ success: false, errorCode: 'INVALID_EMBEDDING', message: 'embedding must contain only finite numbers' });
        return;
    }
    try {
        const resumeId = await resumeRepository.storeResume(fileName, resume, rawText, embedding);
        response.status(200).json({ success: true, message: 'Resume stored successfully', resumeId });
    }
    catch (error) {
        console.error('Resume storage failed', error);
        (0, errorHandler_1.sendError)(response, request, 503, 'INGESTION_FAILED', 'Resume ingestion failed');
    }
};
exports.storeResume = storeResume;
const ingestResume = async (request, response) => {
    if (!request.file) {
        (0, errorHandler_1.sendError)(response, request, 400, 'FILE_REQUIRED', 'Resume PDF is required');
        return;
    }
    try {
        const result = await resumeIngestionService.ingestResume(request.file);
        response.locals.ingestionTimings = result.timings;
        response.status(200).json({
            success: true,
            message: 'Resume ingestion completed',
            resumeId: result.resumeId,
            data: {
                name: result.resume.name,
                role: result.resume.role,
                company: result.resume.company,
                totalExperience: result.resume.totalExperience,
                skillsCount: result.resume.skills.length,
                embeddingModel: result.embeddingModel,
                embeddingDimension: result.embeddingDimension,
            },
            timings: result.timings,
        });
    }
    catch (error) {
        console.error('Resume ingestion failed', error);
        (0, errorHandler_1.sendError)(response, request, 503, 'INGESTION_FAILED', 'Resume ingestion failed');
    }
};
exports.ingestResume = ingestResume;
const ingestResumeBatch = async (request, response) => {
    const files = request.files;
    if (!files || ![5, 10].includes(files.length)) {
        await Promise.all((files ?? []).map((file) => (0, promises_1.unlink)(file.path).catch(() => undefined)));
        (0, errorHandler_1.sendError)(response, request, 400, 'INVALID_BATCH_SIZE', 'Batch must contain exactly 5 or 10 PDF files');
        return;
    }
    const results = [];
    for (const file of files) {
        try {
            const result = await resumeIngestionService.ingestResume(file);
            results.push({
                fileName: file.originalname,
                success: true,
                resumeId: result.resumeId,
                name: result.resume.name,
                role: result.resume.role,
            });
        }
        catch (error) {
            console.error('Batch resume ingestion failed', error);
            results.push({
                fileName: file.originalname,
                success: false,
                errorCode: 'INGESTION_FAILED',
                message: 'Resume ingestion failed',
            });
        }
    }
    const failed = results.filter((result) => result.success === false).length;
    response.status(failed === 0 ? 200 : 207).json({
        success: failed === 0,
        batchSize: files.length,
        processed: files.length - failed,
        failed,
        resumes: results,
    });
};
exports.ingestResumeBatch = ingestResumeBatch;
