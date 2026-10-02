import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {CatalogError, parseCatalog} from '../../../../src/lib/ampere/csv';

describe('parseCatalog', () => {
    it('parses BOM, CRLF and escaped quoted fields', () => {
        const rows = parseCatalog('\uFEFFname,runningAmps,startupAmps,initiallyEnabled,note\r\n"電子,レンジ",15.0,,false,"目安 ""大""\r\n注記"\r\n');
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            name: '電子,レンジ',
            runningAmpsTenths: 150,
            startupAmpsTenths: null,
            enabled: false,
            note: '目安 "大"\r\n注記',
        });
    });

    it('rejects the entire catalog when a row is invalid', () => {
        expect(() => parseCatalog('name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,2.5,,false,ok\n電子レンジ,2.05,,false,bad'))
            .toThrow('CSV 3行目');
    });

    it.each([
        'name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,2.5,,maybe,注記',
        'name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,2.5,,false',
        'name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,2.5,,false,"未完',
        'name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,2.5,,false,"注記"不正',
    ])('rejects malformed catalog data', (csv) => {
        expect(() => parseCatalog(csv)).toThrow(CatalogError);
    });

    it.each([
        'name,runningAmps,startupAmps,initiallyEnabled,note\n,,,,',
        'name,runningAmps,startupAmps,initiallyEnabled,note\n"",,,,',
    ])('rejects a syntactically present record with empty fields', (csv) => {
        expect(() => parseCatalog(csv)).toThrow('CSV 2行目');
    });

    it('ignores physically empty lines but still parses catalog rows', () => {
        const csv = 'name,runningAmps,startupAmps,initiallyEnabled,note\n\n冷蔵庫,2.5,,false,目安\n\n';
        expect(parseCatalog(csv)).toHaveLength(1);
    });

    it('reports the actual line number for an invalid header after blank lines', () => {
        expect(() => parseCatalog('\nwrong,header\n冷蔵庫,2.5,,false,目安')).toThrow('CSV 2行目');
    });

    it.each([
        ['running', '180143985094819.2,,false'],
        ['startup', '1.0,180143985094819.2,false'],
    ])('rejects an appliance %s value that exceeds the safe aggregate range', (_field, values) => {
        expect(() => parseCatalog(`name,runningAmps,startupAmps,initiallyEnabled,note\n冷蔵庫,${values},目安`))
            .toThrow('CSV 2行目');
    });

    it('accepts a trailing newline and validates the initial catalog as twelve disabled appliances', () => {
        const csv = [
            'name,runningAmps,startupAmps,initiallyEnabled,note',
            ...Array.from({length: 12}, (_, index) => `家電${index},1.0,,false,目安`),
            '',
        ].join('\n');
        const rows = parseCatalog(csv);
        expect(rows).toHaveLength(12);
        expect(rows.every((row) => !row.enabled)).toBe(true);
    });

    it('loads the committed reference catalog with twelve appliances and expected values', () => {
        const csv = readFileSync(join(process.cwd(), 'public', 'data', 'appliances.csv'), 'utf8');
        const rows = parseCatalog(csv);

        expect(rows.map((row) => row.name)).toEqual([
            '冷蔵庫', '電子レンジ', '洗濯機', '炊飯器', '掃除機', '電気ケトル',
            'ドライヤー', 'アイロン', 'ヘアアイロン', 'ノートPC', 'デスクトップPC', 'ルーター',
        ]);
        expect(rows.map((row) => row.runningAmpsTenths)).toEqual([25, 150, 50, 130, 100, 130, 120, 140, 15, 7, 15, 2]);
        expect(rows.find((row) => row.name === '冷蔵庫')?.enabled).toBe(true);
        expect(rows.filter((row) => row.name !== '冷蔵庫').every((row) => !row.enabled)).toBe(true);
        expect(rows.every((row) => row.startupAmpsTenths === null)).toBe(true);
        expect(rows.find((row) => row.name === '冷蔵庫')?.note).toContain('200L級を想定した目安');
        expect(rows.find((row) => row.name === 'ノートPC')?.note).toContain('0.1A刻みに切り上げた目安');
        expect(rows.find((row) => row.name === 'ルーター')?.note).toContain('0.1A刻みに切り上げた目安');
    });
});
