import React from 'react';

const Modal = function(props) {
    return (

        <div className="modaloverlay" onClick={props.onClose}>
          <div className="modal" onClick={(e)=>{e.stopPropagation()}}>
              <h3 className="modalhead">
              {props.title}
              </h3>
            {props.children}
          </div>
        </div>
          
    );
}

export default Modal;
