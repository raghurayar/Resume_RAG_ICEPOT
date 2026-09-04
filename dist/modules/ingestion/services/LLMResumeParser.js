"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMResumeParser = exports.LLMParserError = void 0;
const env_1 = require("../../../config/env");
class LLMParserError extends Error {
    errorCode;
    constructor(errorCode, message) {
        super(message);
        this.errorCode = errorCode;
    }
}
exports.LLMParserError = LLMParserError;
const optionalStringFields = [
    'name', 'email', 'phone', 'location', 'company', 'role', 'education', 'experienceSummary',
];
const isParsedResume = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const candidate = value;
    if (!Array.isArray(candidate.skills) || !candidate.skills.every((skill) => typeof skill === 'string')) {
        return false;
    }
    if (optionalStringFields.some((field) => candidate[field] !== undefined
        && candidate[field] !== null && typeof candidate[field] !== 'string')) {
        return false;
    }
    return ['totalExperience', 'relevantExperience'].every((field) => (candidate[field] === undefined || candidate[field] === null || typeof candidate[field] === 'number'));
};
const normalizeParsedResume = (resume) => {
    const normalized = { ...resume };
    for (const field of [...optionalStringFields, 'totalExperience', 'relevantExperience']) {
        if (normalized[field] === null)
            delete normalized[field];
    }
    return normalized;
};
const normalizeModelResponse = (value) => {
    const experience = Array.isArray(value.experience) && value.experience[0] && typeof value.experience[0] === 'object'
        ? value.experience[0]
        : undefined;
    const address = value.address && typeof value.address === 'object'
        ? value.address
        : undefined;
    const education = Array.isArray(value.education) && value.education[0] && typeof value.education[0] === 'object'
        ? value.education[0]
        : undefined;
    return {
        name: value.name,
        email: value.email,
        phone: value.phone,
        location: address?.working ?? value.location,
        company: value.company ?? experience?.company,
        role: value.role ?? value.title ?? experience?.title,
        education: typeof value.education === 'string'
            ? value.education
            : education?.degree,
        totalExperience: value.totalExperience,
        relevantExperience: value.relevantExperience,
        skills: value.skills,
        jobTitles: value.jobTitles ?? (Array.isArray(value.experience)
            ? value.experience
                .filter((item) => !!item && typeof item === 'object')
                .map((item) => item.title)
                .filter((title) => typeof title === 'string')
            : undefined),
        experienceSummary: value.experienceSummary ?? value.summary,
    };
};
const parseModelJson = (content) => {
    const normalized = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
        const parsed = JSON.parse(normalized);
        if (!parsed || typeof parsed !== 'object')
            throw new Error('Schema validation failed');
        const normalizedResume = normalizeModelResponse(parsed);
        if (!isParsedResume(normalizedResume))
            throw new Error('Schema validation failed');
        return normalizeParsedResume(normalizedResume);
    }
    catch {
        throw new LLMParserError('LLM_INVALID_RESPONSE', 'LLM returned an invalid resume response');
    }
};
class LLMResumeParser {
    async parseResume(rawText) {
        if (!env_1.env.groqApiKey) {
            throw new LLMParserError('LLM_CONFIGURATION_MISSING', 'GROQ_API_KEY is required when LLM parsing is enabled');
        }
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env_1.env.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: env_1.env.groqModel,
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'Extract only facts from the resume. Return JSON matching the ParsedResume schema. Omit unsupported fields. Always include skills as an array.',
                    },
                    { role: 'user', content: rawText },
                ],
            }),
        });
        if (!groqResponse.ok) {
            throw new LLMParserError('LLM_REQUEST_FAILED', `LLM request failed with HTTP ${groqResponse.status}`);
        }
        const payload = await groqResponse.json();
        const content = payload.choices?.[0]?.message?.content;
        if (!content) {
            throw new LLMParserError('LLM_INVALID_RESPONSE', 'LLM returned an empty response');
        }
        return parseModelJson(content);
    }
}
exports.LLMResumeParser = LLMResumeParser;
