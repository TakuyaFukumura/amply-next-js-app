import {render, screen, within} from '@testing-library/react';
import IdeasPage from '../../../../src/app/ideas/page';

describe('IdeasPage', () => {
    it('explains portable power station use and essential safety limits', () => {
        render(<IdeasPage/>);

        expect(screen.getByRole('heading', {name: 'ポータブル電源を活用するアイデア'})).toBeInTheDocument();
        expect(screen.getByText(/契約アンペア数や建物の配線容量を増やすものではありません/)).toBeInTheDocument();
        expect(screen.getByText(/出力Wと容量Whを確認する/)).toBeInTheDocument();
        expect(screen.getByText(/1,024Wh/)).toBeInTheDocument();
        expect(screen.getByText(/1,550W/)).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '夜間に充電し、日中に使う'})).toBeInTheDocument();
        expect(screen.getByText(/時間帯別料金プランでは費用を抑えられる可能性/)).toBeInTheDocument();
        expect(screen.getByText(/家庭の壁コンセントや分電盤につないで/)).toBeInTheDocument();
        const safetyHeading = screen.getByRole('heading', {name: '安全に使うために'});
        const assumptionsHeading = screen.getByRole('heading', {name: '試算に使うポータブル電源'});
        expect(safetyHeading.compareDocumentPosition(assumptionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('lists each catalog appliance with its estimated power and runtime', () => {
        render(<IdeasPage/>);

        expect(screen.getAllByRole('row')).toHaveLength(16);
        const dryerRow = screen.getByRole('row', {name: /ドライヤー/});
        const dryerCells = within(dryerRow).getAllByRole('cell');
        expect(dryerCells[0]).toHaveTextContent('1,200W');
        expect(dryerCells[1]).toHaveTextContent('1,500W');
        expect(dryerCells[2]).toHaveTextContent('約44分');

        const cordlessVacuumRow = screen.getByRole('row', {name: /コードレス掃除機/});
        expect(within(cordlessVacuumRow).getByText('約29.0時間')).toBeInTheDocument();
        expect(within(cordlessVacuumRow).getByText(/充電器入力約30W/)).toBeInTheDocument();
    });
});
