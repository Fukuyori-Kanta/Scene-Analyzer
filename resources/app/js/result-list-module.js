const annotationModule = require('../js/annotation-module');        // アノテーションモジュール 

/**
 * 
 * @module resultListFunc
 */
 exports.resultListFunc = async function() {
    // --------------------------------------------------
    // 検索オプションが指定されてこのページに遷移した場合
    // --------------------------------------------------
    const query = location.search;  // URLパラメータ（クエリ）
    const value = query.split('=');
    const searchWord = decodeURIComponent(value[1]);  // 検索ワード
    
    // ページ更新時にタグの状態を保持
    let searchOption = localStorage.getItem('search-option');

    if(x = document.querySelector('[name=search-option][value=' + searchOption + ']')) {
        x.checked = true;
    } 
    [].forEach.call(document.querySelectorAll('[name=search-option]'), function(x){
        x.addEventListener('change', function(e){
            localStorage.setItem('search-option', e.target.value);
        });
    });
    if(searchOption == 'video-name') {
        $('#search-word').attr('placeholder', '動画名を検索');
    }
    else {
        $('#search-word').attr('placeholder', 'ラベル名を検索（３つまで）');
    }
    
    if(searchWord !== 'undefined') {
        // パンくずリストに検索条件を表示
        $('.bread ul').append('<li>' + searchWord + "</li>").trigger('create');

        // プレスホルダーに検索単語を表示
        $('#search-word').val(searchWord);
        
        // 検索に引っかかったＣＭのサムネ画像と作品名を表示
        showSearchedVideo(searchWord, searchOption);
    }
    // --------------------------------------------------
    // 検索オプションが指定されずにこのページに遷移した場合
    // --------------------------------------------------
    else {
        // 全ＣＭのサムネ画像と作品名を表示
        showAllVideo();
    }

    // --------------------------------------------------
    // 動画がクリックされたら、[result_show.html]に該当の動画名を渡して遷移
    // --------------------------------------------------
    $('#video-list').on('click', function(e) {
        videoName = e.target.getAttribute('data-video-Name');   // 動画名

        // 動画表示領域クリック時（動画名の取得時）のみ遷移
        if(videoName) {
            location.href = 'result_show.html?name=' +  encodeURIComponent(videoName);
        }
    });
    // --------------------------------------------------
    // 検索オプション（ラジオボタン）が変更された時の処理
    // --------------------------------------------------
    $('input[name="search-option"]:radio').on('change', function(e) {
        let $radioVal = $(this).val();
        if ($radioVal == 'video-name') {
            $('#search-word').attr('placeholder', '動画名を検索');
        }
        else {
            $('#search-word').attr('placeholder', 'ラベル名を検索（３つまで）');
        }
   });
    // --------------------------------------------------
    // 検索ボタンが押された時の処理
    // --------------------------------------------------
    $('#search-button').click(function(e) {
        let $searchWord = $('#search-word').val();
       
        // 検索単語が入力されている時のみ、
        // 同ページ([result_list.html])に検索単語を送信
        if($searchWord) {
            location.href = 'result_list.html?search=' + encodeURIComponent($searchWord);
        }
    });
    // --------------------------------------------------
    // テキストボックスでEnterが押された時の処理
    // --------------------------------------------------  
    $('#search-word').keypress(function(e) {
        let key = e.which;
        if(key == 13) {
            // 検索ボタンが押された時の処理
            $('#search-button').click();

            return false;
        }
    });
    // --------------------------------------------------
    // ヘルプアイコンを押した時の処理
    // --------------------------------------------------  
    $('.help-icon').on('click', function(e) {
        e.stopPropagation();
        let tooltip = $('.tooltip');
        if (tooltip.css('display') == 'block') {
            tooltip.css('display', 'none');
        } else {
            tooltip.css('display', 'block');
        }
    });
    $('#result-list').on('click', function () {
        let tooltip = $('.tooltip');
        tooltip.css('display', 'none');
    });
}   

