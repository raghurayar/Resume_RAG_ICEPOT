"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeIngestionRepository = void 0;
const node_crypto_1 = require("node:crypto");
const env_1 = require("../../../config/env");
const database_1 = require("../../../config/database");
let indexPromise;
const getCollection = async () => {
    if (!indexPromise) {
        indexPromise = (0, database_1.getResumesCollection)(env_1.env.mongodbUri, env_1.env.mongodbDbName)
            .then(async (collection) => {
            await collection.createIndex({ contentHash: 1 }, { unique: true, partialFilterExpression: { contentHash: { $type: 'string' } } });
            return collection;
        });
    }
    return indexPromise;
};
class ResumeIngestionRepository {
    async storeResume(fileName, resume, rawText, embedding) {
        const collection = await getCollection();
        const contentHash = (0, node_crypto_1.createHash)('sha256').update(rawText).digest('hex');
        const now = new Date();
        const result = await collection.findOneAndUpdate({ contentHash }, {
            $set: {
                fileName,
                ...resume,
                rawText,
                embedding,
                embeddingModel: env_1.env.mistralEmbedModel,
                embeddingDimension: embedding.length,
                updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
        }, { upsert: true, returnDocument: 'after' });
        if (!result)
            throw new Error('Resume storage returned no document');
        return result._id.toHexString();
    }
}
exports.ResumeIngestionRepository = ResumeIngestionRepository;
