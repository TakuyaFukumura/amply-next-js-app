import {
    formatAmps,
    isValidApplianceAmpsTenths,
    MAX_APPLIANCE_AMPS_TENTHS,
    MAX_APPLIANCES,
    parseAmpsTenths,
    validateLimitTenths,
} from '../../../../src/lib/ampere/validation';

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

    it('formats large safe integers without floating-point drift', () => {
        expect(formatAmps(9007199254740942)).toBe('900719925474094.2A');
        expect(formatAmps(-9007199254740942)).toBe('-900719925474094.2A');
    });

    it('caps each appliance so the maximum appliance count can be summed exactly', () => {
        expect(MAX_APPLIANCES * MAX_APPLIANCE_AMPS_TENTHS).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
        expect(isValidApplianceAmpsTenths(MAX_APPLIANCE_AMPS_TENTHS)).toBe(true);
        expect(isValidApplianceAmpsTenths(MAX_APPLIANCE_AMPS_TENTHS + 1)).toBe(false);
        expect(isValidApplianceAmpsTenths(null)).toBe(false);
    });
});
