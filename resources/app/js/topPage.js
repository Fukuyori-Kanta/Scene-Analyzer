
/**
 * DBからアクセス履歴を降順に取得し、直近5件のコンテンツを表示
 * @module showAccessHistory
 */
 exports.showAccessHistory = async function() {
    // --------------------------------------------------
    // アクセス履歴を取得
    // --------------------------------------------------
    const accessHistory = await getAccessHistory();
    
    // --------------------------------------------------
    // アクセス履歴の直近５件を表示
    // --------------------------------------------------
    const displayCount = 5; // 表示件数

    for(let i = 0; i < displayCount; i++) {
        let videoName = accessHistory[i].video_id;   // 動画ID
        let product_name = accessHistory[i].product_name  /// 作品名

        // サムネ画像のパスを取得
        // TODO: パスを取得する関数にする
        let thumbnail = '../result/thumbnail/' + videoName + '/thumbnail1.jpg'
            
        // 表示コンテンツ（サムネイルと作品名）の作成・追加
        // <div>要素を作成
        let $div = $('<div class="item"></div>');

        // <img>要素を追加
        let $img = $('<img data-video-name=' + videoName + ' class="thumbnail" src=' + thumbnail + ' alt="">');
        $($div).append($img);

        // <p>要素を追加
        let $p = $('<p class="video-name" data-video-name=' + videoName + '>' + product_name + '</p>');
        $($div).append($p);

        $('#access-history').append($div);
    }
}

/**
 * トップページから結果詳細画面に遷移する関数
 * トップページ内でサムネもしくは作品名がクリックされた時に、該当の動画ページに遷移する
 * @module transitionToResultShow
 */
exports.transitionToResultShow = function() {
    // --------------------------------------------------
    //  動画がクリックされたら、[result_show.html]に該当の動画名を渡して遷移
    // --------------------------------------------------
    $('#access-history').on('click', function(e) {
        const videoName = e.target.getAttribute('data-video-Name');   // 作品名

        // 動画表示領域クリック時（動画名の取得時）のみ遷移
        if(videoName) {
            location.href = 'result_show.html?name=' +  encodeURIComponent(videoName);
        }
    });
}

/**
 * アクセス履歴を降順に取得する関数
 * @return {Object} accessHistory アクセス履歴
 */
async function getAccessHistory() {
    // 問い合わせするSQL文
    let query = "SELECT works_data.video_id, works_data.product_name " +
                "FROM access_history INNER JOIN works_data ON access_history.video_id = works_data.video_id " + 
                "ORDER BY last_access_time DESC;";

    // 接続・問い合わせ
    let accessHistory = await mydb.query(query);  // アクセス履歴
    
    // 接続終了
    mydb.close();
    
    return accessHistory
}