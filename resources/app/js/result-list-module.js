/**
 * 
 * @module resultListFunc
 */
 exports.resultListFunc = async function() {
    // --------------------------------------------------
    // 検索オプションが指定されてこのページに遷移した場合
    // --------------------------------------------------
    const query = location.search;
    const value = query.split('=');
    console.log(value);
    const searchWord = decodeURIComponent(value[1]);  // ファイル名
    console.log(searchWord);
    
    // ページ更新時にタグの状態を保持
    let searchOption = localStorage.getItem('search-option');
    console.log(searchOption);
    if(x=document.querySelector('[name=search-option][value='+searchOption+']')) {
        x.checked=true;
    } 
    [].forEach.call(document.querySelectorAll('[name=search-option]'),function(x){
        x.addEventListener('change',function(e){
            localStorage.setItem('search-option',e.target.value);
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
        
        // SQLに一覧データを問い合わせて表示
        search_sql(searchWord, searchOption);
    }
    // --------------------------------------------------
    // 検索オプションが指定されずにこのページに遷移した場合
    // --------------------------------------------------
    else {
        // 結果を動画名ごとにまとめて取得
        
        let videos = fileOperationModule.getAllVideoID();   // 全動画名を取得

        // 件数を表示
        $('#scene-count').text(videos.length);

        // SQLの結果の動画一覧を表示
        showVideos(videos);
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
        let $searchOption = $('input[name="search-option"]:radio').val();
       
        // 検索単語が入力されている時のみ、
        // 同ページ([result_list.html])に検索単語を送信
        if($searchWord) {
            location.href = 'result_list.html?search=' + encodeURIComponent($searchWord);
        }
    });
    // --------------------------------------------------
    // テキストボックスでEnterが押された時の処理（Enter無効化）
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
    const cutPath = path.join(resultPath, 'scene');        // カット動画フォルダのパス
    const cutImgPath = path.join(resultPath, 'thumbnail'); // カット画像フォルダのパス
    
    // --------------------------------------------------
    // 動画情報を[result_list.html]から取得、表示
    // --------------------------------------------------
    const query = location.search;
    const value = query.split('=');
    const fileName = decodeURIComponent(value[1]);  // ファイル名

    // --------------------------------------------------
    // アクセス履歴を更新
    // --------------------------------------------------
    updateAccessHistory(fileName);

    // 作品名とカット番号を表示
    let cutNo = 1;  // カット番号（初期値は１を設定）

    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);

    // DB接続
    connection.connect();

    let qry = "SELECT product_name " +
                "FROM works_data " +
                "WHERE video_id='" + fileName + "';";
    
    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(qry, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        }

        // パンくずリストにファイル名を表示
        $('.bread ul').append('<li>' + rows[0].product_name + "</li>").trigger('create');
        $('#file-name').text(rows[0].product_name);
    });

    // DB接続終了
    connection.end();     

    // カット番号の表示
    $('#cut-no').text(cutNo + 'シーン目');
    
    // --------------------------------------------------
    // [result]フォルダから動画データを読み込み、表示
    // --------------------------------------------------
    let targetFolderPath = path.join(cutImgPath, fileName)    // 該当フォルダのパス

    // 該当フォルダのカット画像一覧を取得
    let fileList = fileOperationModule.getFileList(targetFolderPath); // カット画像のファイル名一覧

    // 動画の表示
    let $currentVideo = $('#movie-screen'); // 現在表示中の動画 

    // <video>要素を作成・追加
    let $video = $('<video></video>');
    $video.attr({
        'src': path.join(cutPath, fileName, 'scene' + cutNo + '.mp4'),
        'controls': true,
        'autoplay': true
    });  
    $currentVideo.append($video);

    // カット数を表示
    $('#cut-cnt').text(fileList.length);

    // カット一覧表示
    let $videoList = $('#scene-list');  // カット一覧
    for(let i = 0, len = fileList.length; i < len; i++){
        // <li>要素を作成
        let $li = $('<li></li>');
        $li.attr('class', 'item');

        // <img>要素を作成
        let $cutImg = $('<img>');
        $cutImg.attr({
            'data-cut-no': i+1,
            'class': 'thumbnail',
            'src': path.join(cutImgPath, fileName, fileList[i])
        });

        // ノードの組み立て
        $li.append($cutImg);
        $videoList.append($li);
    }

    // 現在のシーンの枠に色付け
    $('#result-show img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
    $('#result-show img[data-cut-no=' + cutNo + ']').css('border-color', '#e00');

    // --------------------------------------------------
    // ラベルデータと好感度データをDBから読み込み、表示
    // --------------------------------------------------
    showLabelData(fileName, cutNo);

    // アノテーション機能
    let isfirstClick = true;   // [結果を表示]ボタンを初回クリック時だけtrue
    let temp = [];  // 削除するラベル群

    // 各ボタンを非表示
    $('.save-btn').hide();
    $('.cancel-btn').hide();
    // --------------------------------------------------
    // [編集]ボタンが押された時の処理
    // --------------------------------------------------
    $('.edit-btn').on('click', function(e) {
        // 初回時のみ
        if(isfirstClick) {
            // ラベル入力欄を追加
            $('#input-area').append('<input id="input-word" type="text" size="25" placeholder="ラベル名を入力して下さい">');
            $('#input-area').append('<div class="add-btn"><p>追加</p></div>');

            isfirstClick = false;
        }        

        // [削除]ボタンを追加
        // 既に追加されている場合は、追加しない
        if(shouldAddDeleteBtn()) {
            // 各ラベル要素の下に追加
            $('#labels .label-item').append('<div class="delete-btn"><span>×</span></div>');
            
            // [削除]ボタンにIDを付与
            $('.delete-btn').attr('data-id', function(i){
                i++;//初期値0を1に
                return i;//要素の数だけ1から連番で idを追加
            });
        }

        // [編集]ボタンを非表示
        $('.edit-btn').hide();

        // [保存]ボタンを表示
        $('.save-btn').show();  
        
        // [削除]ボタンを表示
        $('.delete-btn').css('opacity', '1');
        
        // ラベル入力欄を表示
        $('#input-area').show();

        // [削除]ボタンを追加するか真偽値を返す関数
        function shouldAddDeleteBtn() {
            // IDが割り振られていれば、既に追加されているためFalseを返す
            return $('.label-item .delete-btn').data('id') != 1;
        }
    });

    // --------------------------------------------------
    // [保存]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.save-btn', function(e) {
        // [編集]ボタンを表示
        $('.edit-btn').show();

        // [保存]ボタンを非表示
        $('.save-btn').hide();

        // [キャンセル]ボタンを非表示
        $('.cancel-btn').hide();

        // [削除]ボタンを非表示
        $('.delete-btn').css('opacity', '0');

        // ラベル入力欄を非表示
        $('#input-area').hide();

        // 編集後のラベルデータの送信
        
    });

    // --------------------------------------------------
    // [削除]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.delete-btn', function(e) {
        // 該当のラベルを削除
        let labelId = $(e.currentTarget).data("id");
        temp.push($('[data-label-id=' + labelId + ']').remove());

        // [キャンセル]ボタンを表示
        $('.cancel-btn').show();

        // 1つもラベルがない時、「このシーンにはラベルは付与されていません。」を追加
        if($('.label-item').length == 0) {
            $('#labels').append('<div class="no-label">このシーンにはラベルは付与されていません。</div>');
        }
    });

    // --------------------------------------------------
    // [キャンセル]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.cancel-btn', function(e) {
        // 削除したラベルを復活させる
        for(let i = 0; i < temp.length; i++) {  
            $('#labels').append(temp[i]);
        }
            
        // [キャンセル]ボタンを非表示
        $('.cancel-btn').hide();
    });

    // --------------------------------------------------
    // [追加]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.add-btn', function(e) {
        let $inputWord = $('#input-word').val();
        // 検索単語が入力されている時にラベルを追加
        if($inputWord) {
            // １つもラベルがない時、「このシーンにはラベルは付与されていません。」を削除
            if($('#labels').children().attr("class") == 'no-label') {
                $('.no-label').remove();
            }
            // ラベルを追加
            let $labels = $('#labels');
            let labelId = 3; /////////
            let $labelItem = $('<div data-label-id="' + labelId + '" class="label-item"></div>');
            $labelItem.append('<h3 class="label add-label">' + $inputWord + '</h3>');

            // [削除]ボタンを追加
            $labelItem.append('<div class="delete-btn" data-id="' + labelId +'"><span>×</span></div>');

            // 追加要素を反映
            $labels.append($labelItem);
            
            // ラベル入力欄のテキストを削除
            $('#input-word').val("");

            // 追加した[削除]ボタンを表示
            $('.delete-btn').css('opacity', '1');
        }
    });

    // --------------------------------------------------
    // ラベル入力欄でEnterキーが押された時の処理
    // --------------------------------------------------
    $(document).on('keypress', '#input-word', function(e) {
        let key = e.which;
        if(key == 13) {
            // 検索ボタンが押された時の処理
            $('.add-btn').trigger('click');

            return false;
        }
    });

    // --------------------------------------------------
    // [保存]ボタンを押さずに、別のカットをクリックした時 
    // --------------------------------------------------
    $('#scene-list').on("click", function(e) {
        // [保存]ボタンを押していない場合、メッセージを表示して遷移させない
        if ($('.save-btn').css('display') == 'block') {
            // 保存できていない旨のメッセージを表示
            swal("変更内容を保存して下さい", "[保存]ボタンを押してからシーンを切り替えて下さい", "error");

            // データを切り替えずにそのシーンに留まる
            e.stopImmediatePropagation();
        }
    });  

    // --------------------------------------------------
    // 別のカットをクリックした時、データを切り替える
    // --------------------------------------------------
    $('#scene-list').on("click", function(e) {
        cutNo = e.target.getAttribute('data-cut-No');   // カット番号(シーン番号)

        // シーンの表示領域クリック時のみ切り替え
        if(cutNo) {
            // カット番号を表示
            $('#cut-no').text(cutNo + 'シーン目');
            
            // 動画を置換
            currentVideo = document.getElementById('movie-screen');
            video = document.createElement('video');
            video.src = '../result/scene/' + fileName + '/' + 'scene' + cutNo + '.mp4';
            video.controls = true;
            video.autoplay = true;
            currentVideo.replaceChild(video, currentVideo.lastChild);

            // ラベルデータ、好感度データを置換
            showLabelData(fileName, cutNo);

            // 現在のシーンの枠に色付け
            $('#result-show img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
            $('#result-show img[data-cut-no=' + cutNo + ']').css('border-color', '#e00');
        }
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
    const after = 100;   // 余韻の距離
    const speed = 1;    // 1スクロールの移動距離
    const animation = 'easeOutCirc';    // アニメーション
    const anm_speed = 700;    // アニメーションスピード
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
}

/**
 * 動画名の配列を受け取り、それらの動画を表示する
 * @param  {Array} videos 表示する動画名の配列
 */
function showVideos(videos) {
    // 問い合わせするSQL文
    let query = "SELECT video_id, product_name " +
                "FROM works_data " +
                "ORDER BY video_id";
    
    // 接続・問い合わせ
    mydb.query(query).then((results) => { 
        // --------------------------------------------------
        // サムネイルと作品名の表示
        // --------------------------------------------------
        for(let data of results) {
            let videoName = data.video_id;  // 動画ID
            let product_name = data.product_name;   // 作品名

            // サムネ画像のパスを取得
            let thumbnailPath = fileOperationModule.getThumbnailPath(videoName);  // サムネ画像のパス
                
            // 表示コンテンツ（サムネイルと作品名）の作成・追加
            // <div>要素を作成
            let $div = $('<div class="item"></div>');

            // <img>要素を追加
            let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnailPath + ' alt="">');
            $($div).append($img);

            // <p>要素を追加
            let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + product_name + '</p>');
            $($div).append($p);

            $('#video-list').append($div);
        }
    }, (error) => {
        console.log("error:", error.message);
    });

    // 接続終了
    mydb.close();
}

