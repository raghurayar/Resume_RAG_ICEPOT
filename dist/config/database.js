"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResumesCollection = exports.pingDatabase = exports.getMongoClient = exports.createMongoClient = void 0;
const mongodb_1 = require("mongodb");
const createMongoClient = (uri) => new mongodb_1.MongoClient(uri);
exports.createMongoClient = createMongoClient;
let client;
let connectionPromise;
const getMongoClient = (uri) => {
    if (!uri) {
        return Promise.reject(new Error('MONGODB_URI is not configured'));
    }
    if (!client) {
        client = (0, exports.createMongoClient)(uri);
    }
    if (!connectionPromise) {
        connectionPromise = client.connect().catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }
    return connectionPromise;
};
exports.getMongoClient = getMongoClient;
const pingDatabase = async (uri, databaseName) => {
    const connectedClient = await (0, exports.getMongoClient)(uri);
    const startedAt = Date.now();
    await connectedClient.db(databaseName).command({ ping: 1 });
    return Date.now() - startedAt;
};
exports.pingDatabase = pingDatabase;
const getResumesCollection = async (uri, databaseName) => {
    const connectedClient = await (0, exports.getMongoClient)(uri);
    return connectedClient.db(databaseName).collection('resumes');
};
exports.getResumesCollection = getResumesCollection;
