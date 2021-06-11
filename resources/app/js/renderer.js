// requireの設定
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG, SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');
const fs = require('fs');
const path = require('path');
const naturalSort = require("javascript-natural-sort");
//const { dir } = require('console');
window.jQuery = window.$ = require('jquery');   // electron上でjquery使う場合、ローカルに置かないと機能しない
let { PythonShell } = require('python-shell');
//const { getHeapCodeStatistics } = require('v8');
const mysql = require('mysql');

// MySQLとのコネクションの作成
const mysql_setting = {
    host : 'localhost',
    user : 'root',
    password : 'password',
    database: 'analysis_db'
}

// --------------------------------------------------
// HTMLが読み込まれたら（起動時）
// --------------------------------------------------
$(function() {
    // [index.html] に対しての処理
    if($('#index').length) {
        indexFunc();
    }
    // [exe.html] に対しての処理
    if($('#exe').length) {
        exeFunc();
    }
    // [result-list.html] に対しての処理
    if($('#result-list').length) {
        resultListFunc();
    }
    // [result-show.html] に対しての処理
    if($('#result-show').length) {
        resultShowFunc();
    }
    // [statistics.html] に対しての処理
    if($('#statistics').length) {
        statisticsFunc();
    }
});

/**
 * [index.html] に対しての処理
 */
function indexFunc() {
    // --------------------------------------------------
    //  直近の閲覧履歴順に5件を表示
    // --------------------------------------------------
    showAccessHistory();

    // --------------------------------------------------
    //  動画がクリックされたら、[result_show.html]に該当の動画名を渡して遷移
    // --------------------------------------------------
    $('#access-history').on('click', function(e) {
        const videoName = e.target.getAttribute('data-video-Name');   // 動画名

        // 動画表示領域クリック時（動画名の取得時）のみ遷移
        if(videoName) {
            location.href = 'result_show.html?name=' +  encodeURIComponent(videoName);
        }
    });
}

/**
 * [exe.html] に対しての処理
 */