/**
 * 該当ファイルのラベルデータと好感度データを表示する関数
 * @param  {str} fileName 該当パスの配列
 * @param  {int} sceneNo 該当パスの配列
 */
async function showLabelData(fileName, sceneNo) {   
    // 問い合わせするSQL文
    let query = "SELECT * " +
                "FROM scene_data LEFT JOIN labels_data ON scene_data.labels_id=labels_data.labels_id " +
                "WHERE video_id='" + fileName + "' AND scene_no='scene_" + sceneNo + "';";
    
    // 接続・問い合わせ
    mydb.query(query).then((results) => { 
        // --------------------------------------------------
        // ラベルの表示
        // --------------------------------------------------
        let $labels = $('#labels');
        $labels.empty();   // 前のラベルデータを削除

        // ラベルが1個もない時
        if(results[0].labels_id == null) {
            $labels.append('<div class="no-label">このシーンにはラベルは付与されていません。</div>');
        } 
        else {
            for(let i = 0; i < results.length; i++) {     
                let label = results[i].label // ラベル名
                let $labelItem = $('<div data-label-id="' + Number(i+1) + '" class="label-item"></div>');
                $labelItem.append('<h3 class="label">' + label + '</h3>');
                $labels.append($labelItem);
            }
        }
        // --------------------------------------------------
        // 好感度の表示
        // --------------------------------------------------        
        $('#favo').text(results[0].favo_value);

        //const favoValues = getFavoValues(fileName);

        //console.log(favoValues);
        drawChart(fileName, sceneNo); // グラフ描画処理を呼び出す

    }, (error) => {
        console.log("error:", error.message);
    });
    
    // 接続終了
    // ここでは、終了するとエラーになる（要調査）
    // mydb.close();   
}

