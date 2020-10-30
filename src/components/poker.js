import React from 'react';
import classNames from "classnames"
import './poker.css';
import C from '../assets/club.png';
import D from '../assets/diamond.png';
import H from '../assets/heart.png';
import S from '../assets/spade.png';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
class Poker extends React.Component {

  render(){
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
    const suit = this.props.card.slice(0,1)
    const Number = pokerNumberDict[this.props.card.slice(1)]
    let suitRender
    if (suit === "C"){
        suitRender = <img src={C} alt="C"/>
    }else if (suit === "D"){
        suitRender = <img src={D} alt="D"/>
    }else if (suit === "H"){
        suitRender = <img src={H} alt="H"/>
    }else if (suit === "S"){
        suitRender = <img src={S} alt="S"/>
    } 
    if(this.props.forbidden && this.props.picked) this.props.onPick()
    return (
        <div 
        className={classNames({
            "pokercontainer":true,
            "small":this.props.small,
            "main":this.props.main,
            "forbidden":this.props.forbidden,
            "point": (Number==="5" ||Number==="10" ||Number==="K")
        })} 
            style={{ zIndex:`${this.props.sequence}`}} >
            {suit!=="J" &&
                (<div className={classNames({"pokercard":true, "picked":this.props.picked})}  
                    style={{ zIndex:`${this.props.sequence}`}}
                    onClick={(e)=>{if (!this.props.forbidden && this.props.onPick) this.props.onPick()}}>
                    <div className="pokersuit">{suitRender}</div>
                    <div className="pokernumber" style={{color:((suit==="H"||suit==="D")?"red":"black")}} >{Number}</div>
                    {this.props.main && <div className="pokermain" ><FontAwesomeIcon icon={ faStar } /></div>}
                </div>)
            }
            {suit==="J" &&
                (<div  className={classNames({"pokercard":true, "picked":this.props.picked})} 
                    style={{ zIndex:`${this.props.sequence}`}}
                    onClick={(e)=>{if (!this.props.forbidden && this.props.onPick) this.props.onPick()}}>
                    <div className="pokerjoker" style={{color:(Number==="0"?"red":"black")}}>JOKER</div>
                    {this.props.main && <div className="pokermain" ><FontAwesomeIcon icon={ faStar } /></div>}
                </div>)
            }
        </div>
    );
  }
}

export default Poker;
