import { combineReducers } from 'redux';

import messages from './messages';

const jibeApp = combineReducers ({
  messages
});

export default jibeApp;
