import type {Appliance} from './types';
import {
    formatAmps,
    isValidApplianceAmpsTenths,
    MAX_APPLIANCE_AMPS_TENTHS,
    MAX_APPLIANCES,
    parseAmpsTenths,
} from './validation';

const HEADER = ['name', 'runningAmps', 'startupAmps', 'initiallyEnabled', 'note'];

type CsvRecord = {
    fields: string[];
    line: number;
};

export class CatalogError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CatalogError';
    }
}

function parseRecords(source: string): CsvRecord[] {
    const text = source.replace(/^\uFEFF/, '');
    const records: CsvRecord[] = [];
    let fields: string[] = [];
    let field = '';
    let quoted = false;
    let afterQuote = false;
    let recordLine = 1;
    let line = 1;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (quoted) {
            if (char === '"' && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (char === '"') {
                quoted = false;
                afterQuote = true;
            } else {
                field += char;
                if (char === '\n') line += 1;
                if (char === '\r' && text[index + 1] !== '\n') line += 1;
            }
            continue;
        }

        if (afterQuote && char !== ',' && char !== '\n' && char !== '\r') {
            throw new CatalogError(`CSV ${line}行目: 閉じ引用符の後に不正な文字があります。`);
        }
        if (char === '"') {
            if (field.length !== 0) {
                throw new CatalogError(`CSV ${line}行目: 引用符の位置が不正です。`);
            }
            quoted = true;
        } else if (char === ',') {
            fields.push(field);
            field = '';
            afterQuote = false;
        } else if (char === '\n' || char === '\r') {
            const isEmptyPhysicalLine = fields.length === 0 && field === '' && !afterQuote;
            if (!isEmptyPhysicalLine) {
                records.push({fields: [...fields, field], line: recordLine});
            }
            fields = [];
            field = '';
            afterQuote = false;
            if (char === '\r' && text[index + 1] === '\n') index += 1;
            line += 1;
            recordLine = line;
        } else {
            field += char;
        }
    }

    if (quoted) {
        throw new CatalogError(`CSV ${recordLine}行目: 引用符が閉じられていません。`);
    }
    if (fields.length > 0 || field.length > 0 || afterQuote) {
        records.push({fields: [...fields, field], line: recordLine});
    }
    return records;
}

export function parseCatalog(source: string): Appliance[] {
    if (!source.trim()) {
        throw new CatalogError('CSVファイルが空です。');
    }

    const [header, ...rows] = parseRecords(source);
    if (!header || header.fields.length !== HEADER.length || header.fields.some((value, index) => value !== HEADER[index])) {
        throw new CatalogError(`CSV ${header?.line ?? 1}行目: ヘッダーは ${HEADER.join(',')} の順で指定してください。`);
    }
    if (rows.length > MAX_APPLIANCES) {
        throw new CatalogError(`CSVの家電数が登録上限の${MAX_APPLIANCES}台を超えています。`);
    }

    return rows.map(({fields, line}, index) => {
        if (fields.length !== HEADER.length) {
            throw new CatalogError(`CSV ${line}行目: 列数は${HEADER.length}列にしてください。`);
        }
        const [name, running, startup, initiallyEnabled, note] = fields;
        if (!name.trim()) {
            throw new CatalogError(`CSV ${line}行目: 家電名を入力してください。`);
        }
        const runningAmpsTenths = parseAmpsTenths(running);
        if (!isValidApplianceAmpsTenths(runningAmpsTenths)) {
            throw new CatalogError(`CSV ${line}行目: 運転中アンペア数は0以上の0.1A刻みで、1台あたり${formatAmps(MAX_APPLIANCE_AMPS_TENTHS)}以下にしてください（${MAX_APPLIANCES}台分の合計精度を保つため）。`);
        }
        const startupAmpsTenths = startup === '' ? null : parseAmpsTenths(startup);
        if (startup !== '' && !isValidApplianceAmpsTenths(startupAmpsTenths)) {
            throw new CatalogError(`CSV ${line}行目: 起動時アンペア数は空欄または0以上の0.1A刻みで、1台あたり${formatAmps(MAX_APPLIANCE_AMPS_TENTHS)}以下にしてください（${MAX_APPLIANCES}台分の合計精度を保つため）。`);
        }
        if (initiallyEnabled !== 'true' && initiallyEnabled !== 'false') {
            throw new CatalogError(`CSV ${line}行目: 初期有効状態はtrueまたはfalseにしてください。`);
        }
        return {
            id: `catalog-${index + 1}`,
            name: name.trim(),
            runningAmpsTenths,
            startupAmpsTenths,
            enabled: initiallyEnabled === 'true',
            starting: false,
            note,
            origin: 'catalog',
        };
    });
}
