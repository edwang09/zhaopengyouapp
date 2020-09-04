import React from 'react';
import avatar from "../assets/avatar.png"

const Avatar = function(props) {

    return (
        <div className="avatarcontainer">
          <img  className="avatar" src={avatar} alt="avatar" style={{"left":`${props.avatar ? props.avatar*-100 : 0}px`}}/>
        </div>
    );
  }

export default Avatar;
