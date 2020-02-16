const {remote} = require('electron');
const Store = require('electron-store');
const settingsStore = new Store({name: 'Settings'});

const $ = id => {
    return document.getElementById(id);
};

// DOMContentLoaded同JQ的ready类似
document.addEventListener('DOMContentLoaded', () => {
    let savedLocation = settingsStore.get('savedFileLocation');
    if (savedLocation) {
        $('saved-file-location').value = savedLocation;
    }
    $('select-new-loaction').addEventListener('click', () => {
        remote.dialog.showOpenDialog({
            properties: ['openDirectory'],
            message: '选择文件的存储路径'
        }, path => {
            if (Array.isArray(path)) {
                $('saved-file-location').value = path[0];
                savedLocation = path[0];
            }
        });
    });
    $('settings-form').addEventListener('submit', () => {
        settingsStore.set('savedFileLocation', savedLocation);
        // 关闭当前窗口
        remote.getCurrentWindow().close();
    });
});