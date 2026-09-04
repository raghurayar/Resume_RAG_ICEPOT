"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const multerConfig_1 = require("../../../config/multerConfig");
const ingestionController_1 = require("../controllers/ingestionController");
const errorHandler_1 = require("../../../middleware/errorHandler");
const ingestionRoutes = (0, express_1.Router)();
ingestionRoutes.get('/resume/health', (_request, response) => {
    response.status(200).json({
        status: 'ok',
        module: 'resume-ingestion',
    });
});
const handleUploadError = (error, request, response, next) => {
    if (error instanceof multerConfig_1.UploadValidationError) {
        (0, errorHandler_1.sendError)(response, request, 415, error.errorCode, error.message);
        return;
    }
    if (error instanceof multer_1.default.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        (0, errorHandler_1.sendError)(response, request, 413, 'FILE_TOO_LARGE', 'Resume exceeds maximum upload size');
        return;
    }
    if (error instanceof multer_1.default.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
        (0, errorHandler_1.sendError)(response, request, 400, 'INVALID_FILE_FIELD', 'Upload the resume using the file field');
        return;
    }
    if (error instanceof multer_1.default.MulterError) {
        (0, errorHandler_1.sendError)(response, request, 400, 'INVALID_UPLOAD', error.message);
        return;
    }
    next(error);
};
const parseResumeUpload = (request, response, next, onSuccess) => {
    multerConfig_1.uploadResume.single('file')(request, response, (error) => {
        if (!error) {
            onSuccess();
            return;
        }
        handleUploadError(error, request, response, next);
    });
};
ingestionRoutes.post('/resume/upload', (request, response, next) => {
    parseResumeUpload(request, response, next, () => (0, ingestionController_1.uploadResume)(request, response));
});
ingestionRoutes.post('/resume/extract', (request, response, next) => {
    parseResumeUpload(request, response, next, () => {
        void (0, ingestionController_1.extractResumeText)(request, response).catch(next);
    });
});
ingestionRoutes.post('/resume/clean', ingestionController_1.cleanResume);
ingestionRoutes.post('/resume/skills', ingestionController_1.detectResumeSkills);
ingestionRoutes.post('/resume/parse', ingestionController_1.parseResume);
ingestionRoutes.post('/resume/llm-parse', (request, response, next) => {
    void (0, ingestionController_1.parseResumeWithLlm)(request, response).catch(next);
});
ingestionRoutes.post('/resume/embed', (request, response, next) => {
    void (0, ingestionController_1.embedResume)(request, response).catch(next);
});
ingestionRoutes.post('/resume/store', (request, response, next) => {
    void (0, ingestionController_1.storeResume)(request, response).catch(next);
});
ingestionRoutes.post('/resume/ingest', (request, response, next) => {
    parseResumeUpload(request, response, next, () => {
        void (0, ingestionController_1.ingestResume)(request, response).catch(next);
    });
});
ingestionRoutes.post('/resume/ingest-batch', (request, response, next) => {
    multerConfig_1.uploadResume.array('files', 10)(request, response, (error) => {
        if (error) {
            handleUploadError(error, request, response, next);
            return;
        }
        void (0, ingestionController_1.ingestResumeBatch)(request, response).catch(next);
    });
});
exports.default = ingestionRoutes;
