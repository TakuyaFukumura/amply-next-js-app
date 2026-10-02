import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Metadata} from 'next';
import {parseCatalog} from '../../lib/ampere/csv';

export const metadata: Metadata = {
    title: 'ポータブル電源の活用アイデア | Amply',
    description: '容量1,024Wh、AC定格出力1,550W級のポータブル電源を想定し、家電別の連続使用時間を試算します。',
};

const POWER_STATION_CAPACITY_WH = 1024;
const AC_OUTPUT_LIMIT_W = 1550;
const AC_SINGLE_PORT_LIMIT_W = 1500;
const AC_USABLE_CAPACITY_RATIO = 0.85;
const HOUSEHOLD_VOLTAGE = 100;
const appliances = parseCatalog(readFileSync(
    join(process.cwd(), 'public', 'data', 'appliances.csv'),
    'utf8'
));

function getPowerWatts(ampsTenths: number): number {
    return ampsTenths * HOUSEHOLD_VOLTAGE / 10;
}

function formatRuntime(ampsTenths: number): string {
    const watts = getPowerWatts(ampsTenths);
    if (watts <= 0) return '算出できません';

    const runtimeHours = (POWER_STATION_CAPACITY_WH * AC_USABLE_CAPACITY_RATIO) / watts;
    return runtimeHours < 1
        ? `約${Math.round(runtimeHours * 60)}分`
        : `約${runtimeHours.toFixed(1)}時間`;
}

