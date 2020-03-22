const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const isDev = require('electron-is-dev');
const path = require('path')
const menuTemplate = require('./src/menuTemplate');
const AppWindow = require('./src/AppWindow');
const Store = require('electron-store');
const QiniuManager = require('./src/utils/QiniuManager');
const settingsStore = new Store({name:'Settings'});
const fileStore = new Store({name: 'Files Data'});
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
    });
    ipcMain.on('download-file', (event, data) => {
        const manager = createManager();
        const filesObj = fileStore.get('files');
        const {key, path, id} = data;
        manager.getStat(data.key).then(resp => {
            console.log('resp', resp);
            console.log('filesObj', filesObj[data.id]);
            // 七牛云上面用的纳秒时间，所以要转换
            const serverUpdatedTime = Math.round(resp.putTime / 10000);
            console.log('qiniu', serverUpdatedTime);
            const localUpdatedTime = filesObj[id].updatedAt; // 缺少属性updatedAt
            console.log('local', localUpdatedTime);
            // 如果本地时间比七牛云上面时间小或者没有，则从七牛上下载文件
            if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                manager.downloadFile(key, path).then(() => {
                    mainWindow.webContents.send('file-downloaded', {status: 'download-success', id});
                })
            } else {
                mainWindow.webContents.send('file-downloaded', {status: 'no-new-file', id});
            }
        }, error => {
            console.log(error);
            if (error.statusCode === 612) {
                mainWindow.webContents.send('file-downloaded', {status: 'no-file', id})
            }
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
    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true);
        const manager = createManager();
        const filesObj = fileStore.get('files') || {};
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const file = filesObj[key];
            return manager.uploadFile(`${file.title}.md`, file.path);
        });
        Promise.all(uploadPromiseArr).then(result => {
            console.log(result);
            dialog.showMessageBox({
                type: 'info',
                title: '上传成功',
                message: `成功上传了${result.length}个文件`
            });
            mainWindow.webContents.send('files-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确');
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false);
        })
    })
});