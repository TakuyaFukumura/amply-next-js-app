'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {calculateSummary, getApplianceAmpsTenths, getChartGroups} from '../../../lib/ampere/calculations';
import {CatalogError, parseCatalog} from '../../../lib/ampere/csv';
import {
    formatAmps,
    isValidApplianceAmpsTenths,
    MAX_APPLIANCE_AMPS_TENTHS,
    MAX_APPLIANCES,
    parseAmpsTenths,
} from '../../../lib/ampere/validation';
import type {AmpereSummary, Appliance, ApplianceInput} from '../../../lib/ampere/types';

type DashboardState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; appliances: Appliance[] };

const COLORS = ['#147d71', '#3975c6', '#bc6b28', '#8256a6', '#c04c64', '#558c39', '#277f9f', '#9c7126', '#5465a8', '#a64f82', '#617c7c'];
const LIMIT_OPTIONS_TENTHS = [100, 200, 300, 400, 500, 600];

async function requestCatalog(signal: AbortSignal): Promise<Appliance[]> {
    const response = await fetch('/data/appliances.csv', {signal});
    if (!response.ok) {
        throw new CatalogError(`家電カタログの取得に失敗しました（HTTP ${response.status}）。`);
    }
    return parseCatalog(await response.text());
}

function makeId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatChartAxisAmps(tenths: number): string {
    const amps = tenths / 10;
    if (amps >= 1_000_000_000_000) return `${(amps / 1_000_000_000_000).toFixed(1)}兆A`;
    if (amps >= 100_000_000) return `${(amps / 100_000_000).toFixed(1)}億A`;
    if (amps >= 10_000) return `${(amps / 10_000).toFixed(1)}万A`;
    return formatAmps(tenths);
}

function formatLimitPercentage(ampsTenths: number, limitTenths: number): string {
    return ((ampsTenths / limitTenths) * 100).toFixed(1);
}

