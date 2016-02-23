import { connect } from 'react-redux';

import { addMessage } from '../actions/';
import Chat from '../components/Chat';

const mapStateToProps = (state) => {
  console.log ('messages', state.messages);
  return {
    messages: state.messages
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onMessageSubmit: (message) => {
      dispatch (addMessage (message));
    }
  };
};

const ChatContainer = connect (
  mapStateToProps,
  mapDispatchToProps
)(Chat);

export default ChatContainer;
