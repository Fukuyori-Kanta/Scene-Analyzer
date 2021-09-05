// requireの設定
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG, SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');
const path = require('path');
//const { dir } = require('console');
window.jQuery = window.$ = require('jquery');   // electron上でjquery使う場合、ローカルに置かないと機能しない
let { PythonShell } = require('python-shell');
//const { getHeapCodeStatistics } = require('v8');
const mysql = require('mysql');
const { type } = require('os');

const topPageModule = require('../js/top-page-module');             // トップページの処理モジュール
const newAnalysisModule = require('../js/new-analysis-module');     // 新規分析機能のモジュール
const resultListModule = require('../js/result-list-module');       // 結果一覧機能のモジュール
const statisticsModule = require('../js/statistics-module');        // 統計機能のモジュール
const fileOperationModule = require('../js/file-operation-module'); // ファイル操作モジュール 

// MySQLとのコネクションの作成
const mysql_setting = {
    host : 'localhost',
    user : 'root',
    password : 'password',
    database: 'analysis_db'
}
let database = require('../js/result-query-module');
const mydb = new database(mysql_setting); 

// --------------------------------------------------
// HTMLが読み込まれたら（起動時）
// --------------------------------------------------
$(function() {
    // [index.html] に対しての処理
    if($('#index').length) {
        topPageModule.showAccessHistory();
        topPageModule.transitionToResultShow();
    }
    // [exe.html] に対しての処理
    if($('#exe').length) {
        newAnalysisModule.analyzeNewly();
    }
    // [result-list.html] に対しての処理
    if($('#result-list').length) {
        resultListModule.resultListFunc();
    }
    // [result-show.html] に対しての処理
    if($('#result-show').length) {
        resultListModule.resultShowFunc();
    }
    // [statistics.html] に対しての処理
    if($('#statistics').length) {
        // 統計結果のグラフを表示
        statisticsModule.showStatistics();
    }

    // スクロールを禁止する関数
    function noScroll(event) {
        event.preventDefault();
    }
    // ヘッダー右上のハンバーガーメニューの動作
    $('.menu-btn').on('click', function(){
        $('.menu').toggleClass('is-active');
        // メニューがアクティブの時、スクロールを禁止にする
        if($('.menu').attr('class') == 'menu is-active') {
            document.addEventListener('mousewheel', noScroll, { passive: false });
        }
        else {
            document.removeEventListener('mousewheel', noScroll, { passive: false });
        }
    });
    
    // [戻る]ボタンを押したときの処理
    $('.go-back').on('click', function(e) {
        history.back();
    });
    // [進む]ボタンを押したときの処理
    $('.go-forward').on('click', function(e) {
        history.forward();
    });
    // [Reload]ボタンを押したときの処理
    $('.reload').on('click', function(e) {
        window.location.reload(true);
    });
});
