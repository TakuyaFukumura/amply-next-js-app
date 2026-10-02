import {render, screen} from '@testing-library/react';
import AboutPage from '../../../../src/app/about/page';

describe('AboutPage', () => {
    it('explains amperes, household appliance estimates, and safety limitations', () => {
        render(<AboutPage/>);

        expect(screen.getByRole('heading', {name: 'アンペアとは？'})).toBeInTheDocument();
        expect(screen.getByText(/1000W ÷ 100Vで約10A/)).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '同時に使う家電の電流は合算される'})).toBeInTheDocument();
        expect(screen.getByText(/実際の電流を測定せず/)).toBeInTheDocument();
    });
});
