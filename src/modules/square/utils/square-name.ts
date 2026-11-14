/**
 * The name form every Square auto-match compares: trimmed, lowercased, with
 * runs of whitespace collapsed to one space. Matching is exact on this form;
 * there is no fuzzy matching.
 */
export function normalizeSquareName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
