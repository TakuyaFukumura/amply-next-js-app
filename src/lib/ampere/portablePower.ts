export const HOUSEHOLD_VOLTAGE = 100;
export const POWER_STATION_CAPACITY_WH = 1024;
export const AC_OUTPUT_LIMIT_W = 1550;
export const AC_SINGLE_PORT_LIMIT_W = 1500;
export const AC_USABLE_CAPACITY_RATIO = 0.85;

export function getPowerWatts(ampsTenths: number): number {
    return ampsTenths * HOUSEHOLD_VOLTAGE / 10;
}

export function formatEstimatedRuntime(ampsTenths: number): string {
    const watts = getPowerWatts(ampsTenths);
    if (watts <= 0) return '算出できません';

    const runtimeHours = (POWER_STATION_CAPACITY_WH * AC_USABLE_CAPACITY_RATIO) / watts;
    return runtimeHours < 1
        ? `約${Math.round(runtimeHours * 60)}分`
        : `約${runtimeHours.toFixed(1)}時間`;
}
