import type {Metadata} from 'next';

export const metadata: Metadata = {
    title: 'アンペアとは | Amply',
    description: 'アンペアの意味や家電の電流の目安、起動時の電流、消費アンペア計算の見方を解説します。',
};

export default function AboutPage() {
    return (
        <main className="amp-page">
            <div className="amp-container">
                <header className="amp-page-header">
                    <p className="amp-eyebrow">電気の基礎</p>
                    <h1>アンペアとは？</h1>
                    <p className="amp-description">
                        家電が使う電流の大きさを表す単位です。家電を同時に使うときの電気の目安を知るのに役立ちます。
                    </p>
                </header>

                <section className="amp-card" aria-labelledby="ampere-basics">
                    <h2 id="ampere-basics">アンペア（A）は電流の大きさ</h2>
                    <p>
                        アンペアは、電気が流れる量（電流）を表します。家電の消費電力が大きいほど、同じ電圧ではより多くの電流が必要です。
                    </p>
                    <p>
                        家庭の100V家電では、電流は「消費電力（W）を電圧（V）で割った値」でおおよそ計算できます。
                        たとえば1000Wの家電なら、1000W ÷ 100Vで約10Aです。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="adding-appliances">
                    <h2 id="adding-appliances">同時に使う家電の電流は合算される</h2>
                    <p>
                        家電を複数同時に使うと、それぞれの電流が合計されます。たとえば10Aの家電と5Aの家電を同時に使うと、合計の目安は15Aです。
                        使っていない家電を計算から外すと、同時に使う場合の合計を確認しやすくなります。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="startup-current">
                    <h2 id="startup-current">起動時は電流が大きくなることがある</h2>
                    <p>
                        モーターやコンプレッサーを使う家電は、動き始める瞬間に、通常運転時より大きな電流が流れることがあります。
                        この画面では、起動時の目安が登録されている家電について、起動中の値を切り替えて合計できます。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="using-calculator">
                    <h2 id="using-calculator">計算画面の使い方と注意</h2>
                    <p>
                        「計算」では、使用中の家電を選び、必要に応じて起動中の状態や上限アンペア数を設定します。
                        家電の電流は機種や運転状況で変わるため、表示値は登録された参考値による概算です。
                    </p>
                    <p>
                        このアプリは実際の電流を測定せず、ブレーカーの遮断や安全を保証するものでもありません。
                        実際の契約容量・回路・製品表示を確認し、設備容量の判断が必要な場合は有資格者へ相談してください。
                    </p>
                </section>
            </div>
        </main>
    );
}
