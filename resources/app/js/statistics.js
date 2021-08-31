/**
 * 統計データを表示する関数
 * @module showStatistics
 */
exports.showStatistics = async function() {
    // ランキングデータを取得
    const rankingData = await getRankingData();
    
    // ランキングのグラフを表示
    showRankingData(rankingData);
}

/**
 * ランキングデータを取得する関数
 * @return {Object} rankingData ランキングデータ
 */
async function getRankingData() {
    // 問い合わせするSQL文
    let query = "SELECT * " +
                "FROM ranking LEFT JOIN score_category ON ranking.category = score_category.category;";

    // 接続・問い合わせ
    let rankingData = await mydb.query(query);  // ランキングデータ

    return rankingData
}

/**
 * ランキングデータを表示する関数
 * 上位・中位・下位のラベル名、件数を好感要因別で表示する
 * @param  {Object} rankingData ランキングデータ
 * @param  {Object} rankingData.category        好感要因の記号
 * @param  {Object} rankingData.category_name   好感要因の名称
 * @param  {Object} rankingData.kubun           区分（上位・中位・下位）
 * @param  {Object} rankingData.ranking         ランキング
 * @param  {Object} rankingData.label           ラベル名
 * @param  {Object} rankingData.count           ラベルの件数
 * @param  {Object} rankingData.norm            正規化した時の値
 */
function showRankingData(rankingData) {
    // イテレータ作成
    let it = [];    // イテレータ

    for(const data of rankingData) {
        it.push({
            category : data.category,   
            kubun : data.kubun,         
            ranking : data.ranking,
            label : data.label,
            count : data.count, 
            norm : data.norm
        });
    }
    const entries = it.entries();

    const favoFacterCnt = 17;    // 好感要因（CM好感度、試用意向、15項目の好感要因 の17項目）
    const kubun = ['上位', '中位', '下位']; // 区分
    
    // データをHTMLに出力
    for(let i = 0; i < favoFacterCnt; i++){
        // グラフ作成エリア
        let $graphArea = $('#graghArea-' + (i+1).toString());

        for(let j = 0; j < kubun.length; j++) {
            // 横棒グラフ
            let $chartWrap = $('<div class="chart-wrap"></div>');
            
            // 表題
            let $chartTitle = $('<div class="chart-title">' + kubun[j] + '</div>');

            // データ
            let $dashbordStats = $('<div id="dashboard-stats" class="chart bars-horizontal brand-primary"></div>');
            
            for(let k = 0; k < 10; k++) {
                // イテレータからデータ取り出し
                let data = entries.next().value[1];

                // 行
                let $row = $('<div class="row"></div>');
                
                // ラベル
                let $label = $('<span class="label">' + data.label + '</span>');

                // 横棒
                let $barWrap = $('<div class="bar-wrap"></div>');
                let $bar = $('<div class="bar"></div>');
                $bar.attr('data-value', data.count);

                // 区分属性を追加
                if(j == 0) {
                    $bar.attr('data-class', 'top');
                } else if(j == 1) {
                    $bar.attr('data-class', 'mid');
                } else if(j == 2){
                    $bar.attr('data-class', 'btm');
                }
                
                $barWrap.append($bar);
                
                // 件数
                let $count =  $('<span class="count">' + data.count + '</span>');
                
                // 正規化した値が0.2以上の場合（その区分特有のラベル）、赤字にする
                if(data.norm >= 0.2) {
                    $label.addClass("red-color");
                }

                $row.append($label);
                $row.append($barWrap);
                $row.append($count);

                $dashbordStats.append($row);
            }

            $chartWrap.append($chartTitle);
            $chartWrap.append($dashbordStats);

            $graphArea.append($chartWrap);     
        }       
        
        // 棒グラフの設定
        generateBarGraph('#dashboard-stats');   
    }
}

/**
 * 棒グラフを表示する関数
 * HTMLに埋め込まれた件数（数値）を取得してグラフを描画する
 * @param {string} wrapper  グラフを描画するHTMLのID
 */
function generateBarGraph(wrapper) {
    let values = [];    // 件数を格納する配列

    // 件数データを格納
    $(wrapper + ' .bar').each(function(index, el) {
        values.push($(this).data('value'));

        // 色の変更
        if($(this).data('class') == 'mid') {
            $(this).css('background', 'linear-gradient(45deg, #c3ff7f, #b6ff6b)');
        }
        else if($(this).data('class') == 'btm') {
            $(this).css('background', 'linear-gradient(45deg, #ff7fc3, #ff6bb6)');
        } 
    });
    // 件数の最大値を取得
    let max_value = Math.max.apply(Math, values);

    // 件数の最大値に合わせて描画
    $(wrapper + ' .bar').each(function(index, el) {
        let bar = $(this),
            value = bar.data('value'),
            percent = Math.ceil((value / max_value) * 100);

        // 幅とクラスを設定
        bar.width(percent + '%');
        bar.addClass('in');
    });
}