/** @jest-environment node */

import {getMessage} from '../../../../../lib/database';
import {GET} from '../../../../../src/app/api/message/route';

jest.mock('../../../../../lib/database', () => ({
    getMessage: jest.fn(),
}));

const mockedGetMessage = jest.mocked(getMessage);

describe('GET /api/message', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('最新のメッセージを返す', async () => {
        mockedGetMessage.mockReturnValue('テストメッセージ');

        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({message: 'テストメッセージ'});
    });

    it('データベースエラー時に500を返す', async () => {
        mockedGetMessage.mockImplementation(() => {
            throw new Error('database failure');
        });

        const response = await GET();

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({error: 'メッセージの取得に失敗しました'});
    });
});
