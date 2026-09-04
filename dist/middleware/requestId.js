"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = void 0;
const node_crypto_1 = require("node:crypto");
const requestId = (request, response, next) => {
    const id = request.header('x-request-id') ?? (0, node_crypto_1.randomUUID)();
    response.setHeader('x-request-id', id);
    next();
};
exports.requestId = requestId;
