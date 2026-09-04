"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResume = exports.UploadValidationError = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const multer_1 = __importDefault(require("multer"));
const env_1 = require("./env");
class UploadValidationError extends Error {
    errorCode;
    constructor(errorCode, message) {
        super(message);
        this.errorCode = errorCode;
    }
}
exports.UploadValidationError = UploadValidationError;
const uploadDirectory = node_path_1.default.resolve(process.cwd(), 'uploads');
node_fs_1.default.mkdirSync(uploadDirectory, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: uploadDirectory,
    filename: (_request, _file, callback) => {
        callback(null, `${(0, node_crypto_1.randomUUID)()}.pdf`);
    },
});
exports.uploadResume = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: env_1.env.maxUploadSizeMb * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const extension = node_path_1.default.extname(file.originalname).toLowerCase();
        if (extension !== '.pdf' || file.mimetype !== 'application/pdf') {
            callback(new UploadValidationError('INVALID_FILE_TYPE', 'Only PDF files are allowed'));
            return;
        }
        callback(null, true);
    },
});
