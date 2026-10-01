import {formatAmps, parseAmpsTenths, validateLimitTenths} from '../../../../src/lib/ampere/validation';

describe('ampere validation', () => {
    it.each([
        ['0', 0],
        ['2.5', 25],
        ['2.50', 25],
        ['60.0', 600],
    ])('parses %s into tenths of an amp', (input, expected) => {
        expect(parseAmpsTenths(input)).toBe(expected);
    });

    it.each(['', '-1', '2.05', '1e2', 'NaN', 'Infinity', '.5', '2.'])('rejects invalid input %s', (input) => {
        expect(parseAmpsTenths(input)).toBeNull();
    });

    it('checks limit boundaries and formats tenths', () => {
        expect(validateLimitTenths(1)).toBeNull();
        expect(validateLimitTenths(600)).toBeNull();
        expect(validateLimitTenths(0)).toContain('0.1A');
        expect(validateLimitTenths(601)).toContain('60.0A');
        expect(formatAmps(123)).toBe('12.3A');
    });
});