/**
 * [result_show.html]に対しての処理 
 */
 exports.resultShowFunc = async function() { 

    // 各種フォルダパス 
    const resultPath = path.join(__dirname, '../result');     // resultフォルダのパス
    const scenePath = path.join(resultPath, 'scene');         // シーン動画フォルダのパス
    const thumbnailPath = path.join(resultPath, 'thumbnail'); // サムネ画像フォルダのパス
    
    // --------------------------------------------------
    // 動画情報を[result_list.html]から取得、表示
    // --------------------------------------------------
    const query = location.search;
    const value = query.split('=');
    const videoId = decodeURIComponent(value[1]);  // 動画ID

    // --------------------------------------------------
    // アクセス履歴を更新
    // --------------------------------------------------
    updateAccessHistory(videoId);
    
    // --------------------------------------------------
    // 作品名とシーン番号を表示
    // --------------------------------------------------
    const productName = await getProductName(videoId); // 作品名
    ///////////////////////////let sceneNo = 1;  // シーン番号（初期値は１を設定）
    sceneNo = 1;

    // パンくずリストに作品名を表示
    $('.bread ul').append('<li>' + productName + "</li>").trigger('create');

    // タイトルに作品名を表示
    $('#file-name').text(productName);

    // シーン番号を表示
    $('#scene-no').text(sceneNo + 'シーン目');
    
    // --------------------------------------------------
    // [result]フォルダから動画データを読み込み、表示
    // --------------------------------------------------
    let targetFolderPath = path.join(thumbnailPath, videoId)    // 該当フォルダのパス

    // 該当フォルダのサムネ画像一覧を取得
    let fileList = fileOperationModule.getFileList(targetFolderPath); // サムネ画像のファイル名一覧

    // 動画を表示
    let $currentVideo = $('#movie-screen'); // 現在表示中の動画 

    // <video>要素を作成・追加
    let $video = $('<video></video>');
    $video.attr({
        'src': path.join(scenePath, videoId, 'scene' + sceneNo + '.mp4'),
        'controls': true,
        'autoplay': true
    });  
    $currentVideo.append($video);

    // シーン数を表示
    $('#scene-cnt').text(fileList.length);

    // シーン一覧表示
    let $videoList = $('#scene-list');  // シーン一覧
    for(let i = 0, len = fileList.length; i < len; i++){
        // <li>要素を作成
        let $li = $('<li></li>');
        $li.attr('class', 'item');

        // <img>要素を作成
        let $thumbnail = $('<img>');
        $thumbnail.attr({
            'data-scene-no': i+1,
            'class': 'thumbnail',
            'src': path.join(thumbnailPath, videoId, fileList[i])
        });

        // ノードの組み立て
        $li.append($thumbnail);
        $videoList.append($li);
    }

    // 現在のシーンの枠に色付け
    $('#result-show img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
    $('#result-show img[data-scene-no=' + sceneNo + ']').css('border-color', '#e00');

    // --------------------------------------------------
    // ラベルデータと好感度データをDBから取得、表示
    // --------------------------------------------------
    // ラベルデータを表示
    showLabelData(videoId, sceneNo);

    // 好感度データを表示
    window.myChart = 0; // 描画時に使用するグローバル変数
    showFavoData(videoId, sceneNo);

    // --------------------------------------------------
    // 別のシーンをクリックした時、データを切り替える
    // --------------------------------------------------
    $('#scene-list').on("click", async function(e) {
        sceneNo = e.target.getAttribute('data-scene-No');   // シーン番号

        // 切り替えたシーンの結果を表示する
        showResultContents(videoId, sceneNo);
    });  

    // --------------------------------------------------
    // マウスホイールで横スクロール処理
    // --------------------------------------------------
    // イージング（easing）処理
    jQuery.easing['jswing'] = jQuery.easing['swing'];
    jQuery.extend( jQuery.easing,
    {
        def: 'easeOutQuad',
        easeOutCirc: function (x, t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        }
    });

    let moving;         // スクロール後の位置
    let aftermov;       // スクロール後の位置+余韻の距離
    const after = 50;  // 余韻の距離
    const speed = 1;    // 1スクロールの移動距離
    const animation = 'easeOutCirc';    // アニメーション
    const anm_speed = 300;    // アニメーションスピード
    $('.horizontal-scroll').on('mousewheel', function(e) {
        let mov = e.originalEvent.wheelDelta   // 移動量

        // スクロール後の位置の算出
        moving = $(this).scrollLeft() - mov * speed;

        // スクロールする
        $(this).scrollLeft(moving);
        
        // 余韻の計算
        if (mov < 0) {
            // 下にスクロールしたとき
            aftermov =  moving + after;
        } else {
            // 上にスクロールしたとき
            aftermov =  moving - after;
        }
        // 余韻アニメーション
        $(this).stop().animate({scrollLeft: aftermov}, anm_speed, animation);
        
        // 縦スクロールさせない
        return false;
    });

    // --------------------------------------------------
    // アノテーション機能
    // --------------------------------------------------
    annotationModule.annotationFunc(videoId);

}

/**
 * 全ＣＭの動画データ（動画IDと作品名）を取得する関数
 * @return {Object} allVideoData 全ＣＭの動画データ
 */
 async function getAllVideoData() {
    // 問い合わせするSQL文
    let query = "SELECT video_id, product_name " +
                "FROM works_data " +
                "ORDER BY video_id";

    // 接続・問い合わせ
    let allVideoData = await mydb.query(query);  // 全ＣＭの動画IDと作品名
    
    // 接続終了
    mydb.close();

    return allVideoData;
}

/**
 * 検索に引っかかったＣＭの動画データ（動画IDと作品名）を取得する関数
 * @param  {string} searchWord   検索ワード
 * @param  {string} searchOption 検索オプション
 * @return {Object} searchedVideoData 検索に引っかかったＣＭの動画データ
 */
 async function getSearchedVideoData(searchWord, searchOption) {
    const words = searchWord.replaceAll("　", " ").split(' ');   // 検索ワード
    let query = "";     // 実行するクエリ

    // 検索オプションの判定
    // "動画名"の場合
    if(searchOption=='video-name') {
        query = "SELECT works_data.video_id, works_data.product_name " +
                "FROM scene_data INNER JOIN works_data ON scene_data.video_id = works_data.video_id " + 
                "WHERE product_name like '%" + words[0] + "%' " + 
                "GROUP BY works_data.video_id; ";
    }
    // "ラベル名"の場合 
    else {
        let qry1 =  "SELECT works_data.video_id, works_data.product_name " +
                    "FROM scene_data INNER JOIN works_data ON scene_data.video_id = works_data.video_id " + 
                    "WHERE scene_data.scene_label_id IN ( " +
                        "SELECT scene_label.scene_label_id " +
                        "FROM scene_label INNER JOIN label_list ON scene_label.label_id = label_list.label_id " +
                        "WHERE scene_label.scene_label_id in ( " +
                            "SELECT DISTINCT(scene_label_id) FROM scene_label " +
                            "WHERE label_name_ja = '" + words[0] + "')) " +
                    "GROUP BY works_data.video_id; ";
        
        let qry2 =  "SELECT works_data.video_id, works_data.product_name " + 
                    "FROM scene_data INNER JOIN works_data ON scene_data.video_id = works_data.video_id " + 
                    "WHERE scene_data.scene_label_id IN ( " +
                        "SELECT scene_label.scene_label_id " +
                        "FROM scene_label INNER JOIN label_list ON scene_label.label_id = label_list.label_id " +
                        "WHERE scene_label.scene_label_id in ( " +
                            "SELECT t1.scene_label_id FROM " +
                                "(SELECT DISTINCT(scene_label_id) FROM scene_label " +
                                "WHERE label_name_ja = '" + words[0] + "') As t1, " +
                                "(SELECT DISTINCT(scene_label_id) FROM scene_label " +
                                "WHERE label_name_ja = '" + words[1] + "') As t2 " +
                            "WHERE t1.scene_label_id = t2.scene_label_id )) " +
                    "GROUP BY works_data.video_id; ";
        
        let qry3 =  "SELECT works_data.video_id, works_data.product_name " + 
                    "FROM scene_data INNER JOIN works_data ON scene_data.video_id = works_data.video_id " + 
                    "WHERE labels_id IN ( " +
                        "SELECT labels_id " +
                        "FROM labels_data " +
                        "WHERE labels_id in ( " +
                            "SELECT t1.labels_id FROM " +
                                "(SELECT DISTINCT(labels_id) FROM labels_data " +
                                "WHERE label = '" + words[0] + "') As t1, " +
                                "(SELECT DISTINCT(labels_id) FROM labels_data " +
                                "WHERE label = '" + words[1] + "') As t2,  " +
                                "(SELECT DISTINCT(labels_id) FROM labels_data " +
                                "WHERE label = '" + words[2] + "') As t3 " +
                            "WHERE t1.labels_id = t2.labels_id AND t2.labels_id = t3.labels_id)) " +
                    "GROUP BY works_data.video_id; ";
        
        // 単語数による判定
        switch(words.length) {
            case 1:
                query = qry1;
                break;
            case 2:
                query = qry2;
                break;
            case 3:
                query = qry3;
                break;
        }
    }

    // 接続・問い合わせ
    let searchedVideoData = await mydb.query(query);  // 全ＣＭの動画IDと作品名

    // 接続終了
    mydb.close();

    return searchedVideoData;
}

/**
 * 該当シーンのラベルデータを取得する関数
 * @param  {string} videoId   動画ID 
 * @param  {int}    sceneNo   シーン番号
 * @return {Object} labelData ラベルデータ（scene_label_id, label_id, label_nama_ja）
 */
 async function getLabelData(videoId, sceneNo) {
    // 問い合わせするSQL文
    let query = "SELECT scene_label.scene_label_id, label_list.label_id, label_list.label_name_ja " +
                "FROM scene_label " + 
                "LEFT JOIN scene_data ON scene_label.scene_label_id = scene_data.scene_label_id " +
                "LEFT JOIN label_list ON scene_label.label_id = label_list.label_id " +
                "WHERE video_id='" + videoId + "' AND scene_no='scene_" + sceneNo + "';";

    // 接続・問い合わせ
    let labelData = await mydb.query(query);  // 全ＣＭの動画IDと作品名

    // 接続終了
    //mydb.close(); // 同じページで何度も利用するため

    return labelData;
}

/**
 * 該当動画の好感度データを取得する関数
 * @return {Object} favoValues 好感度データ
 */
 async function getFavoValues(videoId) {
    // 問い合わせするSQL文
    let query = "SELECT scene_favo.favo " +
                "FROM scene_favo " + 
                "LEFT JOIN scene_data ON scene_favo.scene_favo_id = scene_data.scene_favo_id " +
                "LEFT JOIN score_category ON scene_favo.category = score_category.category " +
                "WHERE scene_data.video_id='" + videoId + "' AND score_category.category = 'F';";

    // 接続・問い合わせ
    let favoValues = await mydb.query(query);  // 好感度データ
    
    // 接続終了
    //mydb.close();
    
    return [...favoValues].map((d) => {return d.favo;});
}

/**
 * 動画IDから作品名を取得する関数
 * @param  {string} videoId  動画ID
 * @return {Object}          作品名   
 */
 async function getProductName(videoId) {
    // 問い合わせするSQL文
    let query = "SELECT product_name " +
                "FROM works_data " +
                "WHERE video_id='" + videoId + "';";

    // 接続・問い合わせ
    let productName = await mydb.query(query);  // 全ＣＭの動画IDと作品名

    // 接続終了
    //mydb.close();

    return productName[0].product_name;
}

/**
 * 全ＣＭのサムネ画像と作品名を表示する関数
 */
async function showAllVideo() {
    // --------------------------------------------------
    // 全ＣＭの動画データ（動画IDと作品名）を取得
    // --------------------------------------------------
    const allVideoData = await getAllVideoData();   // 全ＣＭの動画データ

    // --------------------------------------------------
    // 取得した動画がフォルダに存在するかチェック
    // --------------------------------------------------


    // --------------------------------------------------
    // 全ＣＭ分のサムネ画像と作品名を表示
    // --------------------------------------------------
    showContens(allVideoData);    
}

/**
 * 検索に引っかかったＣＭのサムネ画像と作品名を表示する関数
 * @param  {string} searchWord   検索ワード
 * @param  {string} searchOption 検索オプション
 */
async function showSearchedVideo(searchWord, searchOption) {
    // --------------------------------------------------
    // 検索に引っかかったＣＭの動画データ（動画IDと作品名）を取得
    // --------------------------------------------------
    const searchedVideoData = await getSearchedVideoData(searchWord, searchOption); // 検索したＣＭの動画データ
    
    // --------------------------------------------------
    // 取得した動画がフォルダに存在するかチェック
    // --------------------------------------------------
    
    
    // --------------------------------------------------
    // 検索に引っかかったＣＭのサムネ画像と作品名を表示
    // --------------------------------------------------
    showContens(searchedVideoData);
}

/**
 * 与えられた動画データのサムネ画像と作品名を表示する関数
 * @param  {Object} videos 動画データ
 */
function showContens(videos) {
    // 件数を表示
    $('#scene-count').text(videos.length);

    // 与えられたCＭ分のデータを表示
    for(let data of videos) {
        let videoName = data.video_id;       // 動画ID
        let productName = data.product_name; // 作品名

        // サムネ画像のパスを取得
        let thumbnailPath = fileOperationModule.getThumbnailPath(videoName);  // サムネ画像のパス
        /* ======= デモ用 ======= 
        let thumbnailPath = '';
        if(videoName === 'demo60') {
            thumbnailPath = fileOperationModule.getThumbnailPath(videoName);
        }
        else {
            thumbnailPath = '..\\images\\cannot_displayed.jpg';
        }
         ======= デモ用 ======= */

        // 表示コンテンツ（サムネ画像と作品名）の作成・追加
        // <div>要素を作成
        let $div = $('<div class="item"></div>');

        // <img>要素を追加
        let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnailPath + ' alt="">');
        $($div).append($img);

        // <p>要素を追加
        let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + productName + '</p>');
        $($div).append($p);

        $('#video-list').append($div);
    } 
}

