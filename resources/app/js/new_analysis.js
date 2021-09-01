/**
 * 新規分析を行う関数
 * @module analyzeNewly
 */
exports.analyzeNewly = async function() {
    // --------------------------------------------------
    // 初期設定、必要要素の描画
    // --------------------------------------------------
    // 初期値の表示
    let fileNum = 0;    // ファイル数
    let totalFileSize = 0;  // 合計ファイルサイズ
    let shouldStarting = false;  // 処理開始フラグ
    const sizeMaxThreshold = 15728640;   // 3MB（3145728）
    $('#file-num').text(fileNum);
    $('#file-size').text(totalFileSize);
    
    let index = 0;              // 結果表示中の動画インデックス
    let targetVideoList = [];   // 分析対象の動画ファイル名の配列
    let targetPathList = [];    // 分析対象の動画ファイルパスの配列
    //let shouldStarting = false; // 処理開始フラグ（ファイルをD&Dするとtrue）
    let isfirstClick = true;    // [結果を表示]ボタンを初回クリック時だけtrue

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
            let fileSize = files[i].size;   // ファイルのサイズ

            // 拡張子が動画ファイル(.mp4)の時、
            // 対象に同じファイルが存在しない時に分析対象とする
            if(fileName.split('.').pop() === 'mp4' && !targetVideoList.includes(fileName)) {
                // ファイルサイズ加算
                totalFileSize += fileSize;

                // 「分析するファイル一覧」に表示
                $('#file-list ul').append('<li class="files margin-left">' + files[i].name + '</li>'); 

                targetVideoList.push(fileName); 
                targetPathList.push(filePath);  
                fileNum++;
            }   
        }
        
        // ファイル数を表示
        $('#file-num').text(fileNum);

        // ファイルサイズ表示
        let organizedFileSize = Math.ceil(totalFileSize/(1024*1024) * Math.pow(10, 2)) / Math.pow(10, 2) // MB変換、小数点第3位切り上げ
        $('#file-size').text(organizedFileSize + ' MB');

        // ファイルサイズを判定  
        // 上限を超えた場合、エラーメッセージの表示と現在のファイルサイズを赤字で表示
        if(totalFileSize >= sizeMaxThreshold) {
            // 赤字で表示
            $('#file-size').css('color', 'red');
            
            // エラーメッセージを表示
            alert('合計ファイルサイズが' + sizeMaxThreshold/(1024*1024) + 'MBを超えています。');
        }
        else {
            // 分析開始フラグを立てる
            shouldStarting = true;  
        }
    });

    // --------------------------------------------------
    // [分析開始]ボタンをクリックした時、pythonで分析を開始
    // --------------------------------------------------
    $('#start-btn').on('click', function() {
        // 分析開始フラグが立っている時
        if(shouldStarting){
            //alert('現在、新規分析の機能は利用できません。');
            
            // 処理中のアニメーションを開始
            $('#my-spinner').removeClass('not-exe');

            // 実行            
            runAnalysis(targetPathList)
                .then(confirmCompleted);
                     
        }
        else{
            alert('動画ファイルを右上領域にドラッグ&ドロップしてから押して下さい。\nもしくは、ファイルサイズが上限を超えています。');
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
                pythonPath: 'C:\\Users\\fukuyori\\anaconda3\\envs\\scene_ana\\python',
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