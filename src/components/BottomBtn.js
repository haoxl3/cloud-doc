import React from 'react'
import PropTypes from 'prop-types'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

const BottomBtn = ({text, colorClass, icon, onBtnClick}) => (
    <button
        type="button"
        className={`btn btn-block no-border ${colorClass}`}
        onClick={onBtnClick}
    >
        <FontAwesomeIcon 
            className="mr-2"
            size="lg" 
            icon={icon}
        />
        {text}
    </button>
)
// 约束传来的参数类型
BottomBtn.propTypes = {
    text: PropTypes.string,
    colorClass: PropTypes.string,
    icon: PropTypes.element.isRequired,
    onBtnClick: PropTypes.func
}
// 给属性添加默认值
BottomBtn.defaultProps = {
    text: '新建'
}
export default BottomBtn