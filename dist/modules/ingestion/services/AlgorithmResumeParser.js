"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmResumeParser = void 0;
const skills_1 = require("../../../config/skills");
const regex_1 = require("../utils/regex");
const SECTION_HEADINGS = /^(PROFESSIONAL SUMMARY|SUMMARY|EDUCATION|PROFESSIONAL EXPERIENCE|EXPERIENCE|SKILLS|SKILLS & EXPERTISE|TOOLS & PLATFORMS|INDUSTRIES SERVED)$/i;
const ROLE_WORDS = /\b(architect|engineer|developer|manager|specialist|strategist|lead|trainer|analyst|consultant|designer|tester|administrator|director)\b/i;
const COMPANY_ROW = /^(?:\d+\.?\s*)?(.+?)\s*\|\s*([^|]+?)(?:\s*\|.*)?$/;
const DATE_RANGE = /\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\bPresent\b/i;
const EDUCATION_TERMS = /\b(Bachelor|Master|B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?)\b/i;
const linesOf = (rawText) => rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
const valueAfterLabel = (lines, label) => {
    const line = lines.find((candidate) => new RegExp(`^${label}\\s*[:\\-]`, 'i').test(candidate));
    return line?.replace(new RegExp(`^${label}\\s*[:\\-]\\s*`, 'i'), '').trim() || undefined;
};
const findRole = (lines) => lines.find((line) => {
    return !SECTION_HEADINGS.test(line) && !line.includes(':') && ROLE_WORDS.test(line);
});
const findName = (lines, role) => {
    const explicitName = valueAfterLabel(lines, 'name');
    if (explicitName)
        return explicitName;
    const roleIndex = role ? lines.indexOf(role) : -1;
    const candidates = roleIndex >= 0 ? lines.slice(0, roleIndex) : lines;
    return candidates.find((line) => !SECTION_HEADINGS.test(line)
        && !line.includes(':')
        && !regex_1.EMAIL_REGEX.test(line)
        && !regex_1.PHONE_REGEX.test(line)
        && !/^\+?\d[\d\s().-]+$/.test(line))
        ?? (roleIndex >= 0 ? lines[roleIndex + 1] : undefined);
};
const findExperienceRows = (lines) => lines.reduce((rows, line, index) => {
    const match = line.match(COMPANY_ROW);
    if (!match || !DATE_RANGE.test(match[2]))
        return rows;
    if (EDUCATION_TERMS.test(match[1]))
        return rows;
    const previousLine = lines[index - 1]?.replace(/^\d+\.?\s*/, '').trim();
    const title = ROLE_WORDS.test(match[1])
        ? match[1].trim()
        : previousLine;
    if (title && !SECTION_HEADINGS.test(title))
        rows.push({ title, company: match[1].trim() });
    return rows;
}, []);
class AlgorithmResumeParser {
    parseResume(rawText) {
        const lines = linesOf(rawText);
        const role = findRole(lines);
        const experienceMatch = rawText.match(regex_1.EXPERIENCE_REGEX);
        const experienceRows = findExperienceRows(lines);
        const summaryStart = lines.findIndex((line) => /^(PROFESSIONAL SUMMARY|SUMMARY)$/i.test(line));
        const nextHeading = summaryStart >= 0
            ? lines.slice(summaryStart + 1).findIndex((line) => SECTION_HEADINGS.test(line))
            : -1;
        const summaryLines = summaryStart >= 0
            ? lines.slice(summaryStart + 1, nextHeading >= 0 ? summaryStart + 1 + nextHeading : undefined)
            : [];
        return {
            name: findName(lines, role),
            email: rawText.match(regex_1.EMAIL_REGEX)?.[0],
            phone: rawText.match(regex_1.PHONE_REGEX)?.[0],
            location: valueAfterLabel(lines, 'location') ?? valueAfterLabel(lines, 'working'),
            company: experienceRows[0]?.company,
            role: role ?? experienceRows[0]?.title,
            education: lines.find((line) => /\b(B\.?Tech|B\.?E\.?|Bachelor|Master|M\.?Tech|M\.?E\.?)\b/i.test(line)),
            totalExperience: experienceMatch ? Number(experienceMatch[1]) : undefined,
            skills: (0, skills_1.detectSkills)(rawText),
            jobTitles: experienceRows.map((match) => match.title),
            experienceSummary: summaryLines.length > 0 ? summaryLines.join(' ') : undefined,
        };
    }
}
exports.AlgorithmResumeParser = AlgorithmResumeParser;
