import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import jibeApp from './reducers';
import App from './components/App';

let store = createStore(jibeApp);

console.log ('store', store);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('jibe-container')
);
