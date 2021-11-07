/**
 * アノテーション処理 
 */
 exports.annotationFunc = async function (videoId) {
    let rectCanvas = new fabric.Canvas('rect-area');    // バウンディングボックス描画用キャンバス

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
        let sceneNo = getCurrentSceneNo(); // シーン番号

        // 初回時のみ
        if (isfirstClick) {
            // ラベル入力欄を追加
            $('#input-area').append('<input id="input-word" type="text" size="25" placeholder="ラベル名を入力して下さい">');
            $('#input-area').append('<div class="add-btn"><p>追加</p></div>');

            isfirstClick = false;
        }        
    
        // 動画表示領域をキャンバスに切り替え
        changeElementNode('canvas', videoId, sceneNo);

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
        let sceneNo = getCurrentSceneNo(); // シーン番号

        // 矩形表示領域をシーン動画に切り替え
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

        // ラベルの強調を終了
        endLabelEmphasis();

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
        let $inputWord = $('#input-word').val();    // 入力単語

        // 検索単語が入力されている時にラベルを追加
        if ($inputWord) {
            // １つもラベルがない時、「このシーンにはラベルは付与されていません。」を削除
            if ($('#labels').children().attr("class") == 'no-label') {
                $('.no-label').remove();
            }
            // ラベルを追加
            let $labels = $('#labels'); // ラベル表示要素
            let labelId = $('.label-item:last').data('labelId') + 1; // ラベルID
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

            let $movieScreen = $('#movie-screen');
            let width = $movieScreen.width();     // 表示領域の幅
            let height = $movieScreen.height();   // 表示領域の高さ
            $movieScreen.append('<canvas id="new-rect-area" width="' + width + '" height="' + height + ';"></canvas>'); // 新規矩形を描画するためのキャンバス
            
            // 新規矩形を描画
            drawNewRectArea($inputWord);

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
    
    // シーン動画とアノテーション用キャンバスを変換する関数
    function changeElementNode(nodeName, videoId, sceneNo) {

        let $movieScreen = $('#movie-screen');  // シーン結果表示領域

        // 表示領域を空にする
        $movieScreen.empty();

        // 第一引数が'canvas'の場合、アノテーション用キャンバスを表示
        if (nodeName == 'canvas') {
            let width = $movieScreen.width();     // 表示領域の幅
            let height = $movieScreen.height();   // 表示領域の高さ
            
            $movieScreen.append('<canvas id="imgae-area" width="' + width + '" height="' + height + ';"></canvas>');    // サムネ画像を描画するためのキャンバス
            $movieScreen.append('<canvas id="rect-area" width="' + width + '" height="' + height + ';"></canvas>');     // バウンディングボックスを描画するためのキャンバス
            $movieScreen.addClass('layer-wrap');
            
            // アノテーション用キャンバスを描画
            // 以下の３つのレイヤーで構成する（右に行くほど上のレイヤーになる）
            // 「サムネ画像用キャンバス」、「矩形描画用キャンバス」、「新規矩形描画用キャンバス」の３レイヤー
            // 「新規矩形描画用キャンバス」はラベル入力した時のみ表示される

            // サムネ画像を描画
            drawImageArea(videoId, sceneNo);

            // 付与済みラベルの矩形を描画
            drawRectArea(videoId, sceneNo);
        }
        // 第一引数が'video'の場合、シーン動画を表示
        else if (nodeName == 'video') {
            let $video = $('<video></video>');  // シーン動画表示用
            $video.attr({
                'src': '../result/scene/' + videoId + '/' + 'scene' + sceneNo + '.mp4', 
                'controls': true,
                'autoplay': true
            });  
            $movieScreen.append($video);
        }
    }

    // サムネ画像を描画する関数
    function drawImageArea(videoId, sceneNo) {
        let imageCanvas = $('#imgae-area')[0];      // サムネ画像を描画するためのキャンバス
        let Context = imageCanvas.getContext('2d'); // CanvasRenderingContext2D オブジェクト

        let canvasWidth = imageCanvas.width;     // キャンバスサイズ（幅）
        let canvasHeight = imageCanvas.height;   // キャンバスサイズ（高さ）

        let thumbnailPath = path.join('../result/thumbnail/', videoId, '/thumbnail' + sceneNo + '.jpg'); // サムネ画像のパス

        // サムネ画像を描画
        let img = new Image();
        img.src = thumbnailPath;
        img.onload = function () {
            Context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
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

    // バウンディングボックスのキャンバスを描画関数
    async function drawRectArea(videoId, sceneNo) {
        rectCanvas = new fabric.Canvas('rect-area');    // バウンディングボックスを描画するためのキャンバス

        let canvasWidth = rectCanvas.width;     // キャンバスサイズ（幅）
        let canvasHeight = rectCanvas.height;   // キャンバスサイズ（高さ）
        let imageWidth = 426;   // 画像サイズ（幅） TODO 描画する画像サイズを取得
        let imgaeHeight = 240   // 画像サイズ（高さ）
        let xMagnification = canvasWidth / imageWidth;   // サイズ倍率(x)
        let yMagnification = canvasHeight / imgaeHeight; // サイズ倍率(y)   

        let objId = 1;     // バウンディングボックスを一意に識別するためのID

        const labelData = await getBoundingBox(videoId, sceneNo);  // ラベルデータ

        // バウンディングボックスを描画
        for (let data of labelData) {
            let labelId = data.label_id;    // ラベルID

            // 物体ラベルの場合のみ描画
            if (labelId.slice(0, 1) == 'N') {
                let labelName = data.label_name_ja; // ラベル名（日本語）
                let score = data.recognition_score; // 認識スコア

                let x = data.x_axis * xMagnification;   // x軸の座標
                    y = data.y_axis * yMagnification;   // y軸の座標
                    w = data.width * xMagnification;    // 幅
                    h = data.height * yMagnification;   // 高さ

                let coordinate = [x, y, w, h]   // 引数にする座標データ
                
                // バウンディングボックスを描画
                drawRect(objId, coordinate, labelName);
                                
                objId += 1;
            }
            
        }

        // ラベルと矩形のID連携
        //console.log($('.label-item[data-label-id=1]').children('h3').text());
        //console.log(rectCanvas.item(arrayRect.indexOf(1))._objects[1])
        /*
        let rectObjects = rectCanvas._objects // 矩形オブジェクトの配列
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
        rectCanvas.on('selection:created', (e) => {    
            let selectedObject = e.selected[0];     
            let selectedRect = selectedObject._objects[0];   // 選択した矩形

            // 矩形の設定を変更
            changeDrawnRect(selectedRect, 'selected');

            // 選択した該当ラベルを強調
            emphasizeLabel(selectedObject.id);

            // [削除]ボタンを追加        
            addDeleteBtn(selectedObject.id);           
        });

        // 選択状態で他の矩形をクリックした時の処理
        rectCanvas.on('selection:updated', (e) => {   
            let deselectedObject = e.deselected[0]; // 選択解除したオブジェクト
            let deselectedRect = deselectedObject._objects[0];   // 選択解除した矩形

            let selectedObject = e.selected[0]; // 選択したオブジェクト
            let selectedRect = selectedObject._objects[0];   // 選択した矩形

            // 矩形の設定を変更
            changeDrawnRect(deselectedRect, 'deselected');
            changeDrawnRect(selectedRect, 'selected');
            
            // 選択した該当ラベルを強調
            emphasizeLabel(selectedObject.id);

            // [削除]ボタンを追加        
            addDeleteBtn(selectedObject.id, deselectedObject.id);  
            let $targetDeleteBtn = $('.label-item[data-label-id=' + deselectedObject.id + ']').children('.delete-btn');
            $targetDeleteBtn.css('opacity', '0');
            
            // 各ラベル要素の下に追加
            $('#labels .label-item[data-label-id=' + selectedObject.id + ']').append('<div class="delete-btn"><span>×</span></div>');
            // [削除]ボタンを表示
            //$('.delete-btn').css('opacity', '1');
            
        });

        // 選択状態で背景をクリックしたときの処理
        rectCanvas.on('before:selection:cleared', (e) => {   
            let deselectedRect = e.target._objects[0];   // 選択解除した矩形

            // 矩形の設定を変更
            changeDrawnRect(deselectedRect, 'deselected');
            
            // ラベルの強調を終了
            endLabelEmphasis();
        });

        
        // 拡大縮小時のテキストボックスのサイズ固定処理
        rectCanvas.on({
            'object:scaling': onChange
        });
        function onChange(obj) {
            let textbox = obj.target.item(1);
            let group = obj.target;
            let scaleX = group.width / (group.width * group.scaleX);
            let scaleY = group.height / (group.height * group.scaleY);
            textbox.set({
                scaleX: scaleX,
                scaleY: scaleY
            });                    
        }

        /*
        function deleteRect(labelId) {
            let rectCanvas = new fabric.rectCanvas('rect-area');
            console.log(rectCanvas);
        
        }
        */
    }

    function drawNewRectArea(labelName) {
        let Canvas = $('#new-rect-area')[0];
        console.log(Canvas)
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
            $('#new-rect-area').remove();

            let coordinate = [DrawingMemory[index-1].x, DrawingMemory[index-1].y, DrawingMemory[index-1].w, DrawingMemory[index-1].h]   // 引数にする座標データ
            let objId = $('.label-item:last').data('labelId');  // オブジェクトID（ラベル表示要素に追加されたID）

            // バウンディングボックスを描画
            drawRect(objId, coordinate, labelName);

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
    }

    function deleteRect(labelId) {

        rectCanvas.remove(rectCanvas._objects[labelId-1]);

    }
    
    // バウンディングボックスを描画する関数
    function drawRect(objId, coordinate, labelName) {
        let x = coordinate[0],
            y = coordinate[1],
            w = coordinate[2],
            h = coordinate[3]; 
        
        // 矩形
        let rect = new fabric.Rect({
            left: x,         // 左
            top: y,          // 上
            width: w,        // 幅
            height: h,       // 高さ
            strokeWidth: 2,  // 線の幅
            stroke: '#0BF',  // 線の色
            fill: 'rgba(174,230,255,0.1)', // 塗潰し色

            hasRotatingPoint: false, // 回転の無効化
            strokeUniform: true      // 拡大縮小時に線の幅を固定   
        });

        // ラベル名のテキストボックス
        let textbox = new fabric.Textbox('\u00a0' + labelName + '\u00a0', {
            left: x + 2,     // 左
            top: y + 2,      // 上
            fontSize: 14,
            fontFamily: 'Arial',
            stroke: '#000',  // アウトラインの色
            strokeWidth: 1,  // アウトラインの太さ
            backgroundColor: 'rgba(174,230,255)', 
        });
        
        // 矩形とテキストボックスをグループ化
        var group = new fabric.Group([rect, textbox], {
            id: objId,
            left: x,
            top: y,
            hasRotatingPoint: false, // 回転の無効化            
            lockScalingFlip: true,    // 裏返しをロック

            // コーナー設定
            cornerColor: '#333',
            cornerSize: 9,
            cornerStyle: 'circle'
        });                
        rectCanvas.add(group);

        // オブジェクトの描画
        rectCanvas.renderAll();
    }
    
    // 描画されたバウンディングボックスの設定を変更（追加）する関数
    // デフォルトは非選択状態とし、選択状態の時に各種変数を更新
    function changeDrawnRect(rect, rectStatus) {
        let rectStrokeWidth = 2;
        let rectstroke = '#0BF';
        let rectFill = 'rgba(174,230,255,0.1)';
        
        // 選択状態の時、変数を更新
        if(rectStatus == 'selected') {
            rectStrokeWidth = 3;    // 線の幅
            rectstroke = '#BF0';    // 線の色
            rectFill = 'rgba(230,255,174,0.5)'; // 塗りつぶし色
        }

        // 変更
        rect.set({ 
            strokeWidth: rectStrokeWidth,  // 線の幅
            stroke: rectstroke, // 線の色
            fill: rectFill,     // 塗潰し色
        }).setCoords();

        // 変更したオブジェクトの描画
        rectCanvas.renderAll();

    }

    // 現在のシーン番号を取得する関数
    // ページ上に表示されている「○○シーン目」から取得
    function getCurrentSceneNo() { 
        return $('#scene-no').text().replace(/[^0-9]/g, ''); // シーン番号
    }

    // 該当ラベルを強調する関数
    function emphasizeLabel(labelId) {
        // 黒に戻す
        endLabelEmphasis();

        // 選択された赤色で
        let $targetLabel = $('.label-item[data-label-id=' + labelId + ']').children('.label');
        $targetLabel.css('border', '2px solid #F33');   // 赤色に変更
    }
    // ラベルの強調を終了する関数
    function endLabelEmphasis() {
        let $allLabel = $('.label-item').children('.label');
        $allLabel.css('border', '1px solid #333');   // 黒色に戻す
    }

    // 該当ラベルに削除ボタンを追加する関数
    function addDeleteBtn(selectedLabelId) {
        let $selectedLabel = $('#labels .label-item[data-label-id=' + selectedLabelId + ']'); // 該当ラベルの要素

        // 全ての削除ボタンを削除

        // まだ追加されていない場合に追加
        if($selectedLabel.children('.delete-btn').length == 0){
            $selectedLabel.append('<div class="delete-btn"><span>×</span></div>');
        }

        // [削除]ボタンを表示
        $('.delete-btn').css('opacity', '1');
    }
}
