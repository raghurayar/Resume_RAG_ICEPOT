"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSkills = exports.SKILLS = void 0;
exports.SKILLS = [
    'Java',
    'Selenium',
    'Playwright',
    'API Testing',
    'Postman',
    'SQL',
    'MongoDB',
    'Jenkins',
    'Python',
    'C#',
    'REST Assured',
    'Cucumber',
    'GenAI',
    'Langchain',
    'Langgraph',
    'RAG',
    'Azure DevOps',
    'AWS Lambda',
    'GitHub',
    'DeepEval',
    'MCP (Model Context Protocol)',
];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const detectSkills = (rawText) => exports.SKILLS.filter((skill) => {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(skill)}(?![a-z0-9])`, 'i');
    return pattern.test(rawText);
});
exports.detectSkills = detectSkills;
