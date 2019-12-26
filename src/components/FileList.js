import React, {useState, useEffect, useRef} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEdit, faTrash} from '@fortawesome/free-solid-svg-icons';
import {faMarkdown} from '@fortawesome/free-brands-svg-icons';
import PropTypes from 'prop-types';

const FileList = ({files, onFileClick, onSaveEdit, onFileDelete}) => {
    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li 
                    className="list-group-item row bg-light d-flex align-items-center file-item"
                    key={file.id}
                >
                    <span className="col-2">
                        <FontAwesomeIcon 
                            icon={faMarkdown}
                            size="lg"
                        />
                    </span>
                    <span className="col-7">{file.title}</span>
                    <button 
                        type="button" 
                        className="icon-button col-1"
                        onClick={() => {}}
                    >
                        <FontAwesomeIcon 
                            title="编辑"
                            icon={faEdit}
                            size="lg"
                        />
                    </button>
                    <button 
                        type="button" 
                        className="icon-button col-1"
                        onClick={() => {}}
                    >
                        <FontAwesomeIcon 
                            title="删除"
                            icon={faTrash}
                            size="lg"
                        />
                    </button>
                </li>
                ))
            }
        </ul>
    )
}

FileList.propTypes = {
    files: PropTypes.array
}
export default FileList;