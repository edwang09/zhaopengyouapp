import React from 'react';

class Ticket extends React.Component {
  render(){
    return (
            <form className="ticketcall">
                <div className="ticketcontainer">
                    <div>
                    第
                    <select value={this.props.ticket.sequence1} onChange={(e)=>{this.props.onChange("sequence1",e.target.value)}}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    个出
                    
                    <select value={this.props.ticket.suit1} onChange={(e)=>{this.props.onChange("suit1",e.target.value)}}>
                        <option value="H">红桃</option>
                        <option value="D">方片</option>
                        <option value="C">草花</option>
                        <option value="S">黑桃</option>
                        <option value="J0">大王</option>
                        <option value="J1">小王</option>
                    </select>
                    
                    {this.props.ticket.suit1.slice(0,1)!=="J" && <select value={this.props.ticket.number1} onChange={(e)=>{this.props.onChange("number1",e.target.value)}}>
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
                    </select>}
                    的人 
                    </div>
                    <div>
                    第
                    <select value={this.props.ticket.sequence2} onChange={(e)=>{this.props.onChange("sequence2",e.target.value)}}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option selected value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    个出
                    
                    <select value={this.props.ticket.suit2} onChange={(e)=>{this.props.onChange("suit2",e.target.value)}}>
                        <option value="H">红桃</option>
                        <option value="D">方片</option>
                        <option value="C">草花</option>
                        <option value="S">黑桃</option>
                        <option value="J0">大王</option>
                        <option value="J1">小王</option>
                    </select>
                    
                    {this.props.ticket.suit2.slice(0,1)!=="J" && <select value={this.props.ticket.number2} onChange={(e)=>{this.props.onChange("number2",e.target.value)}}>
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
                    </select>}
                    的人
                    </div>
                </div>
                <button onClick={(e)=>{e.preventDefault(); this.props.onSubmit()}}>提交</button>
            </form>
    );
  }
}

export default Ticket;
