import {calculateSummary, getChartGroups} from '../../../../src/lib/ampere/calculations';
import {MAX_APPLIANCE_AMPS_TENTHS, MAX_APPLIANCES} from '../../../../src/lib/ampere/validation';
import type {Appliance} from '../../../../src/lib/ampere/types';

const appliance = (id: string, name: string, value: number, options: Partial<Appliance> = {}): Appliance => ({
    id,
    name,
    runningAmpsTenths: value,
    startupAmpsTenths: null,
    enabled: true,
    starting: false,
    note: '',
    origin: 'catalog',
    ...options,
});

describe('ampere calculations', () => {
    it('sums only enabled appliances and uses startup values when available', () => {
        const appliances = [
            appliance('fridge', '冷蔵庫', 25, {starting: true, startupAmpsTenths: 40}),
            appliance('microwave', '電子レンジ', 150, {enabled: false}),
            appliance('pc', 'PC', 7, {starting: true}),
        ];
        expect(calculateSummary(appliances, 200)).toMatchObject({
            totalTenths: 47,
            remainingTenths: 153,
            status: 'within',
        });
        expect(calculateSummary(appliances, 47).status).toBe('reached');
        expect(calculateSummary(appliances, 40).status).toBe('exceeded');
    });

    it('groups the top ten in a deterministic order and sums the rest', () => {
        const appliances = Array.from({length: 12}, (_, index) =>
            appliance(`id-${index}`, `家電${index}`, (12 - index) * 10)
        );
        const groups = getChartGroups(appliances);
        expect(groups).toHaveLength(11);
        expect(groups[0].name).toBe('家電0');
        expect(groups[10]).toMatchObject({name: 'その他', ampsTenths: 30, applianceCount: 2});
        expect(groups.reduce((sum, group) => sum + group.ampsTenths, 0))
            .toBe(calculateSummary(appliances, 200).totalTenths);
    });

    it('keeps totals within exact integer range for the maximum catalog size', () => {
        const appliances = Array.from({length: MAX_APPLIANCES}, (_, index) =>
            appliance(`id-${index}`, `家電${index}`, MAX_APPLIANCE_AMPS_TENTHS)
        );
        const total = calculateSummary(appliances, 200).totalTenths;

        expect(total).toBe(MAX_APPLIANCES * MAX_APPLIANCE_AMPS_TENTHS);
        expect(Number.isSafeInteger(total)).toBe(true);
        expect(getChartGroups(appliances).reduce((sum, group) => sum + group.ampsTenths, 0)).toBe(total);
    });
});
