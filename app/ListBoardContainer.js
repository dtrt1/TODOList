import React, { Component } from 'react';
import ListBoard from './ListBoard';
import update from 'react-addons-update';
import 'whatwg-fetch';
import 'babel-polyfill'

const API_URL = 'http://kanbanapi.pro-react.com';
const API_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'CHANGE THIS VALUE'
};

class ListBoardContainer extends Component {
  constructor(){
    super(...arguments);
    this.state = {
      cards:[],
      filterText: '',
    };
  }
  componentDidMount(){
    fetch(API_URL+'/cards', {headers: API_HEADERS})
    .then((response) => response.json())
    .then((responseData) => {
      this.setState({cards: responseData});
    })
    .catch((error) => {
      console.log('Error fetching and parsing data', error);
    });
  }


  addTask(cardId, taskName){
    let prevState = this.state;
    let cardIndex = this.state.cards.findIndex((card)=>card.id == cardId);
    let newTask = {id:Date.now(), name:taskName, done:false};
    let nextState = update(this.state.cards, {
      [cardIndex]: {
        tasks: {$push: [newTask] }
      }
    });
    this.setState({cards:nextState});
    // Call the API to add the task on the server
    fetch(`${API_URL}/cards/${cardId}/tasks`, {
      method: 'post',
      headers: API_HEADERS,
      body: JSON.stringify(newTask)
    })
    .then((response) => {
      if(response.ok){
        return response.json()
      } else {
        throw new Error("Server response wasn't OK")
      }
    })
    .then((responseData) => {
      newTask.id=responseData.id
      this.setState({cards:nextState});
    })
    .catch((error) => {
      this.setState(prevState);
    });
  }

  deleteTask(cardId, taskId, taskIndex){
    let prevState = this.state;
    let cardIndex = this.state.cards.findIndex((card)=>card.id == cardId);
    let nextState = update(this.state.cards, {
      [cardIndex]: {
        tasks: {$splice: [[taskIndex,1]] }
      }
    });
    this.setState({cards:nextState});
    // Call the API to remove the task on the server
    fetch(`${API_URL}/cards/${cardId}/tasks/${taskId}`, {
      method: 'delete',
      headers: API_HEADERS
    })
    .then((response) => {
      if(!response.ok){
        throw new Error("Server response wasn't OK")
      }
    })
    .catch((error) => {
      console.error("Fetch error:",error)
      this.setState(prevState);
    });
  }

  toggleTask(cardId, taskId, taskIndex){
    let prevState = this.state;
    let cardIndex = this.state.cards.findIndex((card)=>card.id == cardId);
    let newDoneValue;
    let nextState = update(
      this.state.cards, {
        [cardIndex]: {
          tasks: {
            [taskIndex]: {
              done: { $apply: (done) => {
                newDoneValue = !done
                return newDoneValue;
              }
            }
          }
        }
      }
    });
    this.setState({cards:nextState});
    // Call the API to toggle the task on the server
    fetch(`${API_URL}/cards/${cardId}/tasks/${taskId}`, {
      method: 'put',
      headers: API_HEADERS,
      body: JSON.stringify({done:newDoneValue})
    })
    .then((response) => {
      if(!response.ok){
        throw new Error("Server response wasn't OK")
      }
    })
    .catch((error) => {
      console.error("Fetch error:",error)
      this.setState(prevState);
    });
  }
  
  handleUserInput(searchTerm){
    this.setState({filterText:searchTerm})
  }

  render() {
    let query = this.state.filterText.toLowerCase();
    
    let filteredCards = this.state.cards.filter(
      (card) => (card.title.toLowerCase().indexOf(query) !== -1) || (
        (card.tasks.filter(
          (task) => (task.name.toLowerCase().indexOf(query) !== -1))
        ).length > 0
      )
    );

    return (
    <ListBoard cards={filteredCards}
    taskCallbacks={{
      toggle: this.toggleTask.bind(this),
      delete: this.deleteTask.bind(this),
      add: this.addTask.bind(this) }}
    filterText={this.state.filterText}
    onUserInput={this.handleUserInput.bind(this)} />
    )
  }
}
export default ListBoardContainer;
