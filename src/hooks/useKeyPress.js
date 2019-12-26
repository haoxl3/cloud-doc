import {useState, useEffect, useRef} from 'react';

const useKeyPress = (targetKeyCode) => {
    const [keyPressed, setKeyPressed] = useState(false);
    // 当按下键时将setKeyPressed置为true,弹起时设为false
    const keyDownHandler = ({keyCode}) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(true);
        }
    }
    const keyUpHandler = ({keyCode}) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(false);
        }
    }
    useEffect(() => {
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        // 卸载事件
        return () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
        }
    }, [])
    return keyPressed
}
export default useKeyPress;