function exeFunc() {
    // --------------------------------------------------
    // 初期設定、必要要素の描画
    // --------------------------------------------------
    // ファイル数(初期値)を表示
    let fileNum = 0;    // ファイル数
    $('#file-num').text(fileNum);
    let index = 0;              // 結果表示中の動画インデックス
    let targetVideoList = [];   // 分析対象の動画ファイル名の配列
    let targetPathList = [];    // 分析対象の動画ファイルパスの配列
    let isVideoSet = false;     // 動画設定フラグ（ファイルをD&Dするとtrue）
    let isfirstClick = true;   // [結果を表示]ボタンを初回クリック時だけtrue

    // --------------------------------------------------
    // drag & drop でファイルの読み込み、ファイル一覧を表示
    // --------------------------------------------------
    $('#drop-area').on("dragover", function(e) {
        // ブラウザの機能をキャンセル
        e.preventDefault(); 
    });

    $('#drop-area').on("drop", function(_e){
        let e = _e;
        if( _e.originalEvent ){
            e = _e.originalEvent;
        }
        // ブラウザの機能をキャンセル
        e.preventDefault(); 
        
        // ファイルの取り出し
        let files = e.dataTransfer.files;
        
        // D&Dされたファイルの情報を表示 及び 配列に格納
        for (let i = 0; i < files.length; i++) {

            let fileName = files[i].name;   // ファイル名
            let filePath = files[i].path;   // ファイルのパス

            // 拡張子が動画ファイル(.mp4)の時、
            // 対象に同じファイルが存在しない時に分析対象とする
            if(fileName.split('.').pop() === 'mp4' && !targetVideoList.includes(fileName)) {
                $('#file-list ul').append('<li class="files margin-left">' + files[i].name + '</li>');   // 「分析するファイル一覧」に表示

                targetVideoList.push(fileName); 
                targetPathList.push(filePath);  
                fileNum++;
            }     
        }

        // ファイル数を表示
        $('#file-num').text(fileNum);

        isVideoSet = true;
    });

    // --------------------------------------------------
    // [分析開始]ボタンをクリックした時、pythonで分析を開始
    // --------------------------------------------------
    $('#start-btn').on('click', function() {
        // 動画が1つ以上セットされている時
        if(isVideoSet){
            
            // 処理中のアニメーションを開始
            $('#my-spinner').removeClass('not-exe');

            // 実行            
            runAnalysis(targetPathList)
                .then(confirmCompleted);            
        }
        else{
            alert('動画ファイルを右上領域にドラッグ&ドロップしてから押して下さい。');
        }
    });


    // --------------------------------------------------
    // [結果を見る]ボタンをクリック時、モーダルウィンドウでプレビュー表示
    // --------------------------------------------------
    $('.btn-wrapper').on('click', '#preview-btn', function() {        
        // 初回時のみ
        if(isfirstClick) {
            // モーダルウィンドウを描画
            showModal(index);
            isfirstClick = false;
        }
        //body内の最後に<div id="modal-bg"></div>を挿入
        $("body").append('<div id="modal-bg"></div>');
        
        
        //画面中央を計算する関数を実行
        modalResize();
  
        //モーダルウィンドウを表示
        $("#modal-bg,#modal-main").fadeIn("slow");
        
        //画面のどこかをクリックしたらモーダルを閉じる
        $("#modal-bg").on('click', function() {
            $("#modal-main,#modal-bg").fadeOut("slow",function(){
                //挿入した<div id="modal-bg"></div>を削除
                $('#modal-bg').remove() ;
            }); 
        });
  
        //画面の左上からmodal-mainの横幅・高さを引き、その値を2で割ると画面中央の位置が計算できます
        //$(window).resize(modalResize);
        function modalResize(){
  
            var w = $(window).width();
            var h = $(window).height();
  
            var cw = $("#modal-main").outerWidth();
            var ch = $("#modal-main").outerHeight();
  
            //取得した値をcssに追加する
            $("#modal-main").css({
                "left": ((w - cw)/2) + "px",
                "top": ((h - ch)/2) + "px"    
            });
        }
    });

    // --------------------------------------------------
    // [前の動画へ]ボタンをクリック時、モーダルウィンドウを切替
    // --------------------------------------------------
    $('.prev-button').on('click', function() {
        index--;
        if(index <= 0) {
            index = 0;
        }
        $('#movie-screen').empty();
        $('#scene-list').empty();
        showModal(index);
    });

    // --------------------------------------------------
    // [次の動画へ]ボタンをクリック時、モーダルウィンドウを切替
    // --------------------------------------------------
    $('.next-button').on('click', function() {
        const cutPath = path.join(__dirname, '../python/temp/cut');  // カット保存パス
        console.log(cutPath);
        const fileNames = fs.readdirSync(cutPath);  // カット保存フォルダのファイル名の配列
        index++;
        if(index >= fileNames.length - 1) {
            index = fileNames.length - 1;
        }
        $('#movie-screen').empty();
        $('#scene-list').empty();
        showModal(index);
    });

    // モーダルウィンドウを表示する（初回のみ）
    function showModal(index) {
        // 各種フォルダパス 
        const resultPath = path.join(__dirname, '../python/temp');     // resultフォルダのパス
        const cutPath = path.join(resultPath, 'cut');      // カット動画フォルダのパス
        const cutImgPath = path.join(resultPath, 'cut_img'); // カット画像フォルダのパス

        // --------------------------------------------------
        // 動画情報を[result_list.html]から取得、表示
        // --------------------------------------------------
        //const query = location.search;
        //const value = query.split('=');
        //const fileName = decodeURIComponent(value[1]);  // ファイル名
        //const fileName = 'F201065409';  // ファイル名
        //const cutPath = './python/temp/cut';  // カット保存パス
        const fileNames = fs.readdirSync(cutPath);  // カット保存フォルダのファイル名の配列
        const fileName = fileNames[index];
        // --------------------------------------------------
        // アクセス履歴を更新
        // --------------------------------------------------
        updateAccessHistory(fileName);

        let cutNo = 1;  // カット番号（初期値は１を設定）

        // ファイル名とカット番号を表示
        $('#file-name').text(fileName);
        $('#cut-no').text(cutNo + 'シーン目');
        
        // --------------------------------------------------
        // [temp]フォルダから動画データを読み込み、表示
        // --------------------------------------------------
        let targetFolderPath = path.join(cutImgPath, fileName)    // 該当フォルダのパス
        
        // 該当フォルダのカット画像一覧を取得
        let folderList = getFolderList(targetFolderPath).sort(naturalSort); // カット画像のファイル名一覧

        // 動画の表示
        let $currentVideo = $('#movie-screen'); // 現在表示中の動画 

        // <video>要素を作成・追加
        let $video = $('<video></video>');
        $video.attr({
            //'src': path.join('..', cutPath, fileName, 'cut' + cutNo + '.mp4'),
            'src': path.join(cutPath, fileName, 'cut' + cutNo + '.mp4'),
            'controls': true,
            'autoplay': true
        });  
        $currentVideo.append($video);

        // カット数を表示
        $('#cut-cnt').text(folderList.length);

        // カット一覧表示
        let $videoList = $('#modal-main #scene-list');  // カット一覧
        for(let i = 0, len = folderList.length; i < len; i++){
            // <li>要素を作成
            let $li = $('<li></li>');
            $li.attr('class', 'item');

            // <img>要素を作成
            let $cutImg = $('<img>');
            $cutImg.attr({
                'data-cut-no': i+1,
                'class': 'cut-img',
                //'src': path.join('..', cutImgPath, fileName, folderList[i])
                'src': path.join(cutImgPath, fileName, folderList[i])
            });

            // ノードの組み立て
            $li.append($cutImg);
            $videoList.append($li);
        }

        // 現在のシーンの枠に色付け
        $('#modal-main img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
        $('#modal-main img[data-cut-no=' + cutNo + ']').css('border-color', '#e00');

        // --------------------------------------------------
        // ラベルデータと好感度データをDBから読み込み、表示 TODO
        // --------------------------------------------------
        //showLabelData(fileName, cutNo);

        // --------------------------------------------------
        // 別のカットをクリックした時、データを切り替える
        // --------------------------------------------------
        $('#modal-main #scene-list').on("click", function(e) {
            cutNo = e.target.getAttribute('data-cut-No');   // カット番号(シーン番号)

            // シーンの表示領域クリック時のみ切り替え
            if(cutNo) {
                // カット番号を表示
                $('#cut-no').text(cutNo + 'シーン目');
                
                // 動画を置換
                currentVideo = document.getElementById('movie-screen');
                video = document.createElement('video');
                video.src = '../python/temp/cut/' + fileName + '/' + 'cut' + cutNo + '.mp4';
                video.controls = true;
                video.autoplay = true;
                currentVideo.replaceChild(video, currentVideo.lastChild);

                // ラベルデータ、好感度データを置換
                //showLabelData(fileName, cutNo);

                // 現在のシーンの枠に色付け
                $('#modal-main img').css('border-color', '#000');  // 全ての枠を黒色に戻してから
                $('#modal-main img[data-cut-no=' + cutNo + ']').css('border-color', '#e00');
            }
        });
    }

    /**
     * 該当パスの配列に対してカット分割～ＣＭ好感度の付与をする関数
     * 実際の実行行うのは、pythonのコード
     * @param  {str} targetPathList 該当パスの配列
     */
    const runAnalysis = function(targetPathList) {
        return new Promise(function(resolve, reject) {
            let options = {
                pythonPath: 'C:\\Users\\hukuyori\\Anaconda3\\python',
                scriptPath : path.join(__dirname, '/../python/'),
                args : [targetPathList]
            };
            let pyshell = new PythonShell('main.py', options);
            pyshell.on('message', function(targetPathList) {
                //console.log(targetPathList) // TODO: 文字化け、終了の通知、ファイル一覧の削除
                resolve();
            });
        })   
    }

    const confirmCompleted = function() {
        return new Promise(function(resolve, reject){
            const cutPath = path.join(__dirname, '../python/temp/cut');  // カット保存パス
            console.log(cutPath)
            const fileNames = fs.readdirSync(cutPath);  // カット保存フォルダのファイル名の配列
            
            let targetNames = [];   // 実行対象のファイル名の配列
            targetPathList.forEach((targetPath) => {
                targetNames.push(path.basename(targetPath, '.mp4'));
            });

            console.log(fileNames);
            console.log(targetNames);
        
            // 処理中のアニメーションを終了
            $('#my-spinner').addClass('not-exe');

            // 正常に処理されたか確認
            Array.prototype.equals = function (array) {
                // if the other array is a falsy value, return
                if (!array)
                    return false;
            
                // compare lengths - can save a lot of time 
                if (this.length != array.length)
                    return false;
            
                for (var i = 0, l=this.length; i < l; i++) {
                    // Check if we have nested arrays
                    if (this[i] instanceof Array && array[i] instanceof Array) {
                        // recurse into the nested arrays
                        if (!this[i].equals(array[i]))
                            return false;       
                    }           
                    else if (this[i] != array[i]) { 
                        // Warning - two different object instances will never be equal: {x:20} != {x:20}
                        return false;   
                    }           
                }       
                return true;
            }   

            function s(x,y){
                var pre = ['string' , 'number' , 'bool']
                if(typeof x!== typeof y )return pre.indexOf(typeof y) - pre.indexOf(typeof x);
            
                if(x === y)return 0;
                else return (x > y)?1:-1;
            
            }
            var arr1 = fileNames.sort(s);
            var arr2 = targetNames.sort(s);
            
            console.log(arr1.equals(arr2));// true

            console.log(fileNames);
            console.log(targetNames);

            if(fileNames.toString() === targetNames.toString()) {
                alert('処理が完了しました。');

                // 結果表示ボタンの表示 
                $('#grid-F .btn-wrapper').empty().append('<button id="preview-btn" class="button" type="button"><p>結果を見る</p></button>');

                resolve();
            }
            else{
                // エラー処理 TODO
                alert('処理が完了しました。');
                //alert('処理に失敗しました。');
                //reject();
            }
            /*
            else{
                //reject();
            }*/
            /*
            fileNames.forEach((fileName) => {
                console.log(getFolderList(path.join(cutPath, fileName)));
            });

            
            fs.existsSync(path)
            */
        })
    }
}

/**
 * [resultList.html] に対しての処理
 */
function resultListFunc() {
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
        // プレスホルダーに検索単語を表示
        $('#search-word').val(searchWord);

        search_sql(searchWord, searchOption);
    }
    // --------------------------------------------------
    // 検索オプションが指定されずにこのページに遷移した場合
    // --------------------------------------------------
    else {
        // 結果を動画名ごとにまとめて取得
        const dirents = fs.readdirSync(path.join(__dirname, '../result/thumbnail'), { withFileTypes: true });
        const videos = [];
        for (const dirent of dirents) {
            if (dirent.isDirectory()) {
                videos.push(dirent.name);
            } 
        }
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
    $('#search-button').on('click', function(e) {
        let $searchWord = $('#search-word').val();
        let $searchOption = $('input[name="search-option"]:radio').val();
        
        console.log($searchWord);
        console.log($searchOption);
        
        // 検索単語が入力されている時のみ、
        // 同ページ([result_list.html])に検索単語を送信
        if($searchWord) {
            location.href = 'result_list.html?search=' + encodeURIComponent($searchWord);
        }
        //location.href = 'result_list.html?search=' + encodeURIComponent($searchWord) + 
        //'&option=' + encodeURIComponent($searchOption);

    });
    // --------------------------------------------------
    // テキストボックスでEnterが押された時の処理（Enter無効化）
    // --------------------------------------------------  
    $('#search-word').on('keydown', function(e) {
        if(e.key == 'Enter') {
            return false;
        }
    });
}   

/**
 * [result_show.html]に対しての処理 
 */
function resultShowFunc() {

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

    let cutNo = 1;  // カット番号（初期値は１を設定）

    // ファイル名とカット番号を表示
    $('#file-name').text(fileName);
    $('#cut-no').text(cutNo + 'シーン目');
    
    // --------------------------------------------------
    // [result]フォルダから動画データを読み込み、表示
    // --------------------------------------------------
    let targetFolderPath = path.join(cutImgPath, fileName)    // 該当フォルダのパス

    // 該当フォルダのカット画像一覧を取得
    let folderList = getFolderList(targetFolderPath).sort(naturalSort); // カット画像のファイル名一覧
    
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
    $('#cut-cnt').text(folderList.length);

    // カット一覧表示
    let $videoList = $('#scene-list');  // カット一覧
    for(let i = 0, len = folderList.length; i < len; i++){
        // <li>要素を作成
        let $li = $('<li></li>');
        $li.attr('class', 'item');

        // <img>要素を作成
        let $cutImg = $('<img>');
        $cutImg.attr({
            'data-cut-no': i+1,
            'class': 'cut-img',
            'src': path.join(cutImgPath, fileName, folderList[i])
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
}
    
function statisticsFunc() {
    // 全タブのグラフ情報を表示
    showGragh();
}

/**
 * DBからアクセス履歴を降順に取得し、直近5件のコンテンツを表示
 */
function showAccessHistory() {   
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);

    // DB接続
    connection.connect();

    let query = "SELECT * " +
                "FROM access_history " +
                "ORDER BY last_access_time DESC;";
    
    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(query, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        } 

        // --------------------------------------------------
        // 5件のコンテンツを表示
        // --------------------------------------------------
        const displayCount = 5; // 表示件数
        for(let i = 0; i < displayCount; i++) {
            let videoName = rows[i].video_id;   // 動画名
            
            // カット数を取得
            let targetFolderPath = path.join(__dirname, '../result/thumbnail/', videoName);
            let cutNum = getFolderList(targetFolderPath).length;

            // サムネ画像のパスを取得
            let thumbnail = '../result/thumbnail/' + videoName + '/thumbnail1.jpg'
                
            // 各要素の作成・追加
            // <div>要素を作成
            let $div = $('<div class="item"></div>');

            // <img>要素を追加
            let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnail + ' alt="">');
            $($div).append($img);

            // <p>要素を追加
            let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + videoName + '(' + cutNum + ')</p>');
            $($div).append($p);
            // let $div = $('<div class="item"><img class="thumbnail" src=' + thumbnail + ' alt=""><p>' + videoName + '(' + cutNum + ')</p></div>');

            $('#access-history').append($div);
        }
    });

    // DB接続終了
    connection.end();           
}