function AmpereChart({appliances, limitTenths, totalTenths, status}: {
    appliances: Appliance[];
    limitTenths: number;
    totalTenths: number;
    status: AmpereSummary['status'];
}) {
    const groups = getChartGroups(appliances);
    const scaleTenths = Math.max(10, Math.ceil((Math.max(totalTenths, limitTenths) / 10) * 1.1) * 10);
    const limitPosition = Math.min(100, (limitTenths / scaleTenths) * 100);
    const tickTenths = [0, Math.ceil(scaleTenths / 3), Math.ceil((scaleTenths * 2) / 3), scaleTenths]
        .map((value) => Math.ceil(value / 10) * 10);
    const uniqueTicks = [...new Set(tickTenths)];

    const statusDescription = status === 'within'
        ? '上限内'
        : status === 'reached' ? '上限到達' : '上限超過';

    return (
        <section className="amp-card amp-chart-card" aria-label="使用状況">
            <div className="amp-section-heading">
                <div>
                    <p className="amp-eyebrow">使用状況</p>
                </div>
            </div>
            <div
                className="amp-chart"
                role="img"
                aria-label={`家電ごとの積み上げグラフ。${statusDescription}。合計${formatAmps(totalTenths)}、上限${formatAmps(limitTenths)}。上限マーカーを破線で表示しています。`}
            >
                <div className="amp-bar-track">
                    {groups.map((group, index) => (
                        <div
                            key={group.id}
                            className="amp-bar-segment"
                            style={{
                                width: `${(group.ampsTenths / scaleTenths) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                            }}
                            title={`${group.name}: ${formatAmps(group.ampsTenths)}`}
                        />
                    ))}
                    <span className="amp-limit-marker" style={{left: `${limitPosition}%`}} aria-hidden="true"/>
                </div>
                <div className="amp-axis" aria-hidden="true">
                    {uniqueTicks.map((tick) => (
                        <span key={tick} style={{left: `${(tick / scaleTenths) * 100}%`}}>
                            {formatChartAxisAmps(tick)}
                        </span>
                    ))}
                </div>
                <p className="amp-marker-key"><span aria-hidden="true"/>破線: 上限 {formatAmps(limitTenths)}</p>
            </div>
            {groups.length > 0 ? (
                <ul className="amp-legend" aria-label="グラフの凡例">
                    {groups.map((group, index) => (
                        <li key={group.id}>
                            <span className="amp-legend-swatch" style={{backgroundColor: COLORS[index % COLORS.length]}}
                                  aria-hidden="true"/>
                            <span>{group.name}{group.applianceCount > 1 ? ` (${group.applianceCount}台)` : ''}</span>
                            <strong>
                                {formatAmps(group.ampsTenths)}
                                <span className="amp-legend-share">
                                    ({formatLimitPercentage(group.ampsTenths, limitTenths)}%)
                                </span>
                            </strong>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="amp-muted">有効な家電はありません。家電一覧から使う家電を有効にしてください。</p>
            )}
        </section>
    );
}

function ApplianceEditor({appliances, editing, onCancel, onDelete, onSave}: {
    appliances: Appliance[];
    editing: Appliance | null;
    onCancel: () => void;
    onDelete: (id: string) => void;
    onSave: (input: ApplianceInput) => void;
}) {
    const [name, setName] = useState(editing?.name ?? '');
    const [running, setRunning] = useState(editing ? (editing.runningAmpsTenths / 10).toFixed(1) : '');
    const [startup, setStartup] = useState(editing?.startupAmpsTenths === null || !editing ? '' : (editing.startupAmpsTenths / 10).toFixed(1));
    const [note, setNote] = useState(editing?.note ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        const runningTenths = parseAmpsTenths(running);
        const startupTenths = startup.trim() === '' ? null : parseAmpsTenths(startup);

        if (!name.trim()) nextErrors.name = '家電名を入力してください。';
        if (runningTenths === null) nextErrors.running = '0以上の0.1A刻みで入力してください（例: 2.5）。';
        else if (!isValidApplianceAmpsTenths(runningTenths)) {
            nextErrors.running = `1台あたり${formatAmps(MAX_APPLIANCE_AMPS_TENTHS)}以下で入力してください。`;
        }
        if (startup.trim() !== '' && startupTenths === null) {
            nextErrors.startup = '空欄または0以上の0.1A刻みで入力してください。';
        } else if (startupTenths !== null && !isValidApplianceAmpsTenths(startupTenths)) {
            nextErrors.startup = `1台あたり${formatAmps(MAX_APPLIANCE_AMPS_TENTHS)}以下で入力してください。`;
        }
        if (!editing && appliances.length >= MAX_APPLIANCES) {
            nextErrors.limit = `登録上限の${MAX_APPLIANCES}台に達しています。`;
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0 || runningTenths === null) return;

        onSave({
            name: name.trim(),
            runningAmpsTenths: runningTenths,
            startupAmpsTenths: startupTenths,
            note: note.trim(),
        });
        setName('');
        setRunning('');
        setStartup('');
        setNote('');
        setErrors({});
    };

    return (
        <section className="amp-card" aria-labelledby="editor-heading">
            <div className="amp-section-heading">
                <div>
                    <p className="amp-eyebrow">家電管理</p>
                    <h2 id="editor-heading">{editing ? '編集' : '追加'}</h2>
                </div>
                <span className="amp-count">{appliances.length} / {MAX_APPLIANCES} 台</span>
            </div>
            <p className="amp-muted">初期カタログは参考値です。登録対象は100V家電です。</p>
            <form className="amp-form" onSubmit={submit} noValidate>
                <label className="amp-field">
                    <span>家電名 <span className="amp-required">必須</span></span>
                    <input
                        autoFocus={Boolean(editing)}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'appliance-name-error' : undefined}
                    />
                    {errors.name && <span className="amp-error" id="appliance-name-error">{errors.name}</span>}
                </label>
                <label className="amp-field">
                    <span>運転中アンペア数 <span className="amp-required">必須</span></span>
                    <div className="amp-input-with-unit">
                        <input
                            inputMode="decimal"
                            value={running}
                            onChange={(event) => setRunning(event.target.value)}
                            aria-invalid={Boolean(errors.running)}
                            aria-describedby={errors.running ? 'running-amps-error' : undefined}
                        />
                        <span>A</span>
                    </div>
                    {errors.running && <span className="amp-error" id="running-amps-error">{errors.running}</span>}
                </label>
                <label className="amp-field">
                    <span>起動時アンペア数 <span className="amp-optional">任意</span></span>
                    <div className="amp-input-with-unit">
                        <input
                            inputMode="decimal"
                            value={startup}
                            onChange={(event) => setStartup(event.target.value)}
                            aria-invalid={Boolean(errors.startup)}
                            aria-describedby={errors.startup ? 'startup-amps-error' : 'startup-help'}
                        />
                        <span>A</span>
                    </div>
                    <span className="amp-help" id="startup-help">不明な場合は空欄にできます。</span>
                    {errors.startup && <span className="amp-error" id="startup-amps-error">{errors.startup}</span>}
                </label>
                <label className="amp-field amp-field-wide">
                    <span>メモ <span className="amp-optional">任意</span></span>
                    <input value={note} onChange={(event) => setNote(event.target.value)}/>
                </label>
                {errors.limit && <p className="amp-error amp-field-wide" role="alert">{errors.limit}</p>}
                <div className="amp-form-actions amp-field-wide">
                    <button className="amp-button amp-button-primary"
                            type="submit">{editing ? '変更を保存' : '追加'}</button>
                    {editing && <button className="amp-button amp-button-secondary" type="button"
                                        onClick={onCancel}>編集をキャンセル</button>}
                    {editing && <button className="amp-button amp-button-danger amp-form-delete" type="button"
                                        onClick={() => onDelete(editing.id)}>削除</button>}
                </div>
            </form>
        </section>
    );
}

function ApplianceList({appliances, onToggle, onEdit}: {
    appliances: Appliance[];
    onToggle: (id: string, field: 'enabled' | 'starting') => void;
    onEdit: (appliance: Appliance) => void;
}) {
    const [applianceFilter, setApplianceFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [hideNotes, setHideNotes] = useState(false);
    const visibleAppliances = applianceFilter === 'all'
        ? appliances
        : appliances.filter((appliance) => appliance.enabled === (applianceFilter === 'enabled'));

    return (
        <section className="amp-card" aria-labelledby="appliances-heading">
            <div className="amp-section-heading">
                <div>
                    <h2 id="appliances-heading">登録家電一覧</h2>
                </div>
                <span className="amp-count">{appliances.length} 台</span>
            </div>
            {appliances.length > 0 && (
                <div className="amp-appliance-filters">
                    <label className="amp-appliance-filter">
                        <input
                            type="checkbox"
                            checked={applianceFilter === 'enabled'}
                            onChange={(event) => setApplianceFilter(event.target.checked ? 'enabled' : 'all')}
                        />
                        使用中のみ表示
                    </label>
                    <label className="amp-appliance-filter">
                        <input
                            type="checkbox"
                            checked={applianceFilter === 'disabled'}
                            onChange={(event) => setApplianceFilter(event.target.checked ? 'disabled' : 'all')}
                        />
                        未使用のみ表示
                    </label>
                    <label className="amp-appliance-filter">
                        <input
                            type="checkbox"
                            checked={hideNotes}
                            onChange={(event) => setHideNotes(event.target.checked)}
                        />
                        メモを非表示
                    </label>
                </div>
            )}
            {appliances.length === 0 ? (
                <p className="amp-empty">家電がありません。下の「追加」フォームから登録できます。</p>
            ) : visibleAppliances.length === 0 ? (
                <p className="amp-empty" role="status">
                    {applianceFilter === 'enabled' ? '使用中の家電はありません。' : '未使用の家電はありません。'}
                </p>
            ) : (
                <ul className="amp-appliance-list">
                    {visibleAppliances.map((appliance) => {
                        const amount = getApplianceAmpsTenths(appliance);
                        return (
                            <li key={appliance.id} className="amp-appliance-row">
                                <div className="amp-appliance-main">
                                    <div>
                                        <h3>
                                            <button
                                                className="amp-appliance-name-button"
                                                type="button"
                                                onClick={() => onEdit(appliance)}
                                            >
                                                {appliance.name}
                                            </button>
                                        </h3>
                                        <p>
                                            運転中 {formatAmps(appliance.runningAmpsTenths)}・起動時{' '}
                                            {appliance.startupAmpsTenths === null
                                                ? '未登録（運転中値を使用）'
                                                : formatAmps(appliance.startupAmpsTenths)}
                                        </p>
                                        {appliance.starting && appliance.startupAmpsTenths === null && (
                                            <p>
                                                {appliance.enabled
                                                    ? `起動中（起動時値未登録のため運転中値 ${formatAmps(appliance.runningAmpsTenths)} を使用）`
                                                    : `起動中ですが無効のため集計されません。有効にすると運転中値 ${formatAmps(appliance.runningAmpsTenths)} を使用します。`}
                                            </p>
                                        )}
                                        {appliance.note && !hideNotes && (
                                            <p className="amp-appliance-note">{appliance.note}</p>
                                        )}
                                    </div>
                                    <strong className="amp-appliance-value">{formatAmps(amount)}</strong>
                                </div>
                                <div className="amp-appliance-actions">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={appliance.enabled}
                                        aria-label={`${appliance.name}を集計に含める`}
                                        className={`amp-switch ${appliance.enabled ? 'is-on' : ''}`}
                                        onClick={() => onToggle(appliance.id, 'enabled')}
                                    >
                                        <span aria-hidden="true"/>使用中
                                    </button>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={appliance.starting}
                                        aria-label={`${appliance.name}を起動中にする`}
                                        className={`amp-switch ${appliance.starting ? 'is-on' : ''}`}
                                        onClick={() => onToggle(appliance.id, 'starting')}
                                    >
                                        <span aria-hidden="true"/>起動中
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default function AmpereDashboard() {
    const [dashboard, setDashboard] = useState<DashboardState>({status: 'loading'});
    const [limitTenths, setLimitTenths] = useState(200);
    const [editingId, setEditingId] = useState<string | null>(null);
    const requestController = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        requestController.current = controller;
        void requestCatalog(controller.signal)
            .then((appliances) => {
                if (!controller.signal.aborted) setDashboard({status: 'ready', appliances});
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setDashboard({
                    status: 'error',
                    message: error instanceof Error ? error.message : '予期しないエラーが発生しました。',
                });
            });
        return () => requestController.current?.abort();
    }, []);

    const retryCatalog = () => {
        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;
        setDashboard({status: 'loading'});
        setLimitTenths(200);
        setEditingId(null);
        void requestCatalog(controller.signal)
            .then((appliances) => {
                if (!controller.signal.aborted) setDashboard({status: 'ready', appliances});
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setDashboard({
                    status: 'error',
                    message: error instanceof Error ? error.message : '予期しないエラーが発生しました。',
                });
            });
    };

    const summary = useMemo(
        () => dashboard.status === 'ready' ? calculateSummary(dashboard.appliances, limitTenths) : null,
        [dashboard, limitTenths]
    );

    const updateAppliance = (id: string, update: (appliance: Appliance) => Appliance) => {
        setDashboard((current) => current.status === 'ready'
            ? {
                ...current,
                appliances: current.appliances.map((appliance) => appliance.id === id ? update(appliance) : appliance)
            }
            : current);
    };

    const deleteAppliance = (id: string) => {
        setDashboard((current) => current.status === 'ready'
            ? {
                ...current,
                appliances: current.appliances.filter((appliance) => appliance.id !== id)
            }
            : current);
        setEditingId((current) => current === id ? null : current);
    };

    const editing = dashboard.status === 'ready'
        ? dashboard.appliances.find((appliance) => appliance.id === editingId) ?? null
        : null;

    const saveAppliance = (input: ApplianceInput) => {
        if (dashboard.status !== 'ready') return;
        if (editing) {
            updateAppliance(editing.id, (appliance) => ({...appliance, ...input}));
            setEditingId(null);
            return;
        }
        if (dashboard.appliances.length >= MAX_APPLIANCES) return;
        setDashboard({
            ...dashboard,
            appliances: [...dashboard.appliances, {
                id: makeId(),
                ...input,
                enabled: true,
                starting: false,
                origin: 'user',
            }],
        });
    };

    return (
        <main className="amp-page">
            <div className="amp-container">
                <header className="amp-page-header">
                    <h1>消費アンペア計算</h1>
                </header>

                {dashboard.status === 'loading' && (
                    <section className="amp-card amp-state-card" aria-live="polite">
                        <span className="amp-spinner" aria-hidden="true"/>
                        <p>家電カタログを読み込み中...</p>
                    </section>
                )}

                {dashboard.status === 'error' && (
                    <section className="amp-card amp-error-card" role="alert">
                        <h2>家電カタログを読み込めませんでした</h2>
                        <p>{dashboard.message}</p>
                        <p>通信状況とCSVの形式・値を確認してから、もう一度お試しください。</p>
                        <button
                            className="amp-button amp-button-primary"
                            type="button"
                            onClick={retryCatalog}
                        >
                            再試行
                        </button>
                    </section>
                )}

                {dashboard.status === 'ready' && summary && (
                    <>
                        <section className="amp-card amp-limit-card" aria-labelledby="limit-heading">
                            <div className="amp-limit-copy">
                                <h2 id="limit-heading">上限アンペア数</h2>
                            </div>
                            <div className="amp-limit-controls">
                                <label className="amp-sr-only" htmlFor="limit-amps">上限アンペア数</label>
                                <select
                                    className="amp-limit-select"
                                    id="limit-amps"
                                    value={limitTenths}
                                    onChange={(event) => setLimitTenths(Number(event.target.value))}
                                >
                                    {LIMIT_OPTIONS_TENTHS.map((tenths) => (
                                        <option key={tenths} value={tenths}>{tenths / 10}A</option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        <section className={`amp-summary amp-summary-${summary.status}`} aria-live="polite"
                                 aria-labelledby="summary-heading">
                            <div>
                                <p className="amp-eyebrow">現在の合計</p>
                                <div className="amp-summary-total">
                                    <h2 id="summary-heading">{formatAmps(summary.totalTenths)}</h2>
                                    <span className="amp-summary-percentage">
                                        （{formatLimitPercentage(summary.totalTenths, limitTenths)}%）
                                    </span>
                                </div>
                            </div>
                            <div className="amp-status">
                                <strong>
                                    {summary.status === 'within' ? '✓ 上限内' : summary.status === 'reached' ? '＝ 上限到達' : '！ 上限超過'}
                                </strong>
                                {summary.status !== 'exceeded' &&
                                    <span>残り {formatAmps(summary.remainingTenths)}</span>}
                                {summary.status === 'exceeded' &&
                                    <span>超過 {formatAmps(-summary.remainingTenths)}</span>}
                            </div>
                        </section>

                        {summary.status === 'exceeded' && (
                            <aside className="amp-over-limit" role="status">
                                <strong>上限を超えています</strong>
                                <span>{formatAmps(-summary.remainingTenths)}超過しています。家電の使用状態を確認してください。</span>
                            </aside>
                        )}

                        <p className="amp-muted amp-safety-note">※100V家電用の目安数値です（遮断保証なし）</p>

                        <AmpereChart
                            appliances={dashboard.appliances}
                            limitTenths={limitTenths}
                            totalTenths={summary.totalTenths}
                            status={summary.status}
                        />
                        <ApplianceList
                            appliances={dashboard.appliances}
                            onToggle={(id, field) => updateAppliance(id, (appliance) => ({
                                ...appliance,
                                [field]: !appliance[field]
                            }))}
                            onEdit={(appliance) => setEditingId(appliance.id)}
                        />
                        <ApplianceEditor
                            key={editingId ?? 'new'}
                            appliances={dashboard.appliances}
                            editing={editing}
                            onCancel={() => setEditingId(null)}
                            onDelete={deleteAppliance}
                            onSave={saveAppliance}
                        />
                    </>
                )}
                <footer className="amp-footer">
                    <p>家電の参考値や入力値には機種差があります。実際の設備容量や回路ごとの負荷を確認し、必要に応じて有資格者へ相談してください。</p>
                </footer>
            </div>
        </main>
    );
}
