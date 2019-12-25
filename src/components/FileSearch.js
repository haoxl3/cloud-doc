import React, {useState, useEffect, useRef} from 'react';

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
        <div className="alert alert-primary">
            {!inputActive &&
                <div className="d-flex justify-content-between align-items-center">
                    <span>{title}</span>
                    <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => {setInputActive(true)}}
                    >
                        搜索
                    </button>
                </div>
            }
            {
                inputActive &&
                <div className="row">
                    <input 
                        className="form-control col-8" 
                        value={value}
                        ref={node}
                        onChange={(e) => {setValue(e.target.value)}}
                    />
                    <button 
                        type="button" 
                        className="btn btn-primary col-4"
                        onClick={closeSearch}
                    >
                        关闭
                    </button>
                </div>
            }
        </div>
    )
}
export default FileSearch;