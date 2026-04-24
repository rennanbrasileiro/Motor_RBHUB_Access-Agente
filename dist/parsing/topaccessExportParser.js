"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTopAccessExportLine = parseTopAccessExportLine;
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/;
function parseTopAccessExportLine(line, source = "topaccess-export") {
    const trimmed = line.trim();
    if (!trimmed)
        return null;
    const dateMatch = trimmed.match(DATE_RE);
    if (!dateMatch) {
        return {
            rawLine: line,
            source,
            eventType: "unknown",
            occurredAt: new Date().toISOString(),
            metadata: { parseMode: "fallback" }
        };
    }
    const [, dd, mm, yyyy, hh, min, ss = "00"] = dateMatch;
    const occurredAt = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`).toISOString();
    const tail = trimmed.slice(dateMatch.index + dateMatch[0].length).trim();
    const tokens = tail.split(/\s+/).filter(Boolean);
    let cardNumber;
    let eventType = "unknown";
    let employeeName;
    for (const token of tokens) {
        if (/^\d{8,20}$/.test(token) && !cardNumber) {
            cardNumber = token;
            continue;
        }
        if (/^(E|ENTRADA|IN)$/i.test(token)) {
            eventType = "entry";
            continue;
        }
        if (/^(S|SAIDA|OUT)$/i.test(token)) {
            eventType = "exit";
            continue;
        }
        if (/^(NEG|DENIED|N)$/i.test(token)) {
            eventType = "denied";
            continue;
        }
    }
    const nameStart = tokens.findIndex(t => /^\d{8,20}$/.test(t));
    if (nameStart >= 0 && nameStart + 1 < tokens.length) {
        employeeName = tokens.slice(nameStart + 1).join(' ').trim();
        if (/^(E|S|NEG)$/i.test(employeeName))
            employeeName = undefined;
    }
    return {
        rawLine: line,
        source,
        cardNumber,
        badgeCode: cardNumber,
        employeeName,
        eventType,
        accessGranted: eventType !== "denied",
        occurredAt,
        metadata: { tokens }
    };
}
