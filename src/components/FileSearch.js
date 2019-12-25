import React, {useState, useEffect, useRef} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSearch, faTimes} from '@fortawesome/free-solid-svg-icons';

const FileSearch = ({title, onFileSearch}) => {
    const [inputActive, setInputActive] = useState(false);
    const [value, setValue] = useState('');
    let node = useRef(null); // 它将记住上一个节点

    const closeSearch = (e) => {
        e.preventDefault();
        setInputActive(false);
        setValue('');
    }
    useEffect(() => {
        const handleInputEvent = (event) => {
            const {keyCode} = event;
            if (keyCode === 13 && inputActive) {
                onFileSearch(value);
            }
            else if (keyCode === 27 && inputActive) {
                closeSearch(event);
            }
        } 
        // 注册事件
        document.addEventListener('keyup', handleInputEvent);
        // 移除事件
        return () => {
            document.removeEventListener('keyup', handleInputEvent);
        }
    })
    useEffect(() => {
        // 当依赖的inputActive改变时才执行，第二个参数代表它改变时要重复执行useEffect里的代码
        if (inputActive) {
            node.current.focus();
        }
    }, [inputActive])
    return (
        <div className="alert alert-primary d-flex justify-content-between align-items-center">
            {!inputActive &&
                <>
                    <span>{title}</span>
                    <button 
                        type="button" 
                        className="icon-button"
                        onClick={() => {setInputActive(true)}}
                    >
                        <FontAwesomeIcon 
                            title="搜索" 
                            icon={faSearch}
                            size="lg"
                        />
                    </button>
                </>
            }
            {
                inputActive &&
                <>
                    <input 
                        className="form-control" 
                        value={value}
                        ref={node}
                        onChange={(e) => {setValue(e.target.value)}}
                    />
                    <button 
                        type="button" 
                        className="icon-button"
                        onClick={closeSearch}
                    >
                        <FontAwesomeIcon 
                            title="关闭" 
                            icon={faTimes}
                            size="lg"
                        />
                    </button>
                </>
            }
        </div>
    )
}
export default FileSearch;