/**
 * 該当シーンのラベルデータを表示する関数
 * @param  {string} videoId 動画ID
 * @param  {int}    sceneNo シーン番号
 */
 async function showLabelData(videoId, sceneNo) {   
    // --------------------------------------------------
    // ラベルデータを取得
    // --------------------------------------------------
    const labelData = await getLabelData(videoId, sceneNo);  // ラベルデータ

    // --------------------------------------------------
    // ラベルを表示
    // --------------------------------------------------
    let $labels = $('#labels');
    $labels.empty();   // 前のラベルデータを削除
    
    // ラベルが1個もない時
    if(labelData[0] == null) {
        // ラベルが1つもない文言を表示
        $labels.append('<div class="no-label">このシーンにはラベルは付与されていません。</div>');
    } 
    else {
        // 付与されたラベル数だけラベルを表示
        for(let i = 0; i < labelData.length; i++) {     
            let label = labelData[i].label_name_ja // ラベル名
            let $labelItem = $('<div data-label-id="' + Number(i+1) + '" class="label-item"></div>');
            
            // 動作ラベルはグレー色、物体ラベルはホワイト色で背景を表示
            if(labelData[i].label_id.slice(0, 1) == 'N') {   
                $labelItem.append('<h3 class="label">' + label + '</h3>');
            }
            else { 
                $labelItem.append('<h3 class="action-label">' + label + '</h3>');
            }
            $labels.append($labelItem);
        }
    }    
}

