"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const requestId_1 = require("./middleware/requestId");
const ingestionRoutes_1 = __importDefault(require("./modules/ingestion/routes/ingestionRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(requestId_1.requestId);
app.use(logger_1.logger);
app.use('/v1', ingestionRoutes_1.default);
app.get('/v1/health', (_request, response) => {
    response.status(200).json({
        status: 'ok',
        app: 'resume-rag-backend',
        version: '1.0.0',
        uptime: Number(process.uptime().toFixed(1)),
    });
});
app.get('/v1/health/db', async (_request, response) => {
    try {
        const latencyMs = await (0, database_1.pingDatabase)(env_1.env.mongodbUri, env_1.env.mongodbDbName);
        response.status(200).json({
            status: 'ok',
            database: 'mongodb',
            connected: true,
            latencyMs,
        });
    }
    catch (error) {
        console.error('MongoDB health check failed', error);
        response.status(503).json({
            status: 'error',
            database: 'mongodb',
            connected: false,
            errorCode: 'DB_CONNECTION_FAILED',
        });
    }
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
