"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractExperienceYears = exports.EXPERIENCE_REGEX = exports.PHONE_REGEX = exports.EMAIL_REGEX = void 0;
exports.EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
exports.PHONE_REGEX = /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/;
exports.EXPERIENCE_REGEX = /(\d+(\.\d+)?)\s*\+?\s*(years|yrs)/i;
const extractExperienceYears = (text) => {
    const match = text.match(exports.EXPERIENCE_REGEX);
    return match ? Number(match[1]) : undefined;
};
exports.extractExperienceYears = extractExperienceYears;
