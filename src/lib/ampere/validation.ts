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

export function validateLimitTenths(value: number | null): string | null {
    if (value === null) {
        return '0.1A刻みの数値を入力してください。';
    }
    if (value < 1) {
        return '上限は0.1A以上にしてください。';
    }
    if (value > 600) {
        return '上限は60.0A以下にしてください。';
    }
    return null;
}

export function formatAmps(tenths: number): string {
    return `${(tenths / 10).toFixed(1)}A`;
}
