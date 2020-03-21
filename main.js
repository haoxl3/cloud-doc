const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const isDev = require('electron-is-dev');
const path = require('path')
const menuTemplate = require('./src/menuTemplate');
const AppWindow = require('./src/AppWindow');
const Store = require('electron-store');
const QiniuManager = require('./src/utils/QiniuManager');
const settingsStore = new Store({name:'Settings'});
let mainWindow;
let settingsWindow;

const createManager = () => {
    const accessKey = settingsStore.get('accessKey');
    const secretKey = settingsStore.get('secretKey');
    const bucketName = settingsStore.get('bucketName');
    return new QiniuManager(accessKey, secretKey, bucketName);
}
app.on('ready', () => {
    const mainWindowConfig = {
        width: 1440,
        height: 768
    };
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl';
    mainWindow = new AppWindow(mainWindowConfig, urlLocation);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    let menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    // 打开一个新的窗口
    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        };
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`;
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
        settingsWindow.on('closed', () => {
            settingsWindow = null;
        });
    });
    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager();
        manager.uploadFile(data.key, data.path).then(data => {
            // 上传成功后将本地持久化存储的文件也更新一下
            console.log('upload success', data);
            mainWindow.webContents.send('active-file-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确');
        })
    })
    ipcMain.on('config-is-saved', () => {
        // 在windows和mac系统位置不同
        let qiniuMenu = process.platform === 'drawin' ? menu.items[3] : menu.items[2];
        // 修改菜单选择状态
        const switchItems = toggle => {
            [1, 2, 3].forEach(number => {
                qiniuMenu.submenu.items[number].enabled = toggle;
            })
        }
        const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key));
        if (qiniuIsConfiged) {
            switchItems(true);
        } else {
            switchItems(false);
        }
    })
});