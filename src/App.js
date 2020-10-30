import React from 'react';
import classNames from "classnames"
import './App.css';
import './main.css';
import Poker from "./components/poker"
import Ticket from "./components/ticket"
import Modal from "./components/modal"
import Players from "./components/players"
import Lastplays from "./components/lastplays"
import Avatar from "./components/avatar"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faHistory, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { URL, ADHELPER, GAMESTATUS, STATUS, pokerNumberDict, TICKTES } from './constants'
import Play from "./assets/play.wav"
import Win from "./assets/win.wav"
import Lose from "./assets/lose.wav"
import Turn from "./assets/turn.wav"
import Start from "./assets/start.wav"
import Maincall from "./assets/maincall.wav"
let CONNECTIONTIMEOUT

class App extends React.Component {
  constructor(props) {
    super(props);
    this.audioPlay = React.createRef();
    this.audioWin = React.createRef();
    this.audioLose = React.createRef();
    this.audioTurn = React.createRef();
    this.audioStart = React.createRef();
    this.audioMaincall = React.createRef();
    this.state = {
      connection: false, 
      control:true,
      roomList:[],
      displayName:"",
      avatar:Math.floor(Math.random()*24),
      roomName:"",
      pickedCard:[],
      pickedDumpCard:[],
      callableMain:[],
      handCard :[],
      validCard : false,
      dumpableCard : false,
      ticket:TICKTES
    }
  }
  ws = new WebSocket(URL);
  componentDidMount(){
    let self = this
    this.ws.onopen=function () {
      self.setState({connection: true})
      if (sessionStorage.getItem('playerid') && sessionStorage.getItem('displayName') ){
        const playerid = sessionStorage.getItem('playerid')
        const displayName = sessionStorage.getItem('displayName')
        self.registerPlayer({playerid})
        self.setState({displayName,playerid})
        if (sessionStorage.getItem('roomid')){
          self.joinRoom(sessionStorage.getItem('roomid'))
        }
      }
    }
    this.ws.onmessage=function(res) {
      if (res.data.split(":")[0]==="ping") {
        clearTimeout(CONNECTIONTIMEOUT);
        self.ws.send(`pong:${res.data.split(":")[1]}`)
        CONNECTIONTIMEOUT = setTimeout(() => { this.setState({connection:false}) }, 5000);
      }else{
        self.handleSocketMessage(JSON.parse(res.data))
      }
    }
    this.ws.onclose=function(data) {
      self.setState({connection:false})
      this.ws = new WebSocket(URL);
      self.showError("连接断开，正在重连")
    }
    this.ws.onerror=function(data) {
      self.setState({connection:false})
      this.ws = new WebSocket(URL);
      self.showError("连接错误，正在重连")
    }
  }