export default function IdeasPage() {
    return (
        <main className="amp-page">
            <div className="amp-container">
                <header className="amp-page-header">
                    <p className="amp-eyebrow">使い方のアイデア</p>
                    <h1>ポータブル電源を活用するアイデア</h1>
                    <p className="amp-description">
                        契約アンペア数の変更が難しいとき、家電の一部をポータブル電源で動かせば、
                        家庭のコンセントから同時に取る電流を抑えられる場合があります。
                    </p>
                </header>

                <section className="amp-card" aria-labelledby="separate-loads">
                    <h2 id="separate-loads">一部の家電を別の電源に分ける</h2>
                    <p>
                        たとえば、対応するポータブル電源にスマートフォンやノートPCをつないだり、
                        LED照明などの小さな負荷を移したりすると、その機器を使う間の電力を内蔵バッテリーから供給できます。
                        家庭のコンセントから取る電流を減らす工夫の一つです。
                    </p>
                    <h3>夜間に充電し、日中に使う</h3>
                    <p>
                        日中の使用に備えて夜間にポータブル電源を充電し、日中は照明やPCなど移しやすい家電を
                        ポータブル電源から使う方法があります。電気を使う時間帯をずらすことで、
                        日中に家庭のコンセントから同時に取る電流を抑える工夫になります。
                    </p>
                    <p>
                        充電中は充電器の入力分が家庭側の負荷になります。夜間でも給湯器や暖房などが動いている場合があるため、
                        ポータブル電源の入力電力と家全体の使用状況を確認し、必要なら充電速度を下げられる設定を利用してください。
                    </p>
                    <p>
                        時間帯別料金プランでは費用を抑えられる可能性がありますが、電気料金は契約内容によって異なります。
                        充放電による変換ロスもあるため、料金が必ず安くなるわけではありません。
                    </p>
                    <p>
                        ポータブル電源は契約アンペア数や建物の配線容量を増やすものではありません。
                        バッテリーが空になれば充電が必要で、家庭のコンセントで充電するときは充電器の入力分が家庭側の負荷になります。
                        充電は、ほかの家電の使用が少ない時間に行う方法も検討してください。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="check-ratings">
                    <h2 id="check-ratings">出力Wと容量Whを確認する</h2>
                    <p>
                        W（ワット）は一度に出せる電力の大きさ、Wh（ワット時）は蓄えられる電力量の目安です。
                        使いたい機器の消費電力がポータブル電源の定格出力以下か、機器の起動時に必要な出力にも対応できるかを確認します。
                    </p>
                    <p>
                        電気ヒーター、ケトル、電子レンジなど消費電力の大きい機器は、製品の定格出力を超えたり、
                        バッテリーを早く消費したりすることがあります。機器とポータブル電源両方の取扱説明書・定格表示を確認してください。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="safe-use">
                    <h2 id="safe-use">安全に使うために</h2>
                    <ul>
                        <li>使う家電を家庭のコンセントから外し、ポータブル電源の指定された出力へ直接つなぎます。</li>
                        <li>ポータブル電源を家庭の壁コンセントや分電盤につないで、建物の配線へ電気を戻す使い方はしないでください。</li>
                        <li>充電しながら給電する機能は、メーカーが明示的に対応している場合に限り、説明書どおりに使ってください。</li>
                        <li>本体の設置、充電、保管は説明書に従い、破損・異常な発熱などがある場合は使用を中止してください。</li>
                    </ul>
                    <p>
                        ここで紹介するのは一般的なアイデアです。電気設備への接続や容量の判断に迷う場合は、
                        自己流で配線せず、電気工事店など有資格者へ相談してください。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="runtime-assumptions">
                    <h2 id="runtime-assumptions">試算に使うポータブル電源</h2>
                    <p>
                        バッテリー容量{POWER_STATION_CAPACITY_WH.toLocaleString('ja-JP')}Wh、
                        AC定格出力は複数ポート合計最大{AC_OUTPUT_LIMIT_W.toLocaleString('ja-JP')}W
                        （1ポート最大{AC_SINGLE_PORT_LIMIT_W.toLocaleString('ja-JP')}W）級の製品を想定します。
                    </p>
                    <p>
                        AC変換時のロスなどを考慮し、実際に使える電力量を容量の85%（約870Wh）と仮定します。
                        この85%は計算用の仮定であり、製品が保証する値ではありません。
                    </p>
                </section>

                <section className="amp-card" aria-labelledby="appliance-runtime">
                    <h2 id="appliance-runtime">家電別の連続使用時間の目安</h2>
                    <p>
                        初期カタログの運転時アンペアを100V換算した電力で、家電を1台ずつ動かす単純計算です。
                        約870Whを運転時電力で割って使用時間を算出しています。
                        起動時の一時的な電力は使用時間の計算に含めず、起動時電力欄は出力上限との比較用です。
                    </p>
                    <p>
                        コードレス掃除機は本体を掃除に使う時間ではなく、充電器へ給電できる時間の目安です。
                        本体の掃除時間は内蔵バッテリー容量や運転モードによって異なります。
                    </p>
                    <div className="amp-runtime-table-scroll" role="region" aria-label="家電別の連続使用時間一覧" tabIndex={0}>
                        <table className="amp-runtime-table">
                            <thead>
                                <tr>
                                    <th scope="col">家電</th>
                                    <th scope="col">運転時電力</th>
                                    <th scope="col">起動時電力</th>
                                    <th scope="col">連続使用時間</th>
                                    <th scope="col">参考・条件</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appliances.map((appliance) => (
                                    <tr key={appliance.id}>
                                        <th scope="row">{appliance.name}</th>
                                        <td>{getPowerWatts(appliance.runningAmpsTenths).toLocaleString('ja-JP')}W</td>
                                        <td>
                                            {getPowerWatts(appliance.startupAmpsTenths ?? appliance.runningAmpsTenths)
                                                .toLocaleString('ja-JP')}W
                                        </td>
                                        <td>{formatRuntime(appliance.runningAmpsTenths)}</td>
                                        <td>{appliance.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="amp-muted">
                        実際の使用時間は、家電の実消費電力、変換ロス、温度、バッテリーの状態などで変わります。
                        消費電力の小さい機器はポータブル電源本体の待機電力の影響も受けます。
                    </p>
                    <p>
                        同時に複数の家電を使う場合は、運転時・起動時それぞれの電力を合算し、
                        AC定格出力の範囲内に収めてください。起動時は一時的により大きな電力が必要になる場合があるため、
                        家電の仕様とポータブル電源のサージ出力も確認してください。
                    </p>
                </section>
            </div>
        </main>
    );
}
