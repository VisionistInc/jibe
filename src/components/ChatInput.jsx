import React from 'react';
import $ from 'jquery';

class ChatInput extends React.Component {
  constructor (props) {
    super (props);

    this._onKeyUp = this._onKeyUp.bind (this);
  }

  _onKeyUp (event) {
    if (event.keyCode == 13) {
      // TODO use state instead of jquery here
      const messageText = $(this.refs.input).val ();
      if (messageText !== "") {
        const message = {
          roomId  : 'TODO_supply_room',
          authorId: 'TODO_supply_authorId',
          message : messageText,
          timestamp: new Date ()
        };

        $(this.refs.input).val ('');

        console.log ('calling on message submit with message', message);
        this.props.onMessageSubmit (message);
      }
      return false;
    }
  }

  render () {
    return (
      <div className="col-md-12" id="chat-input">
        <input type="email" className="form-control" id="chat-message" ref="input" onKeyUp={this._onKeyUp} placeholder="Write your message here..."/>
      </div>
    );
  }
};

export default ChatInput;
