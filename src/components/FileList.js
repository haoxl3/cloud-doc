import React, {useState, useEffect, useRef} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEdit, faTrash, faTimes} from '@fortawesome/free-solid-svg-icons';
import {faMarkdown} from '@fortawesome/free-brands-svg-icons';
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';
import useContextMenu from '../hooks/useContextMenu';
import {getParentNode} from '../utils/helper';

const {remote} = window.require('electron');
const {Menu, MenuItem} = remote;

const FileList = ({files, onFileClick, onSaveEdit, onFileDelete}) => {
    const [editStatus, setEditStatus] = useState(false);
    const [value, setValue] = useState('');
    let node = useRef(null);
    const enterPressed = useKeyPress(13);
    const escPressed = useKeyPress(27);
    const closeSearch = (editItem) => {
        setEditStatus(false);
        setValue('');
        // 关闭时删除刚新建的文件
        if (editItem.isNew) {
            onFileDelete(editItem.id);
        }
    };
    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item');
                if (parentElement) {
                    onFileClick(parentElement.dataset.id);
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                console.log('open');
            }
        },
        {
            label: '删除',
            click: () => {
                console.log('open');
            }
        }
    ], '.file-list', [files]);
    useEffect(() => {
        const menu = new Menu();
        menu.append(new MenuItem({
            label: '打开',
            click: () => {
                console.log('open');
            }
        }));
    });
    useEffect(() => {
        const menu = new Menu();
        menu.append(new MenuItem({
            label: '打开',
            click: () => {
                console.log('open');
            }
        }));
        const handleContextMenu = e => {
            menu.popup({window: remote.getCurrentWindow()});
        };
        window.addEventListener('contextmenu', handleContextMenu);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    });
    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus);
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew);
            setEditStatus(false);
            setValue('');
        }
        if (escPressed && editStatus) {
            closeSearch(editItem);
        }
    });
    useEffect(() => {
        const newFile = files.find(file => file.isNew);
        if (newFile) {
            setEditStatus(newFile.id);
            setValue(newFile.title);
        }
    }, [files]);
    useEffect(() => {
        if (editStatus) {
            node.current.focus();
        }
    }, [editStatus]);
    // useEffect(() => {
    //     const handleInputEvent = (event) => {
    //         const {keyCode} = event;
    //         if (keyCode === 13 && editStatus) {
    //             // 寻找file.id和editStatus一样的文件
    //             const editItem = files.find(file => file.id === editStatus)
    //             onSaveEdit(editItem.id, value);
    //             setEditStatus(false);
    //             setValue('');
    //         }
    //         else if (keyCode === 27 && editStatus) {
    //             closeSearch(event);
    //         }
    //     }
    //     // 注册事件
    //     document.addEventListener('keyup', handleInputEvent);
    //     // 移除事件
    //     return () => {
    //         document.removeEventListener('keyup', handleInputEvent);
    //     }
    // })

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li 
                        className="list-group-item row bg-light d-flex align-items-center file-item mx-0"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                    >
                        {(file.id !== editStatus && !file.isNew) &&
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon 
                                        icon={faMarkdown}
                                        size="lg"
                                    />
                                </span>
                                <span 
                                    className="col-6 c-link"
                                    onClick={() => {onFileClick(file.id)}}
                                >
                                    {file.title}
                                </span>
                                <button 
                                    type="button" 
                                    className="icon-button col-2"
                                    onClick={() => {setEditStatus(file.id); setValue(file.title)}}
                                >
                                    <FontAwesomeIcon 
                                        title="编辑"
                                        icon={faEdit}
                                        size="lg"
                                    />
                                </button>
                                <button 
                                    type="button" 
                                    className="icon-button col-2"
                                    onClick={() => {onFileDelete(file.id)}}
                                >
                                    <FontAwesomeIcon 
                                        title="删除"
                                        icon={faTrash}
                                        size="lg"
                                    />
                                </button>
                            </>
                        }
                        {((file.id === editStatus) || file.isNew) &&
                            <>
                                <input 
                                    className="form-control col-10" 
                                    value={value}
                                    ref={node}
                                    placeholder="请输入文件名称"
                                    onChange={(e) => {setValue(e.target.value)}}
                                />
                                <button 
                                    type="button" 
                                    className="icon-button col-2"
                                    onClick={() => {closeSearch(file)}}
                                >
                                    <FontAwesomeIcon 
                                        title="关闭" 
                                        icon={faTimes}
                                        size="lg"
                                    />
                                </button>
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onSaveEdit: PropTypes.func, 
    onFileDelete: PropTypes.func
}
export default FileList;