/**
 * 検索関数　TODO: 
 * @param  {str} searchWord 検索ワード
 */
function search_sql(searchWord, searchOption) {
    const words = searchWord.split('　');   // 検索ワード
    let query = "";     // 実行するクエリ
    let videos = [];    // 表示する動画名の配列

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
                    "WHERE labels_id IN ( " +
                        "SELECT labels_id " +
                        "FROM labels_data " +
                        "WHERE labels_id in ( " +
                            "SELECT DISTINCT(labels_id) FROM labels_data " +
                            "WHERE label = '" + words[0] + "')) " +
                    "GROUP BY works_data.video_id; ";
        
        let qry2 =  "SELECT works_data.video_id, works_data.product_name " + 
                    "FROM scene_data INNER JOIN works_data ON scene_data.video_id = works_data.video_id " + 
                    "WHERE labels_id IN ( " +
                        "SELECT labels_id " +
                        "FROM labels_data " +
                        "WHERE labels_id in ( " +
                            "SELECT t1.labels_id FROM " +
                                "(SELECT DISTINCT(labels_id) FROM labels_data " +
                                "WHERE label = '" + words[0] + "') As t1, " +
                                "(SELECT DISTINCT(labels_id) FROM labels_data " +
                                "WHERE label = '" + words[1] + "') As t2 " +
                            "WHERE t1.labels_id = t2.labels_id )) " +
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
    mydb.query(query).then((results) => { 
        for(let data of results) {
            videos.push(data.video_id);
        }
        // 件数を表示
        $('#scene-count').text(videos.length);

        // --------------------------------------------------
        // SQLの結果の動画一覧を表示
        // --------------------------------------------------
        //showVideos(videos);

        // --------------------------------------------------
        // サムネイルと作品名の表示
        // --------------------------------------------------
        for(let data of results) {
            let videoName = data.video_id;  // 動画ID

            // サムネ画像のパスを取得
            let thumbnailPath = fileOperationModule.getThumbnailPath(videoName);  // サムネ画像のパス

            // 表示コンテンツ（サムネイルと作品名）の作成・追加
            // <div>要素を作成
            let $div = $('<div class="item"></div>');

            // <img>要素を追加
            let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnailPath + ' alt="">');
            $($div).append($img);

            // <p>要素を追加
            let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + data.product_name + '</p>');
            $($div).append($p);

            $('#video-list').append($div);
        }

    }, (error) => {
        console.log("error:", error.message);
    });
    
    // 接続終了
    mydb.close();   
}