/**
 * 該当シーンの好感度データを表示する関数
 * @param  {string} videoId 動画ID
 * @param  {int}    sceneNo シーン番号
 */
 async function showFavoData(videoId, sceneNo) {   
    // --------------------------------------------------
    // 好感度データを取得
    // --------------------------------------------------
    const favoValues = await getFavoValues(videoId);
    
    // --------------------------------------------------
    // 好感度を表示
    // --------------------------------------------------        
    //$('#favo').text(favoValues[sceneNo-1]);  

    // --------------------------------------------------
    // 好感度グラフを表示
    // --------------------------------------------------  
    drawChart(favoValues, sceneNo, videoId);
}

/**
 * 該当シーンの分析結果（分割したシーンの動画、ラベルデータ、好感度データ）を表示する関数
 * @param  {string} videoId 動画ID
 * @param  {int}    sceneNo シーン番号
 */
function showResultContents(videoId, sceneNo) {
    // シーンの表示領域クリック時のみ切り替え
    if(sceneNo) {
        // シーン番号を表示
        $('#scene-no').text(sceneNo + 'シーン目');
        
        // 動画を置換
        $('#movie-screen').empty();
        currentVideo = document.getElementById('movie-screen');
        video = document.createElement('video');
        video.src = '../result/scene/' + videoId + '/' + 'scene' + sceneNo + '.mp4';
        video.controls = true;
        video.autoplay = true;
        currentVideo.append(video);

        // ラベルデータを表示            
        showLabelData(videoId, sceneNo);

        // 好感度データを表示
        showFavoData(videoId, sceneNo);

        // 現在のシーンの枠に色付け
        $('#result-show img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
        $('#result-show img[data-scene-no=' + sceneNo + ']').css('border-color', '#e00');
        
        /*
        // --------------------------------------------------
        // [編集]ボタンが押された時の処理
        // --------------------------------------------------
        $('.edit-btn').on('click', function(e) {
            //window.open('test.html?search=' + videoId + '-' + sceneNo, null, 'width=1000,toolbar=yes,menubar=yes,scrollbars=yes');
            //console.log('----------------------' + videoId, sceneNo)
            drawImage_area(videoId, sceneNo);

            // 新規バウンディングボックスの描画
            drawDraw_area(videoId, sceneNo);
        });
        $(document).on('click', '.save-btn', function(e) {
            changeElementNode('video', videoId, sceneNo);
        });
        */
        
    }
}

/**
 * 折れ線グラフを描画する関数
 * @param  {Object} favoData 好感度データ
 * @param  {int}    current  現在のシーン番号
 */
 async function drawChart(favoData, current, videoId) { 
    // x軸ラベル（シーン〇  〇は全角数字）
    const xAxisLabels = [...Array(favoData.length).keys()].map((d) => {return "シーン" + zenkaku2Hankaku(String(d+1));});

    // 描画するグラフのデータ
    const lineChartData = {
        labels : xAxisLabels, 
        datasets : [
            {
            label: "好感度",
            lineTension: 0,
            data : favoData, 
            borderColor: '#00a0dcff',
            backgroundColor: '#00a0dc11',
            pointRadius: [3]
            }
        ]
    }
    // グラフのオプション
    const lineChartOption = {
        // 大きさ
        scales: {
            yAxes: [                    // Ｙ軸 
                {
                    ticks: {            // 目盛り        
                        min: 0,         // 最小値
                        //max: 0.06,    // 最大値
                        stepSize: 0.01  // 間隔
                    }
                }
            ]
        },
        // 凡例
        legend: {
            display: false
        },
        // アニメーション
        animation: false, 
        // マウスオーバー時のカーソル変更関数
        onHover : function(e, el) {
            if (! el || el.length === 0) {
                $('#canvas').css('cursor', 'default');
            } else {
                $('#canvas').css('cursor', 'pointer');
            }
        },
    }

    // ポイントの大きさを設定（現在シーンには、大きくポイントを描画）
    for (let i = 0; i < lineChartData.datasets[0].data.length; i++) {
        lineChartData.datasets[0].pointRadius[i] = 3
    }
    lineChartData.datasets[0].pointRadius[current-1] = 10

    let myCanvas = $('#canvas')[0];
    let ctx = myCanvas.getContext('2d');
    // 既に描画している場合は、一度クリア
    // クリアしないと描画ずれが起きる
    if(myChart) {
        myChart.destroy();
    }
    // 折れ線グラフを描画
    myChart = new Chart(ctx, {
        type: 'line',
        data: lineChartData,
        options: lineChartOption
    }); 

    /* クリック処理（必要かどうかは検討） 参考 : https://qiita.com/sato_ryu/items/b83eac5c2e1efe29507d    */
    // ポインタをクリックした場合、該当シーンに遷移する
    $('#canvas').on('click', function(e) {
        let item = myChart.getElementAtEvent(e);
    
        if (item.length == 0) {
            return;
        }
        
        let sceneNo = item[0]._index + 1  // シーン番号
                
        // 切り替えたシーンの結果を表示する
        showResultContents(videoId, sceneNo);
    });
}

/**
 * TODO 
 * 該当動画のアクセス時間を更新する関数
 * @param  {string} videoId 検索ワード
 */
function updateAccessHistory(videoId) {
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);

    // DB接続
    connection.connect();

    let query = "UPDATE access_history set last_access_time = NOW() " +
                "WHERE video_id='" + videoId + "'";

    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(query, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        } 
    });

    // DB接続終了
    connection.end();           
}

/**
 * 半角英数字を全角英数字に変換する関数
 * @return {string}} 全角英数字に変換した文字列
 */
function zenkaku2Hankaku(str) {
    return str.replace(/[A-Za-z0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
}