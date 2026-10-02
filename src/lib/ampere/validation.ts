export const MAX_APPLIANCES = 50;
export const MAX_APPLIANCE_AMPS_TENTHS = Math.floor(Number.MAX_SAFE_INTEGER / MAX_APPLIANCES);

export function parseAmpsTenths(value: string): number | null {
    const normalized = value.trim();
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
        return null;
    }

    const [whole, fraction = ''] = normalized.split('.');
    if (fraction.length > 1 && /[1-9]/.test(fraction.slice(1))) {
        return null;
    }

    const tenths = Number(whole) * 10 + Number((fraction + '0').slice(0, 1));
    return Number.isSafeInteger(tenths) ? tenths : null;
}

export function isValidApplianceAmpsTenths(value: number | null): value is number {
    return value !== null
        && Number.isSafeInteger(value)
        && value >= 0
        && value <= MAX_APPLIANCE_AMPS_TENTHS;
}

export function formatAmps(tenths: number): string {
    const absoluteTenths = Math.abs(tenths);
    const tenthsDigit = absoluteTenths % 10;
    const wholeAmps = (absoluteTenths - tenthsDigit) / 10;
    return `${tenths < 0 ? '-' : ''}${wholeAmps}.${tenthsDigit}A`;
}