/**
 * 該当パスのフォルダ内のファイル情報（ファイル名）を返す関数
 * @param  {str} targetFolderPath 該当パス
 * @return {object}     ファイル名を格納したobject
 */
function getFolderList(targetFolderPath) {
    // 該当パス直下のファイルやディレクトリ全てがDirentオブジェクトの配列で返ってくる
    const allDirents = fs.readdirSync(targetFolderPath, { withFileTypes: true });
    //const allDirents = path.join(__dirname, '../'+targetFolderPath);

    return allDirents.filter(dirent => dirent.isFile()).map(({ name }) => name);
}



/**
 * 動画名の配列を受け取り、それらの動画を表示する
 * @param  {Array} videos 表示する動画名の配列
 */
function showVideos(videos) {
    videos.forEach(videoName => {
        // カット数を取得
        let cutNum = getFolderList(path.join(__dirname, '../result/thumbnail/', videoName)).length;

        // サムネ画像のパスを取得
        let thumbnail = '../result/thumbnail/' + videoName + '/thumbnail1.jpg'
            
        // 各要素の作成・追加
        // <div>要素を作成
        let $div = $('<div class="item"></div>');

        // <img>要素を追加
        let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnail + ' alt="">');
        $($div).append($img);

        // <p>要素を追加
        let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + videoName + '(' + cutNum + ')</p>');
        $($div).append($p);
        // let $div = $('<div class="item"><img class="thumbnail" src=' + thumbnail + ' alt=""><p>' + videoName + '(' + cutNum + ')</p></div>');

        $('#video-list').append($div);
    });
}

