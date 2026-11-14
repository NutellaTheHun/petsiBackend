import { normalizeSquareName } from './square-name';

describe('normalizeSquareName', () => {
    it('trims, lowercases and collapses whitespace', () => {
        expect(normalizeSquareName('  Main   Street\tBakery ')).toBe(
            'main street bakery',
        );
    });

    it('keeps punctuation, so near-matches stay distinct', () => {
        expect(normalizeSquareName('Main St.')).not.toBe(
            normalizeSquareName('Main St'),
        );
    });
});