  sendSocket(action, payload){
    if (this.ws && this.state.connection){
      this.ws.send(JSON.stringify({
        action,
        playerid: this.state.playerid,
        roomid: (this.state.currentRoom ? this.state.currentRoom.roomid : null),
        payload
      }))
    }else{
      console.log("error with websocket connection.")
    }
  }
  registerPlayer(payload){
    if (this.state.displayName || payload){
      if (!payload){
        payload={displayName: this.state.displayName, avatar: this.state.avatar}
        sessionStorage.setItem('displayName', this.state.displayName);
      }
      this.sendSocket("register player", payload)
    }else{
      this.showError("请输入名字！")
    }
  }
  createRoom(){
    const payload={roomName: this.state.roomName}
    this.sendSocket("create room",payload)
  }
  joinRoom(roomid){
    this.sendSocket("join room",{roomid})
  }
  leaveRoom(){
    if (this.state.currentRoom){
      this.sendSocket("leave room")
      sessionStorage.removeItem('roomid')
      this.setState({modal:null})
    }
  }
  startGame(){
    this.setState({modal:null})
    this.sendSocket("start game")
  }
  mainCall(main){
    this.sendSocket("main call",{ main})
    this.setState({callableMain:[]})
  }
  handleSocketMessage(data){
    const {action} = data
    console.log(data)
    switch (action) {
      case "register player":
        sessionStorage.setItem('playerid', data.playerid);
        this.setState({playerid: data.playerid, handCard: data.handCard})
      break;
      case "create room":
        sessionStorage.setItem('roomid', data.room.roomid);
        this.setState({currentRoom: data.room})
      break;
      case "list rooms":
        this.setState({roomList: data.roomList})
      break;
      case "refresh room":
        this.setState({currentRoom: data.room})
      break;
      case "leave room":
        this.setState({currentRoom: null})
      break;
      case "join room":
        sessionStorage.setItem('roomid', data.room.roomid);
        this.setState({currentRoom: data.room},()=>{
          this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})})
      break;
      case "start game":
        this.audioStart.current.play()
        this.setState({currentRoom: data.room, modal:null, handCard:[]})
      break;
      case "main call":
        this.audioMaincall.current.play()
        this.setState({currentRoom: data.room, callableMain: this.getCallablemain( this.state.handCard, data.room.mainCalls[0].card) })
      break;
      case "main call failed":
        this.showMessage("叫主失败")
        this.setState({currentRoom: data.room})
      break;
      case "start maincall":
        this.setState({currentRoom: data.room})
      break;
      case "countdown main":
        this.setState({message:"叫主倒计时："+data.room.countdown})
      break;
      case "bury": 
        this.setState({buryingCards: true, pickedCard:[]})
        this.pushCard(data.card)
        this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})
      break;
      case "start bury":
        this.showMessage("庄家埋牌！")
        this.setState({currentRoom: data.room, callableMain:[]})
        this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})
      break;
      case "start ticketcall":
        this.showMessage("庄家叫队友！")
        this.setState({currentRoom: data.room})
      break;
      case "start play":
        this.audioStart.current.play()
        this.showMessage("对战开始！")
        this.setState({currentRoom: data.room})
      break;
      case "play":
        if (data.room.inTurn === this.state.playerid){
          this.audioTurn.current.play()
        }else{
          this.audioPlay.current.play()
        }
        this.setState({currentRoom: data.room},()=>{
          this.validateCard()
        })
      break;
      case "reasign":
        this.showMessage("上轮结果已修改！")
        this.setState({currentRoom: data.room, modal:null})
      break;
      case "rescore":
        this.showMessage("玩家级数已修改！")
        this.setState({currentRoom: data.room, modal:null})
      break;
      case "revert play":
        this.showMessage("重置本轮！")
        this.setState({currentRoom: data.room, modal:null})
      break;
      case "revert":
        this.setState({handCard: data.handCard, pickedCard:[]},()=>{
          this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})})
      break;
      case "failed dump":
        this.showMessage("甩牌失败！")
        if (data.room.dumpCard.playerid !== this.state.playerid){
          this.setState({currentRoom: data.room, modal: "dump"})
        }
      break;
      case "dump failed":
        this.setState({handCard: data.handCard, pickedCard:[]},()=>{
          this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})})
      break;
      case "succeed dump":
        this.showMessage("甩牌成功！")
        if (data.room.dumpCard.playerid !== this.state.playerid){
          this.setState({currentRoom: data.room})
        }
      break;
      case "dump succeed":
        this.setState({handCard: data.handCard, pickedCard:[]},()=>{
          this.setState(({handCard})=>{return {handCard: this.sortHand(handCard, true)}})})
      break;
      case "end":
        const onBoard = data.room.players.filter(p=>p.playerid===this.state.playerid)[0].onBoard
        if ((onBoard && !data.room.win)||(!onBoard && data.room.win)){
          this.audioWin.current.play()
        }else{
          this.audioLose.current.play()
        }
        this.showMessage("本局结束，开始结算")
        this.setState({currentRoom: data.room})
        setTimeout(()=>{this.setState({modal: "end"})},1500)
      break;
      case "reset session":
        this.setState({currentRoom: null,playerid:null,displayName:""})
        sessionStorage.removeItem('playerid') 
        sessionStorage.removeItem('displayName')
        sessionStorage.removeItem('roomid')
      break;
      case "reset room":
        this.setState({currentRoom: null})
        sessionStorage.removeItem('roomid')
      break;
      
      case "deal":
        if (data.card){
          this.pushCard(data.card)
        }
        this.setState({currentTurn :data.playerid })
      break;
      default:
        break;
    }
  }
  getCallablemain(handCard, mainCall){
    console.log("get callable main")
    if (!handCard) handCard = this.state.handCard
    if (!mainCall) mainCall = this.state.currentRoom.mainCalls[0] ? this.state.currentRoom.mainCalls[0].card : []
    const mainNumber = this.state.currentRoom.mainNumber
    const mainSuit = this.state.currentRoom.mainSuit
    const currentCount = mainCall ? mainCall.length : 0
    if (this.state.currentRoom.tempDealerid === this.state.playerid){
      if (handCard.filter(card=>card===mainCall[0]).length <= currentCount) return []
      if (handCard.filter(card=>card===mainCall[0]).length === currentCount + 1) return [[mainCall[0]]]
      return [[mainCall[0]], [mainCall[0], mainCall[0]]]
    }
    if (mainSuit==="J"){
      if (mainCall[0]==="J0") return []
      if (handCard.filter(card=>card==="J0").length <3) return []
      if (handCard.filter(card=>card==="J0").length ===3) return [handCard.filter(card=>card==="J0")]
      return [handCard.filter(card=>card==="J0"), handCard.filter(card=>card==="J0").slice(0,3)]
    }
    const summary = handCard.filter(card=>card.slice(0,1)==="J" || (card.slice(0,1)!=="J" && card.slice(1)===mainNumber && card.slice(0,1)!==mainSuit))
    .reduce((obj, itm)=>{
      if (obj[itm]){
        return {
          ...obj,
          [itm]: obj[itm]+1,
        };
      }
      return {
        ...obj,
        [itm]: 1,
      };
    },{})
    const result =  Object.keys(summary).reduce((arry, key)=>{
      if (summary[key] > currentCount && (key.slice(0,1)!=="J" || (key.slice(0,1)==="J" && summary[key]>2))){
        switch (summary[key]-currentCount) {
          case 4:
            return [...arry, Array(summary[key]).fill(key), Array(summary[key]-1).fill(key), Array(summary[key]-2).fill(key), Array(summary[key]-3).fill(key), ]
          case 3:
            return [...arry, Array(summary[key]).fill(key), Array(summary[key]-1).fill(key), Array(summary[key]-2).fill(key)]
          case 2:
            return [...arry, Array(summary[key]).fill(key), Array(summary[key]-1).fill(key)]
          case 1:
            return [...arry, Array(summary[key]).fill(key)]
        }
      }
      return arry
    },[])
    console.log(result)
    return result
  }
  sortHand(handCard, final){
    if (!handCard) handCard = this.state.handCard
    let normalCard = handCard
    let mainCard = [
      ...normalCard.filter(a=>a.slice(0,1)==="J").sort(),
      ...normalCard.filter(a=>a.slice(1)===this.state.currentRoom.mainNumber && a.slice(0, 1)===this.state.currentRoom.mainSuit).sort(),
      ...normalCard.filter(a=>a.slice(1)===this.state.currentRoom.mainNumber && a.slice(0, 1)!==this.state.currentRoom.mainSuit).sort()
    ]
    normalCard = normalCard.filter(a=>a.slice(0,1)!=="J" && a.slice(1)!==this.state.currentRoom.mainNumber).sort()
    if (final){
      mainCard = [
        ...mainCard,
        ...normalCard.filter(a=>a.slice(0, 1)===this.state.currentRoom.mainSuit && a.slice(1)!==this.state.currentRoom.mainNumber ).sort().reverse()
      ]
      normalCard = normalCard.filter(a=>a.slice(0, 1)!==this.state.currentRoom.mainSuit).sort()
    }
    let sortedHand
    if (this.state.currentRoom.mainSuit === "S" || this.state.currentRoom.mainSuit === "D" ){
      sortedHand = [ 
        ...mainCard,
        ...normalCard.filter(a=>a.slice(0,1)==="S").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="H").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="C").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="D").sort().reverse(),
      ]
    }else{
      sortedHand = [ 
        ...mainCard,
        ...normalCard.filter(a=>a.slice(0,1)==="H").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="S").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="D").sort().reverse(),
        ...normalCard.filter(a=>a.slice(0,1)==="C").sort().reverse(),
      ]
    }
    
    return sortedHand
  }
  pushCard(cards){
    let sortedHand 
    if (Array.isArray(cards)){
      sortedHand = this.sortHand([...this.state.handCard, ...cards])
      this.setState({handCard:sortedHand })
    }else{
      sortedHand = this.sortHand([...this.state.handCard, cards])
      this.setState({handCard: sortedHand})
    }
    const callableMain = this.getCallablemain(sortedHand)
    this.setState({callableMain})
  }
  pickDumpCard(idx){
    const cardIndex =this.state.pickedDumpCard.indexOf(idx)
    let pickedDumpCard
    if (cardIndex>-1){
      pickedDumpCard = this.state.pickedDumpCard.filter((card,id)=>id!==cardIndex)
    }else{
      pickedDumpCard = [...this.state.pickedDumpCard, idx]
    }
    this.setState({pickedDumpCard})
  }
  pickCard(idx){
    
    const cardIndex =this.state.pickedCard.indexOf(idx)
    let pickedCard
    if (cardIndex>-1){
      pickedCard = this.state.pickedCard.filter((card,id)=>id!==cardIndex)
      this.setState({pickedCard},()=>{
        this.validateCard()
      })
    }else{
      pickedCard = [...this.state.pickedCard, idx]
      this.setState({pickedCard},()=>{
        this.validateCard()
      })
    }
  }
  buryCard(){
    const picked = this.state.handCard.filter((card,idx)=>this.state.pickedCard.indexOf(idx)>-1)
    const lefted = this.state.handCard.filter((card,idx)=>this.state.pickedCard.indexOf(idx)===-1)
    if (picked.length===6){
      this.setState({handCard:lefted, pickedCard:[]})
      this.sendSocket("bury",{card:picked,lefted:lefted})
    }else{
      this.showError("埋牌违规，请重新选择。")
    }
  }
  handleTicketChange(field,value){
    this.setState({ticket: {...this.state.ticket, [field]:value}})
  }
  sendTicket(){
    const card1= this.state.ticket.suit1.slice(0,1)==="J" ? this.state.ticket.suit1 : (this.state.ticket.suit1+this.state.ticket.number1)
    const card2= this.state.ticket.suit2.slice(0,1)==="J" ? this.state.ticket.suit2 : (this.state.ticket.suit2+this.state.ticket.number2)
    const forbidenCard = this.state.currentRoom.mainCalls.map(call=>call[0])
    if (forbidenCard.indexOf(card1)===-1 && forbidenCard.indexOf(card2)===-1 && (card1!==card2 || this.state.ticket.sequence1 !== this.state.ticket.sequence2)){
      const ticket = [
        {sequence:this.state.ticket.sequence1, card : card1 },
        {sequence:this.state.ticket.sequence2, card : card2 }
      ]
      this.sendSocket("ticket",{ticket})
    }else{
      this.showError("船票违规，请重新选择。")
    }
  }
  showMessage(message){
    this.setState({message})
    setTimeout(()=>{
      this.setState({message:null})
    },1500)
  }
  showError(error){
    this.setState({error})
    setTimeout(()=>{
      this.setState({error:null})
    },1500)
  }
  playCard(){
    const handCard = this.state.handCard
    const picked = handCard.filter((card,idx)=>this.state.pickedCard.indexOf(idx)>-1)
    const lefted = handCard.filter((card,idx)=>this.state.pickedCard.indexOf(idx)===-1)
    if(this.state.dumpableCard && !this.state.validCard){
      this.setState({handCard:lefted, pickedCard:[], dumpableCard:false, validCard:false})
      this.sendSocket("play",{card:picked, lefted:lefted, last: lefted.length===0, dump:true})
    }else if (this.state.validCard){
      this.setState({handCard:lefted, pickedCard:[], dumpableCard:false, validCard:false})
      this.sendSocket("play",{card:picked, lefted:lefted, last: lefted.length===0})
    }else {
      this.showError("出牌违规，请重新选择。")
    }
  }
  isHost(){
    return (this.state.currentRoom && this.state.playerid===this.state.currentRoom.hostid)
  }
  isStarter(){
    console.log(!this.state.currentRoom.currentPlay.length)
    console.log(this.state.currentRoom && (!this.state.currentRoom.currentPlay || !this.state.currentRoom.currentPlay.length || this.state.currentRoom.currentPlay.length===6))
    return this.state.currentRoom && (!this.state.currentRoom.currentPlay || !this.state.currentRoom.currentPlay.length || this.state.currentRoom.currentPlay.length===6)
  }
  isMain(card){
    if (!this.state.currentRoom) return false
    return (card.slice(1)===this.state.currentRoom.mainNumber || card.slice(0, 1)===this.state.currentRoom.mainSuit || card.slice(0, 1)==="J")
  }
  isForbidden(card){
    if (!this.state.currentRoom.currentPlay || this.state.currentRoom.currentPlay.length===0 || this.state.currentRoom.currentPlay.filter(p=>p.playerid===this.state.playerid).length>0){
      return false
    }
    const init = this.state.currentRoom.currentPlay[0].card
    let suit = init[0].slice(0,1)
    if (this.isMain(init[0]) && this.state.handCard.filter(cd=>this.isMain(cd)).length>=init.length){
      return !this.isMain(card)
    }
    if (!this.isMain(init[0]) && this.state.handCard.filter(cd=>(cd.slice(0,1)===suit && !this.isMain(cd))).length>=init.length){
      return card.slice(0,1)!==suit || this.isMain(card)
    }
    return false
  }

  validateCard(picked, handCard, isStarter){
    if (!handCard) handCard = this.state.handCard
    if (!isStarter) isStarter = this.isStarter()
    if (!picked) picked = this.state.pickedCard.map(index=>handCard[index])
    let validity 
    if (picked.length === 0){
      validity = false
    }else if (isStarter){
      validity = this.validateStartCard(picked, handCard)
    }else{
      const thisPlay = this.state.currentRoom.currentPlay[0].card
      const samesuitCard = handCard.filter(card=>(
        (this.isMain(card) && this.isMain(thisPlay[0])) || 
        ((!this.isMain(card) && !this.isMain(thisPlay[0]) && card.slice(0,1)===thisPlay[0].slice(0,1)))
      ))
      console.log("current play, you are the follower")
      validity = this.validateFollowCard(thisPlay, picked, samesuitCard)
    }
    this.setState({
      validCard : validity, 
      dumpableCard: (isStarter && picked.length > 0 && picked.every(c=>(!this.isMain(c) && c.slice(0,1)===picked[0].slice(0,1))))
    })
    return validity
  }
  validateStartCard(pickedCard, handCard){
    const pickedCardSummary = this.Summarize(pickedCard)
    const pickedCardSize = pickedCardSummary.size
    const pickedCardPart = pickedCardSummary.part[pickedCardSize]
    const pickedCardTlj = pickedCardSummary.tlj[pickedCardSize]
    return (pickedCardSize===1 && pickedCard.length===1) || (pickedCard.length === pickedCardSize*pickedCardTlj && pickedCardTlj===pickedCardPart)
  }
  validateFollowCard(startCard, pickedCard, handCard){
    if (startCard.length !== pickedCard.length) {
      console.log("length invalide")
      return false
    }
    if (startCard.length >= handCard.length) {
      return handCard.filter(card=>pickedCard.indexOf(card)===-1).length === 0
    }
    const startCardSummary = this.Summarize(startCard)
    const pickedCardSummary = this.Summarize(pickedCard)
    const handCardSummary = this.Summarize(handCard)
    if (startCardSummary.size === 1 || handCardSummary.size === 1) return true
    if (startCardSummary.size === 2) {
      console.log("size 2")
      return ((pickedCardSummary.part[22]+pickedCardSummary.part[3]) === startCardSummary.part[2] || (pickedCardSummary.part[22]+pickedCardSummary.part[3]) === (handCardSummary.part[22]+ handCardSummary.part[3])) 
        && 
        (pickedCardSummary.tlj[2] === startCardSummary.tlj[2] || pickedCardSummary.tlj[2] === handCardSummary.tlj[2])
    }
    if (startCardSummary.size === 3){
      console.log("size 3")
      if(!(
        ((pickedCardSummary.part[4]+pickedCardSummary.part[3]) >= startCardSummary.part[3] || (pickedCardSummary.part[4]+pickedCardSummary.part[3]) === (handCardSummary.part[4]+ handCardSummary.part[3]))
        && 
        (pickedCardSummary.tlj[3] === startCardSummary.tlj[3] || pickedCardSummary.tlj[3] === handCardSummary.tlj[3])
        )){
      console.log("size 3 not meet")
        return false
      }else{
        console.log("size 2 evalueation")
        return (pickedCardSummary.part[22] >= (startCardSummary.part[3]-pickedCardSummary.part[3]) || pickedCardSummary.part[22] === handCardSummary.part[22]) 
            && (pickedCardSummary.tlj[2] >= (startCardSummary.tlj[3]-pickedCardSummary.part[3])|| pickedCardSummary.tlj[2] === handCardSummary.tlj[2])
      }
    }
    if (startCardSummary.size === 4){
      console.log("size 4")
      if(!(pickedCardSummary.part[4] >= startCardSummary.part[4] || pickedCardSummary.part[4] === handCardSummary.part[4]) 
        && (pickedCardSummary.tlj[4] === startCardSummary.tlj[4] || pickedCardSummary.tlj[4] === handCardSummary.tlj[4])){
        console.log("size 4 not meet")
        return false
      }else if (!(pickedCardSummary.part[3] >= (startCardSummary.part[4]-pickedCardSummary.part[4]) || pickedCardSummary.part[3] === handCardSummary.part[3]) 
        && (pickedCardSummary.tlj[3] >= (startCardSummary.tlj[4]-pickedCardSummary.part[4])|| pickedCardSummary.tlj[3] === handCardSummary.tlj[3])){
        console.log("size 3 not meet")
        return false
      }else{
        console.log("size 2 evalueation")
        return (pickedCardSummary.part[2] >= (startCardSummary.part[4]-pickedCardSummary.part[4]-pickedCardSummary.part[3])*2 
        || pickedCardSummary.part[2] === handCardSummary.part[2]) 
        && 
        (pickedCardSummary.tlj[2] >= (startCardSummary.tlj[4]-pickedCardSummary.part[4]-pickedCardSummary.part[3])|| pickedCardSummary.tlj[2] === handCardSummary.tlj[2])
      }
    }
  }
  isAdjacent(card1, card2){
    console.log(card1,card2)
    if (this.isMain(card1)!== this.isMain(card2)){
      console.log("main and not main")
      return false
    }
    const mainNumber = this.state.currentRoom.mainNumber
    const mainSuit = this.state.currentRoom.mainSuit
    const locCard1 = ADHELPER.indexOf(card1.slice(1))
    const locCard2 = ADHELPER.indexOf(card2.slice(1))
    const locMain = ADHELPER.indexOf(mainNumber)
    if ((card1==="J0" && card2==="J1") || 
    (card1==="J1" && card2.slice(0,1)===mainSuit && card2.slice(1)===mainNumber) ||
    (card1.slice(0,1)===mainSuit && card1.slice(1)===mainNumber && card2.slice(0,1)!==mainSuit && card2.slice(1)===mainNumber) ||
    (card1.slice(0,1)!==mainSuit && card1.slice(1)===mainNumber && card1.slice(1)!=="ta" && card2.slice(0,1)===mainSuit && card2.slice(1)==="ta") ||
    (card1.slice(0,1)!==mainSuit && card1.slice(1)===mainNumber && card1.slice(1)==="ta" && card2.slice(0,1)===mainSuit && card2.slice(1)==="t3")
     ){
      console.log("special case")
      return true
    }
    return ((locCard1-locCard2) === 1 && locCard1!==locMain && locCard2!==locMain) || ((locCard1-locCard2) === 2 && (locCard1-locMain) === 1)
  }
  countTlj(card){
    console.log(card)
    const sortedHand = this.sortHand(card,true)
    let tlj = 1
    let curtlj = 1
    for (let i = 0; i < sortedHand.length-1; i++) {
      if (this.isAdjacent(sortedHand[i],sortedHand[i+1])) {
        console.log("is adjacent")
        curtlj++
      }else{
        console.log("not adjacent")
        tlj = Math.max(tlj,curtlj)
        curtlj = 1
      }
      console.log(curtlj, tlj)
    }
    return Math.max(tlj,curtlj)
  }
  Summarize(card){
    const carddict = card.reduce((dict,card)=>{
      if (dict[card]){
        return {...dict, [card]:dict[card]+1}
      }
      return {...dict, [card]:1}
    },{})
    const size = Object.values(carddict).reduce((max,cur)=>{
      if (cur > max)return cur
      return max
    },0)
    let part = {1:0,2:0,3:0,4:0,22:0}
    let tlj = {2:0,3:0,4:0}
    const summary = Object.keys(carddict).reduce((part,cd)=>{
      if (part[[carddict[cd]]]) return {...part, [carddict[cd]]:[...part[[carddict[cd]]],cd]}
      return {...part, [carddict[cd]]:[cd]}
    },{2:[],3:[],4:[]})
    Object.keys(summary).map(key=>{
      part[key] = summary[key].length
      return null
    })
    tlj[2] = this.countTlj([...summary[2],...summary[3],...summary[4]])
    tlj[3] = this.countTlj([...summary[3],...summary[4]])
    tlj[4] = this.countTlj(summary[4])
    part[22] = part[2]
    if (part[4]){
      part[22] = part[2]+part[4]*2
    }
    console.log(summary)
    console.log({size,part,tlj})
    return {size,part,tlj}
  }
  reasign(){
    const payload = {
      playerid: this.state.reasignPlayerid
    }
    this.sendSocket("reasign",payload)
  }
  rescore(){
    console.log("rescore")
    const payload = {
      playerid: this.state.rescorePlayerid,
      score: this.state.rescoreScore
    }
    this.sendSocket("rescore",payload)
  }
  // validateDump(){
  //   if (this.state.pickedDumpCard.length > 0){
  //     const dumpCard = this.state.currentRoom.dumpCard.card
  //     const picked = dumpCard.filter((card,idx)=>this.state.pickedDumpCard.indexOf(idx)>-1)
  //     this.sendSocket("invaliddump",{card:picked})
  //   }else{
  //     this.sendSocket("validdump")
  //   }
  //   this.setState({modal:null, pickedDumpCard:[]})
  // }
  setAvatar(adjust){
    const avatar = this.state.avatar
    if (avatar === 0 && adjust === -1){
      this.setState({avatar : 23})
    }else if(avatar === 23 && adjust === 1){
      this.setState({avatar : 0})
    }else{
      this.setState({avatar : avatar + adjust})
    }
  }
  render(){
    const roomListRender = this.state.roomList.map((room,id)=>{
      return (
        <div className="roomcard" key={room.roomid} id={`room-${room.roomid}`}>
          <div className="roominfo" >
              <h5>{room.roomName}&nbsp;({room.playersNumber}人)</h5>
              <small>房主：{room.host}</small>
          </div>
          <div className="roomactions" >
            <p>({STATUS[room.status]})</p>
            <button  onClick={()=>this.joinRoom(room.roomid)}>加入房间</button>
          </div>
        </div>
      )
    })
    
    return (
      <div className="App">
        <audio ref={this.audioPlay}>
          <source src={Play}></source>
        </audio>
        <audio ref={this.audioLose}>
          <source src={Lose}></source>
        </audio>
        <audio ref={this.audioWin}>
          <source src={Win}></source>
        </audio>
        <audio ref={this.audioStart}>
          <source src={Start}></source>
        </audio>
        <audio ref={this.audioTurn}>
          <source src={Turn}></source>
        </audio>
        <audio ref={this.audioMaincall}>
          <source src={Maincall}></source>
        </audio>
        <div className="changedevice"> 请使用更大屏幕设备 </div>
        <div className="connection"><p>&nbsp;</p>
        {/* <div className={classNames({"on":this.state.connection, "light": true})}></div> */}
        </div>
        {this.state.error && <p className="error" >{this.state.error}</p>}
        {this.state.message && <p className="message" >{this.state.message}</p>}
        {!this.state.playerid && 
          <Modal title="升级找朋友（6人局）">
            <form className="nameform" autoComplete="off">
              <div className="formgroup">
                <div className="avatarpicker">
                  <div className="left"onClick={()=>{this.setAvatar(1)}}>
                    <FontAwesomeIcon icon={faAngleLeft} />
                  </div>
                  <div className="icon" >
                    <Avatar avatar={this.state.avatar}/>
                  </div>
                  <div className="right" onClick={()=>{this.setAvatar(-1)}}>
                    <FontAwesomeIcon icon={faAngleRight} />
                  </div>
                </div>
                <input type="text" id="username" placeholder="玩家ID" 
                value={this.state.displayName} 
                onChange={(e)=>{this.setState({displayName:e.target.value})}}/>
              </div>
              <button disabled={!this.state.connection} onClick={(e)=>{e.preventDefault();this.registerPlayer()}}>进入</button>
            </form>
          </Modal>
        }
        {this.state.modal === "create room" && 
          <Modal onClose={()=>{this.setState({modal:null})}} title="创建房间">
            <form className="nameform" autoComplete="off">
              <div className="formgroup">
                  <input type="text" id="roomname" placeholder="房间名"
                  value={this.state.roomName} 
                  onChange={(e)=>{this.setState({roomName:e.target.value})}}/>
              </div>
              <div className="actions" >
                <button onClick={(e)=>{e.preventDefault();this.setState({modal: null});this.createRoom()}}>创建房间</button>
                <button onClick={(e)=>{e.preventDefault();this.setState({modal: null})}}>取消</button>
              </div>
            </form>
          </Modal>
        }
        {this.state.modal === "history" && 
          <Modal onClose={()=>{this.setState({modal:null})}} title="上轮信息">
            {this.state.currentRoom.lastPlay && 
              <Lastplays 
                lastplays={this.state.currentRoom.lastPlay} 
                playerlist={this.state.currentRoom.players} 
                winner={this.state.currentRoom.winnerid} 
              />
            }
          </Modal>
        }
        {(this.state.modal === "reasign" && this.state.currentRoom.currentPlay.length===6 && this.isHost()) &&
          <Modal onClose={()=>{this.setState({modal:null})}} title="修改上轮赢家">
            <form>
              <select value={this.state.reasignPlayerid} onChange={(e)=>{this.setState({"reasignPlayerid":e.target.value})}}>
                {this.state.currentRoom.players.map(player=>{
                  return (
                    <option value={player.playerid}>{player.displayName}</option>
                  )
                })}
              </select>
              <button onClick={(e)=>{e.preventDefault();this.reasign()}}>提交</button>
            </form>
          </Modal>
        }
        {(this.state.modal === "rescore" && this.isHost()) &&
          <Modal onClose={()=>{this.setState({modal:null})}} title="修改玩家级数">
            <form>
              <p>玩家：</p>
              <select value={this.state.rescorePlayerid} onChange={(e)=>{
                  const playerid = e.target.value
                this.setState((state)=>{
                  return {"rescorePlayerid":playerid, "rescoreScore": state.currentRoom.players.filter((p=>p.playerid===playerid))[0].score}
                })
                }}>
                {this.state.currentRoom.players.map(player=>{
                  return (
                    <option value={player.playerid}>{player.displayName}</option>
                  )
                })}
              </select>
              <p>更新级数至：</p>
              <select value={this.state.rescoreScore} onChange={(e)=>{this.setState({"rescoreScore":e.target.value})}}>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="t">10</option>
                <option value="t1">J</option>
                <option value="t2">Q</option>
                <option value="t3">K</option>
                <option value="ta">A</option>
              </select>
              <button onClick={(e)=>{e.preventDefault();this.rescore()}}>提交</button>
            </form>
          </Modal>
        }
        {this.state.modal === "setting" && 
          <Modal onClose={()=>{this.setState({modal:null})}} title="设置">
              <div className="settings" >
                {this.isHost() && <button disabled={this.state.currentRoom.currentPlay.length===0} onClick={(e)=>{e.preventDefault();this.sendSocket("revert"); this.setSscoretate({modal:null})}}>重置本轮</button>}
                {this.isHost() && <button disabled={this.state.currentRoom.currentPlay.length!==6} onClick={(e)=>{e.preventDefault();this.setState({modal:"reasign", reasignPlayerid: this.state.currentRoom.inTurn})}}>修改上轮赢家</button>}
                {this.isHost() && <button onClick={(e)=>{e.preventDefault();this.setState({modal:"rescore", rescorePlayerid: this.state.currentRoom.players[0].playerid, rescoreScore: this.state.currentRoom.players[0].score})}}>修改玩家级数</button>}
                <button onClick={(e)=>{e.preventDefault();this.leaveRoom()}}>返回大厅</button>
              </div>
          </Modal>
        }
        {(this.state.currentRoom && this.state.currentRoom.dumpCard && this.state.modal==="dump" ) && 
          <Modal onClose={()=>{this.setState({modal:null})}} title={this.state.currentRoom.dumpCard.succeed ? "甩牌成功" : "甩牌失败"}>
              <div className="dumping" >
                <h3>{this.state.currentRoom.players.filter(p=>p.playerid === this.state.currentRoom.dumpCard.playerid)[0].displayName}甩牌:</h3>
                <div className="cardlist" >
                  {this.state.currentRoom.dumpCard.card.map((card,idx)=>{
                    return <Poker small card ={card}/>
                  })}             
                </div>
                <h3>实际出牌:</h3>
                <div className="cardlist" >
                  {this.state.currentRoom.dumpCard.play.map((card,idx)=>{
                    return <Poker small card ={card}/>
                  })}             
                </div>
                <div className="actions" >
                  <button onClick={(e)=>{e.preventDefault();this.setState({modal:null})}}>确认</button>   
                </div>
              </div>
          </Modal>
        }
        {(this.state.modal === "end" && this.state.currentRoom) && 
          <Modal onClose={()=>{this.setState({modal:null})}} title="游戏结束">
            <div className="summary">
              <h3>底牌：</h3>
              <div className="cardlist">
                {this.state.currentRoom.bury.map(card=>{
                  return <Poker small card ={card}/>})}
              </div>
              <h3>闲方{this.state.currentRoom.win ? "(胜)" : ""}：</h3>
              {this.state.currentRoom.players.filter(p=>!p.onBoard).map(player=>{
                return (
                  <p>{player.displayName}</p>
                )})}
              <h3>总分：{this.state.currentRoom.finalPoint}</h3>
              <h3>庄方{this.state.currentRoom.win ? "" : "(胜)"}：</h3>
              {this.state.currentRoom.players.filter(p=>p.onBoard).map(player=>{
                return (
                  <p>{player.displayName}</p>
                )})}
              <p>胜者升{this.state.currentRoom.increment}级</p>
              {this.isHost() && <button onClick={()=>{this.startGame()}}>下一局</button>}
            </div>
          </Modal>
        }
        {!this.state.currentRoom && 
          <div className="lobby">
            <div className="roomlist">
              {roomListRender}
            </div>
            <button  className="createroom" onClick={()=>this.setState({modal: "create room"})}>创建房间</button>
          </div>
        }
        {this.state.currentRoom && <div>
            <div className="infopanel">
              <div className="roominfo"> 
                <p>{this.state.currentRoom.roomName}</p>
                <small>{GAMESTATUS[this.state.currentRoom.gamestatus]}</small>
                <small className={this.state.connection ? "on" : "off"}>{this.state.connection ? "在线" : "断开"}</small>
              </div>
              <div className="ticketdisplay">
                <p><b>船票: </b></p>
                <div className="ticket">
                  {this.state.currentRoom.ticket && this.state.currentRoom.ticket.map(ticket=>{
                    return (
                      <div>
                        <Poker small card ={ticket.card}/>
                        <h3>第{ticket.sequence}张</h3>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="icons" >
              {(this.state.currentRoom.mainSuit && this.state.currentRoom.mainNumber) && <div style={{marginRight:"30px"}}><Poker small card ={this.state.currentRoom.mainSuit + this.state.currentRoom.mainNumber}/></div>}
              <div className="history" onClick={()=>{this.setState({modal:"history"})}}>
                <FontAwesomeIcon icon={faHistory} />
              </div>
              <div className="setting" onClick={()=>{this.setState({modal:"setting"})}}>
                <FontAwesomeIcon icon={faCog} />
              </div>
            </div>
            <div className="start">
              {(this.isHost() && this.state.currentRoom.status ==="full" ) && <button onClick={(e)=>{e.preventDefault();this.startGame()}}>开始游戏</button>}
            </div>


              <Players
                playerid={this.state.playerid}
                players={this.state.currentRoom.players}
                inTurn={this.state.currentRoom.inTurn}
                dealerid={this.state.currentRoom.dealerid}
                tempDealerid={this.state.currentRoom.tempDealerid}
                currentPlay={(this.state.currentRoom.mainCalls && this.state.currentRoom.mainCalls.length>0) ? this.state.currentRoom.mainCalls : this.state.currentRoom.currentPlay}
              />
            </div>
          }
          {this.state.currentRoom && 
            <div className={classNames({"controlpanel":true,"hide":!this.state.control})}>
              <div className="lever" onClick={()=>{this.setState({control:!this.state.control})}}>控制区</div>
              <div className="panel" >
              <div className="upperpanel">
                <div className="player">
                  <div className={classNames({"playericon":true,"turn": this.state.playerid === this.state.currentRoom.inTurn })}>
                    <Avatar avatar={this.state.currentRoom.players.filter(p=>p.playerid === this.state.playerid)[0].avatar}/>
                  </div>
                  <div className="playerpoints">
                      {this.state.currentRoom.players.filter(p=>p.playerid === this.state.playerid)[0].points.map((card)=>{return card.map((cd)=>{return <Poker small card ={cd}/>})})}
                  </div>
                  <div className="playername">
                    {this.state.displayName}
                  </div>
                  <div className="playerstatus">
                    <div className={classNames({"playerscore":true,"disconnected": !this.state.currentRoom.players.filter(p=>p.playerid === this.state.playerid)[0].isAlive})}>{pokerNumberDict[this.state.currentRoom.players.filter(p=>p.playerid === this.state.playerid)[0].score]}</div>
                    {(this.state.playerid === this.state.currentRoom.dealerid || (!this.state.currentRoom.dealerid && this.state.playerid===this.state.currentRoom.tempDealerid)) && <div className="playerdealer">庄</div>}
                    {(this.state.currentRoom.players.filter(p=>p.playerid === this.state.playerid)[0].onBoard && this.state.playerid !== this.state.currentRoom.dealerid)  && <div className="playeronboard">跟</div>}
                  </div>
                  
                  <div className="cardlist">
                    {(this.state.currentRoom.currentPlay && this.state.currentRoom.currentPlay.length>0 && this.state.currentRoom.currentPlay.filter(play=>play.playerid===this.state.playerid).length>0) && this.state.currentRoom.currentPlay.filter(play=>play.playerid===this.state.playerid)[0].card.map(card=>{
                      return <Poker small card ={card}/>
                    })
                    }
                    {(this.state.currentRoom.mainCalls && this.state.currentRoom.mainCalls.length>0 && this.state.currentRoom.mainCalls.filter(play=>play.playerid===this.state.playerid).length>0) && 
                      this.state.currentRoom.mainCalls.filter(play=>play.playerid===this.state.playerid)[0].card.map(card=>{
                        return <Poker small card ={card}/>
                      })
                    }
                  </div>
                </div>
                <div className="actionpanel">
                  
                  <div className="play">                    
                    {(this.state.pickedCard.length>0) && <button onClick={(e)=>{e.preventDefault();this.setState({pickedCard:[]})}}>取消</button>}
                    {(this.state.currentRoom.gamestatus==="bury" && this.state.currentRoom.dealerid === this.state.playerid) && <button onClick={(e)=>{e.preventDefault();this.buryCard()}}>埋牌</button>}
                    {(this.state.currentRoom.gamestatus==="in play" && this.state.currentRoom.inTurn === this.state.playerid) && 
                      <button disabled = {!this.state.validCard && !this.state.dumpableCard} onClick={(e)=>{e.preventDefault();this.playCard()}}>{(this.state.dumpableCard && !this.state.validCard) ? "甩" : "出"}牌</button>
                    }
                  </div>
                  <div className="call">
                    {(this.state.currentRoom.dealerid === this.state.playerid && this.state.currentRoom.gamestatus==="ticketcall") && 
                      <Ticket ticket={this.state.ticket} onChange={(field, value)=>this.handleTicketChange(field,value)} onSubmit={()=>{this.sendTicket()}}/>
                    }
                    {this.state.callableMain.map(callableMain=>{
                      return <button className= "maincall" onClick={()=>{this.mainCall(callableMain)}}>{callableMain.map(card=>{
                        return <Poker small card ={card}/>
                        })}
                      </button>
                    })}
                  </div>
                </div>
              </div>
              <div className="handcard">
                <div className="cardlist">
                  { this.state.handCard && this.state.handCard.map((card, idx)=>{
                    return (<Poker 
                      card={card} 
                      key={idx} 
                      sequence={idx} 
                      picked={this.state.pickedCard.indexOf(idx)>-1} 
                      onPick={()=>{this.pickCard(idx)}}
                      main ={this.isMain(card)?true:false}
                      forbidden ={this.isForbidden(card)}
                    />
                    )
                  })}
              </div>
            </div>
          </div>
          </div>
        }
          

        


        
        <div className="info-panel">
          <p>connection: </p>
          <pre style={{textAlign:"left", fontSize: "10px"}}>{JSON.stringify(this.state.connection, null, 4)}</pre>
          <p>current Room: </p>
          <pre style={{textAlign:"left", fontSize: "10px"}}>{JSON.stringify(this.state.currentRoom, null, 4)}</pre>
          <p>Room List: </p>
          <pre style={{textAlign:"left", fontSize: "10px"}}>{JSON.stringify(this.state.roomList, null, 4)}</pre>
        </div>
      </div>
    );
  }
}

export default App;
