import React from 'react';

import ChatInput from './ChatInput';

const Chat = ({ messages, onMessageSubmit }) => (
  <div id="side-container" className="col-md-3 col-sm-4 hidden-xs">
    <div className="row" data-spy="affix">
      <div className="col-md-12" id="chat-pane">
        {
          messages.map ((message, index) => {
            return <p>{ message.message }</p>
          })
        }
      </div>
      <ChatInput onMessageSubmit={onMessageSubmit} />
    </div>
  </div>
);

export default Chat;
