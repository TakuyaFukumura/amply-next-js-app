import {render, screen} from '@testing-library/react';
import IdeasPage from '../../../../src/app/ideas/page';

describe('IdeasPage', () => {
    it('explains portable power station use and essential safety limits', () => {
        render(<IdeasPage/>);

        expect(screen.getByRole('heading', {name: 'ポータブル電源を活用するアイデア'})).toBeInTheDocument();
        expect(screen.getByText(/契約アンペア数や建物の配線容量を増やすものではありません/)).toBeInTheDocument();
        expect(screen.getByText(/出力Wと容量Whを確認する/)).toBeInTheDocument();
        expect(screen.getByText(/家庭の壁コンセントや分電盤につないで/)).toBeInTheDocument();
    });
});
