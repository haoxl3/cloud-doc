import React, {useState, useEffect} from 'react';
import './App.css';
import {faPlus, faFileImport, faSave} from '@fortawesome/free-solid-svg-icons';
import SimpleMDE from 'react-simplemde-editor';
import uuidv4 from 'uuid/v4';
import {flattenArr, objToArr, timestampToString} from './utils/helper';
import fileHelper from './utils/fileHelper';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'easymde/dist/easymde.min.css';

import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import useIpcRenderer from './hooks/useIpcRenderer';

const {join, basename, extname, dirname} = window.require('path');
const {remote, ipcRenderer} = window.require('electron');
const Store = window.require('electron-store');
const fileStore = new Store({'name': 'Files Data'});
const settingsStore = new Store({name: 'Settings'});
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key));

const saveFilesToStore = files => {
    const filesStoreObj = objToArr(files).reduce((result, file) => {
        const {id, path, title, createdAt, isSynced, updatedAt} = file;
        result[id] = {
            id,
            path,
            title,
            createdAt
        };
        return result;
    }, {});
    fileStore.set('files', filesStoreObj);
};

function App() {
    const [files, setFiles] = useState(fileStore.get('files') || {});
    const [activeFileID, setActiveFileID] = useState('');
    const [openedFileIDs, setOpenedFileIDs] = useState([]);
    const [unsavedFileIDs, setUnsavedFileIDs] = useState([]);
    const [searchedFiles, setSearchedFiles] = useState([]);
    const filesArr = objToArr(files);
    const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents');
    const activeFile = files[activeFileID];
    const openedFiles = openedFileIDs.map(openID => {
        return files[openID];
    });
    const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr;

    const fileClick = fileID => {
        // 将当前点击的文件高亮
        setActiveFileID(fileID);
        const currentFile = files[fileID];
        const {id, title, path, isLoaded} = currentFile;
        if (!isLoaded) {
            // 如果设置了自动同步，则需要从七牛云上下载文件
            if (getAutoSync()) {
                ipcRenderer.send('download-file', {key: `${title}.md`, path, id});
            } else {
                fileHelper.readFile(currentFile.path).then(value => {
                    const newFile = {...files[fileID], body: value, isLoaded: true};
                    setFiles({...files, [fileID]: newFile});
                });
            }
        }
        // 将打开的文件记录下来
        if (!openedFileIDs.includes(fileID)) {
            setOpenedFileIDs([...openedFileIDs, fileID]);
        }
    };
    const tabClick = fileID => {
        setActiveFileID(fileID);
    };
    const tabClose = id => {
        const tabsWithout = openedFileIDs.filter(fileID => fileID !== id);
        setOpenedFileIDs(tabsWithout);
        // 关闭后自动将第一个高亮，如果没有打开的文件则置空
        if (tabsWithout.length > 0) {
            setActiveFileID(tabsWithout[0]);
        }
        else {
            setActiveFileID('');
        }
    };
    // 文件更新时的方法
    const fileChange = (id, value) => {
        if (value !== files[id].body) {
            // 不可直接修改State，需要新建一个
            const newFile = {...files[id], body: value};
            setFiles({...files, [id]: newFile});
            // 记录下来未保存的文件的id，并存入unsavedIDs
            if (!unsavedFileIDs.includes(id)) {
                setUnsavedFileIDs([...unsavedFileIDs, id]);
            }
        }
    };
    const deleteFile = id => {
        // 防止文本框处于焦点状态下，未保存时就要删除文件
        if (files[id].isNew) {
            // delete files[id];
            // 上面直接操作了files，属于不规范写法，但重新复制一个files太麻烦，可用ES6
            const {[id]: value, ...afterDelete} = files;
            setFiles(afterDelete);
        }
        else {
            fileHelper.deleteFile(files[id].path).then(() => {
                const {[id]: value, ...afterDelete} = files;
                setFiles(afterDelete);
                saveFilesToStore(afterDelete);
                // 删除时如果文件在右侧已打开，则要关闭了它
                tabClose(id);
            });
        }
    };
    const updateFileName = (id, title, isNew) => {
        const newPath = isNew ? join(savedLocation, `${title}.md`)
        : join(dirname(files[id].path), `${title}.md`);
        const modifiedFile = {...files[id], title, isNew: false, path: newPath};
        const newFiles = {...files, [id]: modifiedFile};
        // 新建或修改
        if (isNew) {
            fileHelper.writeFile(newPath, files[id].body).then(() => {
                setFiles(newFiles);
                // 持久化新建的文件
                saveFilesToStore(newFiles);
            });
        }
        else {
            const oldPath = files[id].path;
            fileHelper.renameFile(oldPath, newPath).then(() => {
                setFiles(newFiles);
                // 持久化修改的文件
                saveFilesToStore(newFiles);
            });
        }
    };
    const fileSearch = keyword => {
        const newFiles = filesArr.filter(file => file.title.includes(keyword));
        setSearchedFiles(newFiles);
    };
    const createNewFile = () => {
        const newID = uuidv4();
        const newFile = {
            id: newID,
            title: '',
            body: '## 请输入内容',
            createdAt: new Date().getTime(),
            isNew: true
        };
        setFiles({...files, [newID]: newFile});
    };
    const saveCurrentFile = () => {
        const {path, body, title} = activeFile;
        fileHelper.writeFile(path, body).then(() => {
            setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id));
            // 如果自动保存被勾选，则上传文件
            if (getAutoSync()) {
                ipcRenderer.send('upload-file', {key: `${title}.md`, path})
            }
        });
    };
    const importFiles = () => {
        remote.dialog.showOpenDialog({
            title: '选择导入的Markdown文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                {name: 'Markdown files', extensions: ['md']}
            ]
        }).then((importFiles) => {
            let paths = importFiles.filePaths;
            if (Array.isArray(paths)) {
                // 过滤掉已导入的同名文件
                const filteredPaths = paths.filter(path => {
                    const alreadyAdded = Object.values(files).find(file => {
                        return file.path === path;
                    });
                    return !alreadyAdded;
                });
                // 将导入的文件转成这样的格式：[{id: '', path: '', title: ''}]
                const importFilesArr = filteredPaths.map(path => {
                    return {
                        id: uuidv4(),
                        title: basename(path, extname(path)),
                        path
                    };
                });
                // 获取新的files文件数组
                const newFiles = {...files, ...flattenArr(importFilesArr)};
                // 持久化导入的文件
                setFiles(newFiles);
                saveFilesToStore(newFiles);
                if (importFilesArr.length > 0) {
                    remote.dialog.showMessageBox({
                        type: 'info',
                        title: `成功导入了${importFilesArr.length}个文件`,
                        message: `成功导入了${importFilesArr.length}个文件`
                    });
                }
            }
        }).catch(err => {
            console.log(err);
        });
    };
    const activeFileUploaded = () => {
        const {id} = activeFile;
        const modifiedFile = {...files[id], isSynced: true, updatedAt: new Date().getTime()};
        const newFiles = {...files, [id]: modifiedFile};
        setFiles(newFiles);
        saveFilesToStore(newFiles);
    }
    const activeFileDownloaded = (event, message) => {
        const currentFile = files[message.id];
        const {id, path} = currentFile;
        fileHelper.readFile(path).then(value => {
            let newFile;
            if (message.status === 'download-success') {
                newFile = {...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() };
            } else {
                newFile = {...files[id], body: value, isLoaded: true};
            }
            const newFiles = {...files, [id]: newFile};
            setFiles(newFiles);
            saveFilesToStore(newFiles);
        })
    }
    useIpcRenderer({
        'create-new-file': createNewFile,
        'import-file': importFiles,
        'save-edit-file': saveCurrentFile,
        'active-file-uploaded': activeFileUploaded,
        'file-downloaded': activeFileDownloaded
    });
    return (
        <div className="App container-fluid px-0">
            <div className="row no-gutters">
                <div className="col-3 bg-light left-panel">
                <FileSearch 
                    title="我的云文档"
                    onFileSearch={fileSearch}
                />
                <FileList
                    files={fileListArr}
                    onFileClick={fileClick}
                    onFileDelete={deleteFile}
                    onSaveEdit={updateFileName}
                >
                </FileList>
                <div className="row no-gutters button-group">
                    <div className="col">
                    <BottomBtn
                        text="新建"
                        colorClass="btn-primary"
                        icon={faPlus}
                        onBtnClick={createNewFile}
                    />
                    </div>
                    <div className="col">
                    <BottomBtn
                        text="导入"
                        colorClass="btn-success"
                        icon={faFileImport}
                        onBtnClick={importFiles}
                    />
                    </div>
                </div>
                </div>
                <div className="col-9 right-panel">
                {!activeFile &&
                    <div className="start-page">
                        选择或者创建新的Markdown文档
                    </div>
                }
                {activeFile &&
                    <>
                        <TabList
                            files={openedFiles}
                            activeId={activeFileID}
                            unsaveIds={unsavedFileIDs}
                            onTabClick={tabClick}
                            onCloseTab={tabClose}
                        />
                        <SimpleMDE
                            key={activeFile && activeFile.id}
                            value={activeFile && activeFile.body}
                            onChange={value => {fileChange(activeFile.id, value)}}
                            options={{
                                minHeight: '515px'
                            }}
                        />
                        { activeFile.isSynced &&
                            <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updatedAt)}</span>
                        }
                    </>
                }
                </div>
            </div>
        </div>
    );
}

export default App;
