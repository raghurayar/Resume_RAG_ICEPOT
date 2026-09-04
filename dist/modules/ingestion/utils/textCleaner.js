"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanResumeText = void 0;
const unwantedControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const cleanResumeText = (rawText) => rawText
    .replace(/\r\n?/g, '\n')
    .replace(unwantedControlCharacters, '')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
exports.cleanResumeText = cleanResumeText;
