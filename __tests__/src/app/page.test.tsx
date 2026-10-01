import {fireEvent, render, screen} from '@testing-library/react';
import Home from '../../../src/app/page';

const createResponse = (body: unknown, status: number): Response => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
} as Response);

describe('Home', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('型付きのメッセージを表示する', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(
            createResponse({message: 'テストメッセージ'}, 200)
        );

        render(<Home/>, {reactStrictMode: false});

        expect(await screen.findByText('テストメッセージ')).toBeInTheDocument();
    });

    it('APIエラーを表示し、再試行できる', async () => {
        const fetchMock = jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce(
                createResponse({error: '取得に失敗しました'}, 500)
            )
            .mockResolvedValueOnce(
                createResponse({message: '再取得しました'}, 200)
            );

        render(<Home/>, {reactStrictMode: false});

        expect(await screen.findByText('エラー: 取得に失敗しました')).toBeInTheDocument();
        const initialCallCount = fetchMock.mock.calls.length;
        fireEvent.click(screen.getByRole('button', {name: '再試行'}));

        expect(await screen.findByText('再取得しました')).toBeInTheDocument();
        expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('不正な成功レスポンスをエラーとして扱う', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(
            createResponse({message: 123}, 200)
        );

        render(<Home/>, {reactStrictMode: false});

        expect(await screen.findByText('エラー: APIレスポンスの形式が不正です')).toBeInTheDocument();
    });

    it('アンマウント時に進行中のリクエストを中断する', async () => {
        let requestSignal: AbortSignal | null | undefined;
        const pendingRequest = new Promise<Response>(() => {
            // リクエストが中断されるまで保留する。
        });
        jest.spyOn(global, 'fetch').mockImplementation((_input, init) => {
            requestSignal = init?.signal;
            return pendingRequest;
        });

        const {unmount} = render(<Home/>, {reactStrictMode: false});
        await screen.findByText('読み込み中...');
        unmount();

        expect(requestSignal?.aborted).toBe(true);
    });
});
