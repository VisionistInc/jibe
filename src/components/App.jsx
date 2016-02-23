import React from 'react';
import ChatContainer from '../containers/ChatContainer';

const App = () => (
  <div className="container-fluid">
    <div className="row" style={{height: "100%"}}>
      <div id="content-containers" className="col-md-9 col-sm-8 col-xs-12">
      </div>
      <ChatContainer />
    </div>
  </div>
);

export default App;
