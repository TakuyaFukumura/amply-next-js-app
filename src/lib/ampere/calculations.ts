import type {AmpereSummary, Appliance, ChartGroup} from './types';

export function getApplianceAmpsTenths(appliance: Appliance): number {
    if (!appliance.enabled) {
        return 0;
    }
    if (appliance.starting && appliance.startupAmpsTenths !== null) {
        return appliance.startupAmpsTenths;
    }
    return appliance.runningAmpsTenths;
}

export function calculateSummary(appliances: Appliance[], limitTenths: number): AmpereSummary {
    const totalTenths = appliances.reduce(
        (total, appliance) => total + getApplianceAmpsTenths(appliance),
        0
    );
    const remainingTenths = limitTenths - totalTenths;

    return {
        totalTenths,
        limitTenths,
        remainingTenths,
        status: remainingTenths > 0 ? 'within' : remainingTenths === 0 ? 'reached' : 'exceeded',
    };
}

export function getChartGroups(appliances: Appliance[], limit = 10): ChartGroup[] {
    const enabled = appliances
        .filter((appliance) => appliance.enabled)
        .map((appliance) => ({
            id: appliance.id,
            name: appliance.name,
            ampsTenths: getApplianceAmpsTenths(appliance),
            applianceCount: 1,
        }))
        .sort((a, b) => b.ampsTenths - a.ampsTenths || a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id));

    if (enabled.length <= limit) {
        return enabled;
    }

    const top = enabled.slice(0, limit);
    const other = enabled.slice(limit);
    return [
        ...top,
        {
            id: 'other',
            name: 'その他',
            ampsTenths: other.reduce((total, group) => total + group.ampsTenths, 0),
            applianceCount: other.length,
        },
    ];
}
