import {NextResponse} from 'next/server';
import {getMessage} from '../../../../lib/database';
import type {ApiResponse} from '../../../types/api';

/**
 * メッセージを取得するAPIエンドポイント
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
    try {
        const message = getMessage();
        return NextResponse.json({message});
    } catch (error) {
        console.error('メッセージの取得に失敗しました:', error);
        return NextResponse.json(
            {error: 'メッセージの取得に失敗しました'},
            {status: 500}
        );
    }
}
