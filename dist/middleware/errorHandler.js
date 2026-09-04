"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.sendError = void 0;
const sendError = (response, request, status, errorCode, message) => {
    response.status(status).json({
        success: false,
        requestId: response.getHeader('x-request-id') ?? request.header('x-request-id'),
        errorCode,
        message,
    });
};
exports.sendError = sendError;
const errorHandler = (error, _request, response, _next) => {
    console.error(error);
    (0, exports.sendError)(response, _request, 500, 'INGESTION_FAILED', 'Resume ingestion failed');
};
exports.errorHandler = errorHandler;