/**
 * 該当ファイルのラベルデータと好感度データを表示する関数
 * @param  {str} fileName 該当パスの配列
 * @param  {int} sceneNo 該当パスの配列
 */
function showLabelData(fileName, sceneNo) {   
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);
    
    // DB接続
    connection.connect();

    let query = "SELECT * " +
                "FROM scene_data LEFT JOIN labels_data ON scene_data.labels_id=labels_data.labels_id " +
                "WHERE video_id='" + fileName + "' AND scene_no='scene_" + sceneNo + "';";
    
    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(query, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        }        

        // --------------------------------------------------
        // ラベルの表示
        // --------------------------------------------------
        let $labels = $('#labels');
        $labels.empty();   // 前のラベルデータを削除

        // ラベルが1個もない時
        if(rows[0].labels_id == null) {
            $labels.append('このシーンにはラベルは付与されていません。');
        } 
        else {
            for(let data of rows) {
                let $label = $('<p class="label">' + data.label + '</p>');
                $labels.append($label);
            }
        }

        // --------------------------------------------------
        // 好感度の表示
        // --------------------------------------------------        
        $('#favo').text(rows[0].favo_value);

    });

    // DB接続終了
    connection.end();           
}

/**
 * 検索関数　TODO: 
 * @param  {str} searchWord 検索ワード
 */
