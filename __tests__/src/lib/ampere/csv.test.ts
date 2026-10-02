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

    it('loads the committed reference catalog with fourteen appliances and expected values', () => {
        const csv = readFileSync(join(process.cwd(), 'public', 'data', 'appliances.csv'), 'utf8');
        const rows = parseCatalog(csv);

        expect(rows.map((row) => row.name)).toEqual([
            '冷蔵庫', 'エアコン', 'LED照明', '電子レンジ', '洗濯機', '炊飯器', '掃除機', '電気ケトル',
            'ドライヤー', 'アイロン', 'ヘアアイロン', 'ノートPC', 'デスクトップPC', 'ルーター',
        ]);
        expect(rows.map((row) => row.runningAmpsTenths)).toEqual([25, 60, 9, 140, 50, 70, 3, 130, 120, 100, 15, 7, 15, 2]);
        expect(rows.map((row) => row.startupAmpsTenths)).toEqual([75, 120, 18, 140, 150, 70, 3, 130, 150, 100, 15, 15, 30, 5]);
        expect(rows.find((row) => row.name === '冷蔵庫')?.enabled).toBe(true);
        expect(rows.find((row) => row.name === 'エアコン')?.enabled).toBe(true);
        expect(rows.find((row) => row.name === 'LED照明')?.enabled).toBe(true);
        expect(rows.find((row) => row.name === 'ノートPC')?.enabled).toBe(true);
        expect(rows.find((row) => row.name === 'デスクトップPC')?.enabled).toBe(true);
        expect(rows.find((row) => row.name === 'ルーター')?.enabled).toBe(true);
        expect(rows.filter((row) => !['冷蔵庫', 'エアコン', 'LED照明', 'ノートPC', 'デスクトップPC', 'ルーター'].includes(row.name))
            .every((row) => !row.enabled)).toBe(true);
        expect(rows.find((row) => row.name === '冷蔵庫')?.note).toContain('200L級を想定した目安');
        expect(rows.find((row) => row.name === 'エアコン')?.note).toContain('100V・6畳用');
        expect(rows.find((row) => row.name === 'LED照明')?.note).toContain('2DKの2部屋とDKに各30W程度');
        expect(rows.find((row) => row.name === '電子レンジ')?.note).toContain('低価格帯の家庭用オーブンレンジ');
        expect(rows.find((row) => row.name === '掃除機')?.note).toContain('充電式スティック型の充電器入力約30W');
        expect(rows.find((row) => row.name === 'アイロン')?.note).toContain('低価格帯の家庭用アイロン（1000W級）');
        expect(rows.find((row) => row.name === '炊飯器')?.note).toContain('3合炊きIH炊飯器');
        expect(rows.find((row) => row.name === 'ノートPC')?.note).toContain('0.1A刻みに切り上げた目安');
        expect(rows.find((row) => row.name === 'ルーター')?.note).toContain('0.1A刻みに切り上げた目安');
    });
});
