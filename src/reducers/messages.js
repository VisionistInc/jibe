const message = (state, action) => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return action.message;
    default:
      return state;
  }
};

const messages = (state = [], action) => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return [
        ...state,
        message (undefined, action)
      ];
    default:
      return state;
  }
};

export default messages;
