const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;
app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL("file://" + __dirname + "/html/index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  
  // メニューバーを削除
  //mainWindow.setMenu(null);
  /*
  // 開発者ツールが開かれた場合
  mainWindow.webContents.on('devtools-opened', () => {
    // 開発者ツールを閉じる
    mainWindow.webContents.closeDevTools();
  });
  */
});