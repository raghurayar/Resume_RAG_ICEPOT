"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserService = void 0;
const promises_1 = require("node:fs/promises");
const pdf_parse_1 = require("pdf-parse");
class ResumeParserService {
    async extractTextFromPdf(filePath) {
        const parser = new pdf_parse_1.PDFParse({ data: await (0, promises_1.readFile)(filePath) });
        try {
            const result = await parser.getText();
            return result.text.trim();
        }
        finally {
            await parser.destroy();
        }
    }
}
exports.ResumeParserService = ResumeParserService;
