import { groupByServesText, stripServesText } from './square-size-suggestions';

describe('stripServesText', () => {
    it.each([
        ['Large 10" serves 8-10', 'large 10"'],
        ['large 10"  serves 10 - 12', 'large 10"'],
        ['Small (serves 4)', 'small'],
        ['Medium, serves 6', 'medium'],
        ['Party serves 20 to 25', 'party'],
        ['Large 10"', 'large 10"'],
    ])('%s → %s', (name, expected) => {
        expect(stripServesText(name)).toBe(expected);
    });
});

describe('groupByServesText', () => {
    const names = (groups: { baseName: string; rows: string[] }[]) =>
        groups.map((g) => [g.baseName, [...g.rows].sort()]);

    it('groups names that differ only in their "serves N" text', () => {
        const groups = groupByServesText(
            [
                'large 10" serves 8-10',
                'large 10" serves 10-12',
                'large 10"',
                'small 6" serves 4',
                'whoopie pie',
            ],
            (n) => n,
        );
        expect(names(groups)).toEqual([
            [
                'large 10"',
                [
                    'large 10"',
                    'large 10" serves 10-12',
                    'large 10" serves 8-10',
                ],
            ],
        ]);
    });

    it('does not group names that differ in more than the serves text', () => {
        expect(
            groupByServesText(
                ['large 10" serves 8-10', 'large - 10" serves 8-10'],
                (n) => n,
            ),
        ).toEqual([]);
    });
});
