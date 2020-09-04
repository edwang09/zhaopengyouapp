import React from 'react';
import classNames from "classnames"
import Avatar from "../components/avatar"
import Poker from "./poker"

const Lastplays = function(props) {
  const playsRender = props.lastplays.map((play, idx)=>{
      const player = props.playerlist.filter(player=>player.playerid===play.playerid)[0]
      return (
        <div className={classNames({"player":true, "winner": player.playerid === props.winner })}>
          <div className="playercard">
            <div className="playericon">
              <Avatar avatar={player.avatar} />
            </div>
            <p>{player.displayName}</p>
            
          </div>
          <div className = "cardlist">
            {play.card.map((card)=>{return <Poker small card ={card}/>})}
          </div>
        </div>)
  })
    return (
        <div className="lastplays">
          {props.lastplays.length > 0 ? playsRender : "尚无上轮信息"}
        </div>
    );
  }

export default Lastplays;
