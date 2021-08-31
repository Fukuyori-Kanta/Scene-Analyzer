﻿    
exports.showStatistics = function() {
    // 全タブのグラフ情報を表示
    showGragh();
}

function showGragh() {
    // 問い合わせするSQL文
    let query = "SELECT * " +
    "FROM ranking LEFT JOIN score_category ON ranking.category = score_category.category;";

    // 接続・問い合わせ
    mydb.query(query).then((results) => { 
        // イテレータ作成
        let rankingData = results; // ランキングのデータ
        let it = [];    // イテレータ
        for(const data of rankingData) {
            /*
            console.log(data.category);
            console.log(data.kubun);
            console.log(data.ranking);
            */
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

        const favoFacterCnt = 17;    // 17項目の好感要因
        const kubun = ['上位', '中位', '下位']; // 区分
        
        // HTML作成
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
                    
                    // 数値
                    let $number =  $('<span class="number">' + data.count + '</span>');
                    
                    // 正規化した値が0.2以上の場合（その区分特有のラベル）、赤字にする
                    if(data.norm >= 0.2) {
                        $label.addClass("red-color");
                    }

                    $row.append($label);
                    $row.append($barWrap);
                    $row.append($number);

                    $dashbordStats.append($row);
                }

                $chartWrap.append($chartTitle);
                $chartWrap.append($dashbordStats);

                $graphArea.append($chartWrap);     
            }       
            
            // 棒グラフの設定
            generateBarGraph('#dashboard-stats');   
        }

    }, (error) => {
        console.log("error:", error.message);
    });
    
    // 接続終了
    mydb.close();   
}

function generateBarGraph(wrapper) {
    // Set Up Values Array
    var values = [];

    // Get Values and save to Array
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
    // Get Max Value From Array
    var max_value = Math.max.apply(Math, values);

    // Set width of bar to percent of max value
    $(wrapper + ' .bar').each(function(index, el) {
        var bar = $(this),
            value = bar.data('value'),
            percent = Math.ceil((value / max_value) * 100);

        // Set Width & Add Class
        bar.width(percent + '%');
        bar.addClass('in');
    });
}