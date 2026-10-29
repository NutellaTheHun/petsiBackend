import { normalizeSquareName } from './square-name';

/** "serves 8", "serves 8-10", "(serves 8 – 10)", "serves 8 to 10". */
const SERVES_TEXT = /\(?\s*\bserves?\s+\d+(?:\s*(?:-|–|to)\s*\d+)?\s*\)?/gi;

/**
 * A size name without its "serves N" text, normalized, with separators left
 * dangling at either end removed: `large 10" serves 8-10` → `large 10"`.
 */
export function stripServesText(name: string): string {
    return normalizeSquareName(name.replace(SERVES_TEXT, ' ')).replace(
        /^[\s,;:\-–(]+|[\s,;:\-–(]+$/g,
        '',
    );
}

/**
 * Groups names that are equal once the "serves N" text is removed, keeping
 * only groups of two or more names that contained some. Never applied
 * automatically: the tenant decides whether a group is one size.
 */
export function groupByServesText<T>(
    rows: T[],
    nameOf: (row: T) => string,
): { baseName: string; rows: T[] }[] {
    const groups = new Map<string, T[]>();
    for (const row of rows) {
        const name = nameOf(row);
        const baseName = stripServesText(name);
        if (baseName === normalizeSquareName(name) || baseName === '') {
            continue;
        }
        groups.set(baseName, [...(groups.get(baseName) ?? []), row]);
    }
    // A name without serves text belongs with its group too
    for (const row of rows) {
        const name = normalizeSquareName(nameOf(row));
        groups.get(name)?.push(row);
    }
    return [...groups.entries()]
        .filter(([, members]) => members.length > 1)
        .map(([baseName, members]) => ({ baseName, rows: members }))
        .sort((a, b) => a.baseName.localeCompare(b.baseName));
}
