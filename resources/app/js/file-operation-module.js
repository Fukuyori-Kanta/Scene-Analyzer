const path = require('path');
const fs = require('fs');
const naturalSort = require("javascript-natural-sort");

/**
 * 該当パスのフォルダ内のファイル情報（ファイル名）を返す関数
 * @param  {string}    targetFolderPath 該当パス
 * @return {object} sortedFileList   ファイル名を格納したobject（ソート済み）
 */
exports.getFileList = function(targetFolderPath) {
    // 該当パス直下のファイルやディレクトリ全てがDirentオブジェクトの配列
    const allDirents = fs.readdirSync(targetFolderPath, { withFileTypes: true });

    // Direntオブジェクトからファイル名を取り出す
    let fileList = allDirents.filter(dirent => dirent.isFile()).map(({ name }) => name); // ファイル名の配列

    // ファイル名の配列を自然順ソートする
    let sortedFileList = fileList.sort(naturalSort);    // ソートしたファイル名の配列

    return sortedFileList;
}

/**
 * 与えられた動画ID のサムネ画像のパスを返す関数
 * @param  {string}    VideoName 該当動画ID
 * @return {object}           ファイル名を格納したobject
 */
exports.getThumbnailPath = function(videoName) {
    return path.join('../result/thumbnail/', videoName, '/thumbnail1.jpg');
 }

/**
 * [result]フォルダ内の全動画IDを返す関数
 * @return {object} allVideoID 全動画名（動画ID）
 */
exports.getAllVideoID = function() {
    const dirents = fs.readdirSync(path.join(__dirname, '../result/thumbnail'), { withFileTypes: true });

    const allVideoID = [];  // 全動画名（動画ID）
    for (const dirent of dirents) {
        if (dirent.isDirectory()) {
            allVideoID.push(dirent.name);
        } 
    }

    return allVideoID;
 }