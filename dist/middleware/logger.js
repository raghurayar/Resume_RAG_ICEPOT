"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const logger = (request, response, next) => {
    const startedAt = Date.now();
    response.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        const ingestionTimings = response.locals.ingestionTimings;
        console.log(JSON.stringify({
            requestId: response.getHeader('x-request-id'),
            endpoint: request.originalUrl,
            ...(request.file?.originalname ? { fileName: request.file.originalname } : {}),
            statusCode: response.statusCode,
            ...(ingestionTimings ?? { totalMs: durationMs }),
        }));
    });
    next();
};
exports.logger = logger;