function search_sql(searchWord, searchOption) {
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);
    
    // DB接続
    connection.connect();

    const words = searchWord.split('　');   // 検索ワード
    let query = "";     // 実行するクエリ
    let videos = [];    // 表示する動画名の配列

    // 検索オプションの判定
    // "動画名"の場合
    if(searchOption=='video-name') {
        query = "SELECT video_id, scene_no, labels_id FROM scene_data " +
                "WHERE video_id like '" + words[0] + "%' " + 
                "GROUP BY video_id;";
    }
    // "ラベル名"の場合 
    else {
        let qry1 =  "SELECT video_id, scene_no, labels_id FROM scene_data " +
                    "WHERE labels_id IN ( " +
                        "SELECT labels_id " +
                        "FROM labels_data " +
                        "WHERE labels_id in ( " +
                            "SELECT DISTINCT(labels_id) FROM labels_data " +
                            "WHERE label = '" + words[0] + "')) " +
                    "GROUP BY video_id; ";
        
        let qry2 =  "SELECT video_id, scene_no, labels_id FROM scene_data " +
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
                    "GROUP BY video_id; ";
        
        let qry3 =  "SELECT video_id, scene_no, labels_id FROM scene_data " +
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
                    "GROUP BY video_id; ";
        
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

    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(query, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        } 

        for(let data of rows) {
            videos.push(data.video_id);
        }

        // 件数を表示
        $('#scene-count').text(videos.length);

        // --------------------------------------------------
        // SQLの結果の動画一覧を表示
        // --------------------------------------------------
        showVideos(videos);
    });
        
    // 接続終了
    connection.end();        
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
                "WHERE video_id='" + fileName + "';";

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


