import React, {useState, useEffect, useRef} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSearch, faTimes} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';

const FileSearch = ({title, onFileSearch}) => {
    const [inputActive, setInputActive] = useState(false);
    const [value, setValue] = useState('');
    const enterPressed = useKeyPress(13);
    const escPressed = useKeyPress(27);
    let node = useRef(null); // 它将记住上一个节点

    const closeSearch = () => {
        setInputActive(false);
        setValue('');
        // 关闭搜索时要还原文件
        onFileSearch('');
    }
    useEffect(() => {
        if (enterPressed && inputActive) {
            onFileSearch(value);
        }
        if (escPressed && inputActive) {
            closeSearch();
        }
    })
    useEffect(() => {
        // 当依赖的inputActive改变时才执行，第二个参数代表它改变时要重复执行useEffect里的代码
        if (inputActive) {
            node.current.focus();
        }
    }, [inputActive])
    return (
        <div className="alert alert-primary d-flex justify-content-between align-items-center mb-0">
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
// 用来检查传来的值的类型
FileSearch.propTypes = {
    title: PropTypes.string, // string
    onFileSearch: PropTypes.func.isRequired // function类型且是必传的
}
// 组件添加默认属性
FileSearch.defaultProps = {
    title:'我的云文档'
}
export default FileSearch;