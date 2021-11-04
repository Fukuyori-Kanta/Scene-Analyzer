/**
 * アノテーション処理 
 */
exports.annotationFunc = async function (videoId) {
    let Canvas = new fabric.Canvas('draw-area');    // キャンバス

    let isfirstClick = true;   // [結果を表示]ボタンを初回クリック時だけtrue
    let temp = [];  // 削除するラベル群

    // 各ボタンを非表示
    $('.save-btn').hide();
    $('.cancel-btn').hide();

    // ボタンイベントハンドラ
    //buttonEventHandler();
    
    //function buttonEventHandler() {
    // --------------------------------------------------
    // [編集]ボタンが押された時の処理
    // --------------------------------------------------
    $('.edit-btn').on('click', function (e) {
        let sceneNo = $('#scene-no').text().replace(/[^0-9]/g, ''); // シーン番号

        // 初回時のみ
        if (isfirstClick) {
            // ラベル入力欄を追加
            $('#input-area').append('<input id="input-word" type="text" size="25" placeholder="ラベル名を入力して下さい">');
            $('#input-area').append('<div class="add-btn"><p>追加</p></div>');

            isfirstClick = false;
        }

        //window.open('test.html/' + videoId + '/' + sceneNo , null, 'width=1000,toolbar=yes,menubar=yes,scrollbars=yes');
        //window.open('test.html?search=' + videoId + '-' + sceneNo, null, 'width=1000,toolbar=yes,menubar=yes,scrollbars=yes');
        
    
        // キャンバスに切り替え
        changeElementNode('canvas', videoId, sceneNo);

        // カット画像を描画
        drawImage_area(videoId, sceneNo);

        // 新規バウンディングボックスを描画
        drawDraw_area(videoId, sceneNo);
        /*
        // [削除]ボタンを追加
        // 既に追加されている場合は、追加しない
        if (shouldAddDeleteBtn()) {
            // 各ラベル要素の下に追加
            $('#labels .label-item').append('<div class="delete-btn"><span>×</span></div>');

            // [削除]ボタンにIDを付与
            $('.delete-btn').attr('data-id', function (i) {
                i++;//初期値0を1に
                return i;//要素の数だけ1から連番で idを追加
            });
        }
        */
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
            return isNaN($('.label-item .delete-btn').data('id'));
        }
    });

    // --------------------------------------------------
    // [保存]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.save-btn', function (e) {
        let sceneNo = $('#scene-no').text().replace(/[^0-9]/g, ''); // シーン番号

        // シーン動画に切り替え
        changeElementNode('video', videoId, sceneNo);

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
    $(document).on('click', '.delete-btn', function (e) {
        // 該当のラベルを削除
        let labelId = $('.delete-btn').parent().data('labelId')
        temp.push($('[data-label-id=' + labelId + ']').remove());
        console.log(labelId);
        // 該当の矩形を削除
        deleteRect(labelId);

        // [キャンセル]ボタンを表示
        $('.cancel-btn').show();

        // 1つもラベルがない時、「このシーンにはラベルは付与されていません。」を追加
        if ($('.label-item').length == 0) {
            $('#labels').append('<div class="no-label">このシーンにはラベルは付与されていません。</div>');
        }
    });

    // --------------------------------------------------
    // [キャンセル]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.cancel-btn', function (e) {
        // 削除したラベルを復活させる
        for (let i = 0; i < temp.length; i++) {
            $('#labels').append(temp[i]);
        }

        // [キャンセル]ボタンを非表示
        $('.cancel-btn').hide();
    });

    // --------------------------------------------------
    // [追加]ボタンが押された時の処理
    // --------------------------------------------------
    $(document).on('click', '.add-btn', function (e) {
        let $inputWord = $('#input-word').val();
        // 検索単語が入力されている時にラベルを追加
        if ($inputWord) {
            // １つもラベルがない時、「このシーンにはラベルは付与されていません。」を削除
            if ($('#labels').children().attr("class") == 'no-label') {
                $('.no-label').remove();
            }
            // ラベルを追加
            let $labels = $('#labels');
            let labelId = 3; /////////
            let $labelItem = $('<div data-label-id="' + labelId + '" class="label-item"></div>');
            $labelItem.append('<h3 class="label add-label">' + $inputWord + '</h3>');

            // [削除]ボタンを追加
            $labelItem.append('<div class="delete-btn" data-id="' + labelId + '"><span>×</span></div>');

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
    $(document).on('keypress', '#input-word', function (e) {
        let key = e.which;
        if (key == 13) {
            // 検索ボタンが押された時の処理
            $('.add-btn').trigger('click');

            return false;
        }
    });

    // --------------------------------------------------
    // [保存]ボタンを押さずに、別のカットをクリックした時 
    // --------------------------------------------------
    $('#scene-list').on("click", function (e) {
        // [保存]ボタンを押していない場合、メッセージを表示して遷移させない
        if ($('.save-btn').css('display') == 'block') {
            // 保存できていない旨のメッセージを表示
            swal("変更内容を保存して下さい", "[保存]ボタンを押してからシーンを切り替えて下さい", "error");

            // データを切り替えずにそのシーンに留まる
            e.stopImmediatePropagation();
        }
    });
    
    function changeElementNode(nodeName, videoId, sceneNo) {
        $('#movie-screen').empty();

        if (nodeName == 'canvas') {
            let width = $('#movie-screen').width();
            let height = $('#movie-screen').height();
            $('#movie-screen').append('<canvas id="imgae-area" width="' + width + '" height="' + height + ';"></canvas>');
            $('#movie-screen').append('<canvas id="draw-area" width="' + width + '" height="' + height + ';"></canvas>');
            $('#movie-screen').addClass('layer-wrap');
            $('#movie-screen').css('position, relative');
            $('#movie-screen > canvas').css('position, absolute');
        }
        else if (nodeName == 'video') {
            currentVideo = document.getElementById('movie-screen');
            video = document.createElement('video');
            video.src = '../result/scene/' + videoId + '/' + 'scene' + sceneNo + '.mp4';
            video.controls = true;
            video.autoplay = true;
            currentVideo.append(video);
        }
    }

    async function drawImage_area(videoId, sceneNo) {
        //const query = location.search;
        //const value = query.split('=');
        //const videoId = decodeURIComponent(value[1]).split('-')[0];     // ファイル名
        //const sceneNo = Number(decodeURIComponent(value[1]).split('-')[1]) // カット数


        let AAACanvas = $('#imgae-area')[0];
        let Context = AAACanvas.getContext('2d');
        var RectEdgeColor = "#0BF";
        var RectInnerColor = "rgba(0, 0, 0)";
        var IndicatorColor = "#0082af";

        let thumbnailPath = path.join('../result/thumbnail/', videoId, '/thumbnail' + sceneNo + '.jpg');

        const labelData = await getBoundingBox(videoId, sceneNo);  // ラベルデータ

        let img = new Image();
        img.src = thumbnailPath;

        let canvasWidth = AAACanvas.width;     // キャンバスサイズ（幅）
        let canvasHeight = AAACanvas.height;   // キャンバスサイズ（高さ）
        let imageWidth = 426;   // 画像サイズ（幅） TODO 描画する画像サイズを取得
        let imgaeHeight = 240   // 画像サイズ（高さ）
        let xMagnification = canvasWidth / imageWidth;   // サイズ倍率(x)
        let yMagnification = canvasHeight / imgaeHeight; // サイズ倍率(y)

        img.onload = function () {
            Context.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            // Context.lineWidth = 2
            // Context.font = '8pt Arial';
            // //Context.strokeStyle = "rgb(0, 0, 255)"
            // //Context.fillStyle = 'rgba(0, 255, 128)';

            // Context.strokeStyle = IndicatorColor;
            // Context.fillStyle = RectInnerColor;
            // for(let data of labelData) {    
            //     let labelName = data.label_name_ja;
            //     let score = data.recognition_score;

            //     let x = data.x_axis * xMagnification;
            //     let y = data.y_axis * yMagnification;
            //     let w = data.width * xMagnification;
            //     let h = data.height * yMagnification;

            //     //console.log(labelName + ' (' + Math.round(score * Math.pow(10, 3)) / Math.pow(10, 3) + ') ', x, y, w, h);
            //     Context.strokeRect (x, y, w, h);
            //     Context.fillText(labelName + ' (' + Math.round(score * Math.pow(10, 3)) / Math.pow(10, 3) + ') ', x+5, y+12);
            // }
        }
    }

    /* 該当シーンのラベルデータを取得する関数
    * @param  {string} videoId  動画ID 
    * @param  {int}    sceneNo   シーン番号
    * @return {Object} labelData ラベルデータ（labels_id, label）
    */
    async function getBoundingBox(videoId, sceneNo) {
        // 問い合わせするSQL文
        let query = "SELECT scene_label.label_id, label_list.label_name_ja, scene_label.recognition_score, scene_label.x_axis, scene_label.y_axis, scene_label.width, scene_label.height " +
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

    async function drawDraw_area(videoId, sceneNo) {

        Canvas = new fabric.Canvas('draw-area');


        let canvasWidth = Canvas.width;     // キャンバスサイズ（幅）
        let canvasHeight = Canvas.height;   // キャンバスサイズ（高さ）
        let imageWidth = 426;   // 画像サイズ（幅） TODO 描画する画像サイズを取得
        let imgaeHeight = 240   // 画像サイズ（高さ）
        let xMagnification = canvasWidth / imageWidth;   // サイズ倍率(x)
        let yMagnification = canvasHeight / imgaeHeight; // サイズ倍率(y)

        const labelData = await getBoundingBox(videoId, sceneNo);  // ラベルデータ

        let arrayRect = []; // 矩形オブジェクトの配列
        let objCnt = 1;     // 矩形オブジェクトを一意に識別するためのカウンタ
        for (let data of labelData) {
            let labelId = data.label_id;    // ラベルID

            // 物体ラベルの場合のみ描画
            if (labelId.slice(0, 1) == 'N') {
                let labelName = data.label_name_ja; // ラベル名（日本語）
                let score = data.recognition_score; // 認識スコア

                let x = data.x_axis * xMagnification;   // x軸の座標
                let y = data.y_axis * yMagnification;   // y軸の座標
                let w = data.width * xMagnification;    // 幅
                let h = data.height * yMagnification;   // 高さ

                // 矩形（バウンディングボックス）
                var rect = new fabric.Rect({
                    left: x,         // 左
                    top: y,          // 上
                    width: w,        // 幅
                    height: h,       // 高さ
                    angle: 0,        // 角度
                    strokeWidth: 2,  // 線の幅
                    stroke: '#0BF',  // 線の色
                    fill: 'rgba(174,230,255,0.1)', // 塗潰し色

                    hasRotatingPoint: false // 回転の無効化
                });

                // ラベル名のテキストボックス
                let textbox = new fabric.Textbox('\u00a0' + labelName + '\u00a0', {
                    left: x + 2,         // 左
                    top: y + 2,          // 上
                    fontSize: 14,
                    fontFamily: 'Arial',
                    stroke: '#000', // アウトラインの色
                    strokeWidth: 1, // アウトラインの太さ
                    backgroundColor: 'rgba(174,230,255)',
                });
                
                // 矩形とテキストボックスをグループ化
                var group = new fabric.Group([rect, textbox], {
                    id: objCnt,
                    left: x,
                    top: y,
                    hasRotatingPoint: false // 回転の無効化
                });
                Canvas.add(group);
                
                arrayRect.push(objCnt);
                objCnt += 1;
                
            }
            // オブジェクトの描画
            Canvas.renderAll();
        }

        // ラベルと矩形のID連携
        //console.log($('.label-item[data-label-id=1]').children('h3').text());
        //console.log(Canvas.item(arrayRect.indexOf(1))._objects[1])
        /*
        let rectObjects = Canvas._objects // 矩形オブジェクトの配列
        let coordinationIdList = {};      // 連携用IDリスト

        for (i = 0; i < rectObjects.length; i++) {
            
            coordinationIdList[i+1] = [rectObjects[i];
        }
        console.log(coordinationIdList)
        */


        // --------------------------------------------------
        // 矩形クリックのイベントハンドラ
        // --------------------------------------------------

        // 何も選択していない状態で矩形をクリックした時の処理
        Canvas.on('selection:created', (e) => {    
            let selectedObject = e.selected[0];     
            let selectedRect = selectedObject._objects[0];   // 選択した矩形

            // 選択状態の時塗りつぶし色を変更
            selectedRect.set({
                strokeWidth: 3,  // 線の幅
                stroke: '#BF0',  // 線の色
                fill: 'rgba(230,255,174,0.5)', // 塗潰し色
            }).setCoords();
            Canvas.renderAll();

            // 選択した該当ラベルを強調
            let $targetLabel = $('.label-item[data-label-id=' + selectedObject.id + ']').children('.label');
            $targetLabel.css('border', '2px solid #F33');   // 赤色に変更

            // [削除]ボタンを追加        
            // 各ラベル要素の下に追加
            console.log(selectedObject.id)
            $('#labels .label-item[data-label-id=' + selectedObject.id + ']').append('<div class="delete-btn"><span>×</span></div>');
            // [削除]ボタンを表示
            $('.delete-btn').css('opacity', '1');
            
            
        });

        // 選択状態で他の矩形をクリックした時の処理
        Canvas.on('selection:updated', (e) => {   
            let deselectedObject = e.deselected[0]; // 選択解除したオブジェクト
            let deselectedRect = deselectedObject._objects[0];   // 選択解除した矩形

            let selectedObject = e.selected[0]; // 選択したオブジェクト
            let selectedRect = selectedObject._objects[0];   // 選択した矩形

            // 選択状態の時塗りつぶし色を変更
            deselectedRect.set({
                strokeWidth: 2,  // 線の幅
                stroke: '#0BF',  // 線の色
                fill: 'rgba(174,230,255,0.1)', // 塗潰し色
            }).setCoords();

            // 選択状態の時塗りつぶし色を変更
            selectedRect.set({
                strokeWidth: 3,  // 線の幅
                stroke: '#BF0',  // 線の色
                fill: 'rgba(230,255,174,0.5)', // 塗潰し色
            }).setCoords();
            Canvas.renderAll();

            // 選択した該当ラベルを強調
            let $allLabel = $('.label-item').children('.label');
            $allLabel.css('border', '1px solid #333');   // 黒色に戻す

            let $targetLabel = $('.label-item[data-label-id=' + selectedObject.id + ']').children('.label');
            $targetLabel.css('border', '2px solid #F33');   // 赤色に変更

            // [削除]ボタンを追加 
            let $targetDeleteBtn = $('.label-item[data-label-id=' + deselectedObject.id + ']').children('.delete-btn');
            $targetDeleteBtn.css('opacity', '0');
            
            // 各ラベル要素の下に追加
            $('#labels .label-item[data-label-id=' + selectedObject.id + ']').append('<div class="delete-btn"><span>×</span></div>');
            // [削除]ボタンを表示
            //$('.delete-btn').css('opacity', '1');
            
        });

        // 選択状態で背景をクリックしたときの処理
        Canvas.on('before:selection:cleared', (e) => {   
            let deselectedRect = e.target._objects[0];   // 選択解除した矩形

            // 選択状態の時塗りつぶし色を変更
            deselectedRect.set({
                strokeWidth: 2,  // 線の幅
                stroke: '#0BF',  // 線の色
                fill: 'rgba(174,230,255,0.1)', // 塗潰し色
            }).setCoords();
            Canvas.renderAll();
            
            let $allLabel = $('.label-item').children('.label');
            $allLabel.css('border', '1px solid #333');   // 黒色に戻す
        });
        /*
        function deleteRect(labelId) {
            let Canvas = new fabric.Canvas('draw-area');
            console.log(Canvas);
        
        }
        */
    }

    function deleteRect(labelId) {

        Canvas.remove(Canvas._objects[labelId-1]);

    }

}




    /*
    let Canvas = $('#draw-area')[0];
    let Context = Canvas.getContext('2d');
    var RectEdgeColor = "#0BF";            
    var RectInnerColor = "rgba(174,230,255,0.3)";
    var IndicatorColor = "rgba(0, 0, 0, 0.6)";
    var index = 0;
    var DrawingMemory = { 0: { x: null, y: null, w: null, h: null } };

    Context.strokeStyle = IndicatorColor;
    Context.fillStyle = RectInnerColor;
    Context.lineWidth = 2;
    var startPosition = { x: null, y: null };
    var isDrag;

    function dragStart(x, y) {
        isDrag = true;
        startPosition.x = x;
        startPosition.y = y;
        //console.log(startPosition)
    }

    function dragEnd(x, y) {
        if (isDrag) {
            DrawingMemory[index] = { x: startPosition.x, y: startPosition.y, w: x - startPosition.x, h: y - startPosition.y };
            index += 1;
            drawFromMemory();
        } else {
            clear();
            drawFromMemory();
        }
        isDrag = false;
    }

    function drawFromMemory() {
        Context.strokeStyle = RectEdgeColor;
        
        for (i = 0; i < index; i++) {
            Context.fillRect(DrawingMemory[i].x, DrawingMemory[i].y, DrawingMemory[i].w, DrawingMemory[i].h);
        }
        for (i = 0; i < index; i++) {
            Context.strokeRect(DrawingMemory[i].x, DrawingMemory[i].y, DrawingMemory[i].w, DrawingMemory[i].h);
        }
        Context.strokeStyle = IndicatorColor;
    }

    function draw(x, y) {
        clear(); // Initialization.
        drawFromMemory(); // Draw Bounding Boxes.

        // Draw Indicator.
        Context.beginPath();
        Context.moveTo(0, y); // start
        Context.lineTo(Canvas.width, y); // end
        Context.moveTo(x, 0); // start
        Context.lineTo(x, Canvas.height); // end
        Context.closePath();
        Context.stroke();

        // Draw the current Bounding Box.
        if (isDrag) {
            Context.strokeStyle = RectEdgeColor;
            Context.fillRect(startPosition.x, startPosition.y, x - startPosition.x, y - startPosition.y);
            Context.strokeRect(startPosition.x, startPosition.y, x - startPosition.x, y - startPosition.y);
            Context.strokeStyle = IndicatorColor;
        }
    }

    function mouseHandler() {
        Canvas.addEventListener('mousedown', function (e) {
            dragStart(e.layerX, e.layerY);
        });
        Canvas.addEventListener('mouseup', function (e) {
            dragEnd(e.layerX, e.layerY);
        });
        Canvas.addEventListener('mouseout', function (e) {
            dragEnd(e.layerX, e.layerY);
        });
        Canvas.addEventListener('mousemove', function (e) {
            draw(e.layerX, e.layerY);
        });
    }
    mouseHandler();
    
    function clear() {
        Context.clearRect(0, 0, Canvas.width, Canvas.height);
    }        
    */