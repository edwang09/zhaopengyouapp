import React from 'react';
import classNames from "classnames"
import Avatar from "../components/avatar"
import noavatar from "../assets/noavatar.png"
import Poker from "./poker"

const Players = function(props) {
  const pokerNumberDict = {
    "0":"0",
    "1":"1",
    "2":"2",
    "3":"3",
    "4":"4",
    "5":"5",
    "6":"6",
    "7":"7",
    "8":"8",
    "9":"9",
    "t":"10",
    "t1":"J",
    "t2":"Q",
    "t3":"K",
    "ta":"A"
  }
  const playerIndex = props.players.findIndex(player=>player.playerid === props.playerid)
  const cleanplayers = [...[...props.players, null, null, null, null, null].slice(0,6).slice(playerIndex+1), ...[...props.players, null, null, null, null, null].slice(0,6).slice(0,playerIndex) ]
  const playersRender = cleanplayers.map((player, idx)=>{
      if (!player){
        return (
          <div className={`player player${idx}`} key={idx}>
          <div className="playercard">
            <div className="playericon">
              <img src={noavatar} alt="noavatar"/>
            </div>
            等待中。。。
          </div>
        </div>
        )
      }
      const play = props.currentPlay.filter(play=>play.playerid===player.playerid)
      return (
        <div className={`player player${idx}`} key={player.playerid}>
          
          <div className="playercard">

            <div className={classNames({"playericon":true,"turn": player.playerid === props.inTurn })}>
              <Avatar avatar={player.avatar}/>
            </div>
            <div className="playerpoints">
                {player.points.map((card)=>{return card.map((cd)=>{return <Poker small card ={cd}/>})})}
              </div>
            {player.displayName}
          </div>
          <div className="playerstatus">
            <div className={classNames({"playerscore":true,"disconnected": !player.isAlive })}>{pokerNumberDict[player.score]}</div>
            {(player.playerid === props.dealerid || (!props.dealerid && player.playerid===props.tempDealerid)) && <div className="playerdealer">庄</div>}
            {(player.onBoard && player.playerid !== props.dealerid)  && <div className="playeronboard">跟</div>}
          </div>
          <div className = "cardlist">
            {play[0] && play[0].card.map((card, id)=>{return <Poker key={id} small card ={card}/>})}
          </div>
        </div>)
  })
    return (
        <div className="players">
          {playersRender}
        </div>
    );
  }

export default Players;
