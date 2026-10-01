import {fireEvent, render, screen, within} from '@testing-library/react';
import Home from '../../../src/app/page';

const catalog = `name,runningAmps,startupAmps,initiallyEnabled,note
冷蔵庫,2.5,,false,450L級の目安
電子レンジ,15.0,,false,加熱時の目安`;

const createResponse = (body: string, status = 200): Response => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
} as Response);

describe('Home', () => {
    afterEach(() => jest.restoreAllMocks());

    it('loads the initial catalog, applies appliance toggles and the upper limit', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(catalog));
        render(<Home />, {reactStrictMode: false});

        expect(await screen.findByRole('heading', {name: '家電一覧'})).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '0.0A'})).toBeInTheDocument();
        fireEvent.click(screen.getByRole('switch', {name: '冷蔵庫を集計に含める'}));
        expect(screen.getByRole('heading', {name: '2.5A'})).toBeInTheDocument();

        fireEvent.change(screen.getByRole('textbox', {name: '上限アンペア数'}), {target: {value: '2.5'}});
        fireEvent.click(screen.getByRole('button', {name: '適用'}));
        expect(screen.getByText('＝ 上限到達')).toBeInTheDocument();
        expect(screen.getByText('残り 0.0A')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAccessibleName(/上限到達/);
    });

    it('does not show totals on catalog errors and allows retrying', async () => {
        const fetchMock = jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce(createResponse('bad', 500))
            .mockResolvedValueOnce(createResponse(catalog));
        render(<Home />, {reactStrictMode: false});

        expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
        expect(screen.queryByRole('heading', {name: '0.0A'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', {name: '再試行'}));
        expect(await screen.findByRole('heading', {name: '家電一覧'})).toBeInTheDocument();
        expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('adds a user appliance as enabled and distinguishes starting state', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(catalog));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});

        fireEvent.change(screen.getByLabelText(/家電名/), {target: {value: '扇風機'}});
        fireEvent.change(screen.getByLabelText(/運転中アンペア数/), {target: {value: '1.2'}});
        fireEvent.change(screen.getByLabelText(/起動時アンペア数/), {target: {value: '2.8'}});
        fireEvent.click(screen.getByRole('button', {name: '家電を追加'}));

        expect(screen.getByRole('switch', {name: '扇風機を集計に含める'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('heading', {name: '1.2A'})).toBeInTheDocument();
        fireEvent.click(screen.getByRole('switch', {name: '扇風機を起動中にする'}));
        expect(screen.getByRole('switch', {name: '扇風機を起動中にする'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('heading', {name: '2.8A'})).toBeInTheDocument();
    });

    it('keeps the committed limit when a non-tenth value is rejected', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(catalog));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});
        fireEvent.change(screen.getByRole('textbox', {name: '上限アンペア数'}), {target: {value: '2.05'}});
        fireEvent.click(screen.getByRole('button', {name: '適用'}));

        expect(screen.getByText('0.1A刻みの数値を入力してください。')).toBeInTheDocument();
        expect(screen.getByText('上限 20.0A')).toBeInTheDocument();
    });

    it('rejects adding an appliance when the catalog already contains fifty', async () => {
        const fiftyAppliances = [
            'name,runningAmps,startupAmps,initiallyEnabled,note',
            ...Array.from({length: 50}, (_, index) => `家電${index},1.0,,false,参考値`),
        ].join('\n');
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(fiftyAppliances));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});
        fireEvent.change(screen.getByLabelText(/家電名/), {target: {value: '追加分'}});
        fireEvent.change(screen.getByLabelText(/運転中アンペア数/), {target: {value: '1.0'}});
        fireEvent.click(screen.getByRole('button', {name: '家電を追加'}));

        expect(screen.getByRole('alert')).toHaveTextContent('登録上限の50台に達しています');
        expect(screen.getByText('50 / 50 台')).toBeInTheDocument();
    });

    it('keeps the enabled state of appliances with the same name independent', async () => {
        const duplicateCatalog = `name,runningAmps,startupAmps,initiallyEnabled,note
扇風機,1.0,,false,1台目
扇風機,1.0,,false,2台目`;
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(duplicateCatalog));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});

        const switches = screen.getAllByRole('switch', {name: '扇風機を集計に含める'});
        fireEvent.click(switches[0]);
        expect(screen.getByRole('heading', {name: '1.0A'})).toBeInTheDocument();
        expect(switches[1]).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(switches[1]);
        expect(screen.getByRole('heading', {name: '2.0A'})).toBeInTheDocument();
    });

    it('explains that an inactive appliance is not counted when starting has no startup value', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(catalog));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});
        fireEvent.click(screen.getByRole('switch', {name: '冷蔵庫を起動中にする'}));

        const row = screen.getByRole('heading', {name: '冷蔵庫'}).closest('li');
        expect(row).not.toBeNull();
        expect(within(row as HTMLElement).getByText(/無効のため集計されません/)).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '0.0A'})).toBeInTheDocument();
    });

    it('cancels the latest retry request when unmounted', async () => {
        let retrySignal: AbortSignal | null | undefined;
        const pendingRetry = new Promise<Response>(() => {});
        jest.spyOn(global, 'fetch')
            .mockRejectedValueOnce(new Error('network failure'))
            .mockImplementationOnce((_input, init) => {
                retrySignal = init?.signal;
                return pendingRetry;
            });
        const {unmount} = render(<Home />, {reactStrictMode: false});

        expect(await screen.findByRole('alert')).toHaveTextContent('network failure');
        fireEvent.click(screen.getByRole('button', {name: '再試行'}));
        expect(await screen.findByText('家電カタログを読み込み中...')).toBeInTheDocument();
        unmount();

        expect(retrySignal?.aborted).toBe(true);
    });

    it('preserves appliance state when editing and removes only the selected appliance', async () => {
        const editCatalog = `name,runningAmps,startupAmps,initiallyEnabled,note
冷蔵庫,2.5,4.0,false,目安
電子レンジ,15.0,,false,目安`;
        jest.spyOn(global, 'fetch').mockResolvedValue(createResponse(editCatalog));
        render(<Home />, {reactStrictMode: false});
        await screen.findByRole('heading', {name: '家電一覧'});
        fireEvent.click(screen.getByRole('switch', {name: '冷蔵庫を集計に含める'}));
        fireEvent.click(screen.getByRole('switch', {name: '冷蔵庫を起動中にする'}));
        fireEvent.click(screen.getAllByRole('button', {name: '編集'})[0]);
        fireEvent.change(screen.getByLabelText(/家電名/), {target: {value: '冷蔵庫（編集）'}});
        fireEvent.change(screen.getByLabelText(/運転中アンペア数/), {target: {value: '3.0'}});
        fireEvent.click(screen.getByRole('button', {name: '変更を保存'}));

        expect(screen.getByRole('switch', {name: '冷蔵庫（編集）を集計に含める'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('switch', {name: '冷蔵庫（編集）を起動中にする'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('heading', {name: '4.0A'})).toBeInTheDocument();

        const fridgeRow = screen.getByRole('heading', {name: '冷蔵庫（編集）'}).closest('li');
        expect(fridgeRow).not.toBeNull();
        fireEvent.click(within(fridgeRow as HTMLElement).getByRole('button', {name: '削除'}));
        expect(screen.queryByRole('heading', {name: '冷蔵庫（編集）'})).not.toBeInTheDocument();
        const microwaveRow = screen.getByRole('heading', {name: '電子レンジ'}).closest('li');
        expect(microwaveRow).not.toBeNull();
        fireEvent.click(within(microwaveRow as HTMLElement).getByRole('button', {name: '削除'}));
        expect(screen.queryByRole('heading', {name: '電子レンジ'})).not.toBeInTheDocument();
        expect(screen.getByText(/下の「家電を追加」フォーム/)).toBeInTheDocument();
    });
});