/**
 * 該当動画のアクセス時間を更新する
 * @param  {str} fileName 検索ワード
 */
function updateAccessHistory(fileName) {
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);

    // DB接続
    connection.connect();

    let query = "UPDATE access_history set last_access_time = NOW() " +
                "WHERE video_id='" + fileName + "'";

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

// グラフ描画処理
async function drawChart(fileName, current) { 

    // 好感度データの取得
    //const fileName = 'A211079558';
    const favoValues = await getFavoValues(fileName);
    const favoData = [...favoValues].map((d) => {return d.favo_value});

    // x軸ラベル（シーン〇  〇は全角数字）
    const xAxisLabels = [...Array(favoValues.length).keys()].map((d) => {return "シーン" + zenkaku2Hankaku(String(d+1))});

    const lineChartData = {
        labels : xAxisLabels, 
        datasets : [
            {
            label: "AA",
            lineTension: 0,
            data : favoData, 
            borderColor: '#00a0dcff',
            backgroundColor: '#00a0dc11',
            pointRadius: [3]
            }
        ]
    }
    const lineChartOption = {
        scales: {
            yAxes: [           // Ｙ軸 
                {
                    ticks: {     // 目盛り        
                        min: 0,      // 最小値
                        // beginAtZero: true でも同じ
                        //max: 0.06,     // 最大値
                        stepSize: 0.01  // 間隔
                    }
                }
            ]
        },
        legend: {
            display: false
        }
        //responsive: false  // canvasサイズ自動設定機能を使わない。HTMLで指定したサイズに固定
    }

    // データ
    for (var i = 0; i < lineChartData.datasets[0].data.length; i++) {
        lineChartData.datasets[0].pointRadius[i] = 3
    }
    
    lineChartData.datasets[0].pointRadius[current-1] = 10
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myChart = new Chart(ctx, { // インスタンスをグローバル変数で生成
        type: 'line',
        data: lineChartData,
        options: lineChartOption
    }); 
    console.log(lineChartData.datasets[0].pointRadius)
}
/*
function display_point_current(current) {
    return 0;
}
*/

/**
 * 該当動画の好感度データを取得する関数
 * @return {Object} favoValues 好感度データ
 */
 async function getFavoValues(fileName) {
    // 問い合わせするSQL文
    let query = "SELECT favo_value " +
                "FROM scene_data " +
                "WHERE video_id='" + fileName + "';";

    // 接続・問い合わせ
    let favoValues = await mydb.query(query);  // 好感度データ
    
    // 接続終了
    //mydb.close();
    
    return favoValues
}


/**
 * 半角英数字を全角英数字に変換する関数
 * @return {String}} 全角英数字に変換した文字列
 */
function zenkaku2Hankaku(str) {
    return str.replace(/[A-Za-z0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
}