function showGragh() {
    // MySQLとのコネクションの作成
    const connection = mysql.createConnection(mysql_setting);

    // DB接続
    connection.connect();

    let query = "SELECT * " +
                "FROM ranking LEFT JOIN score_category ON ranking.category = score_category.category;";

    // --------------------------------------------------
    // SQL文の実行
    // --------------------------------------------------
    connection.query(query, function (err, rows) {
        // エラー処理
        if (err) { 
            console.log('err: ' + err); 
        } 

        // イテレータ作成
        let rankingData = rows; // ランキングのデータ
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
                count : data.count
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
                    } else if(j ==2 ){
                        $bar.attr('data-class', 'btm');
                    }
                    
                    $barWrap.append($bar);
                    
                    // 数値
                    let $number =  $('<span class="number">' + data.count + '</span>');
                    
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
    });    

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

    /*
    //--------------------------------------------------------------------------------
    // マウスホイールで横スクロール処理 TODO
    //--------------------------------------------------------------------------------
    // スクロール後の位置
    var moving;
    // 1スクロールの移動距離
    var speed = 30;
    $('.horizontal-scroll').on('mousewheel', function(e, mov) {
        console.log('scroll')
        //  スクロール後の位置の算出
        var moving = $(this).scrollLeft() - mov * speed;
        // スクロールする
        $(this).scrollLeft(moving);
        // 縦スクロールさせない
        return false;
    });
    */
