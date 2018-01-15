import React, { Component } from 'react';
import fire from '../../fire';

import CreateDeck from './CreateDeck';

class CreateGameType extends Component {

  constructor(props) {
    super(props);  // backToHome (callback)
    this.state = {
      gameTypeId: 'test_hearts'
    };
    this.createDeck = new CreateDeck();
  }

  _getFirePrefix() {
    return 'gameTypes/' + this.state.gameTypeId;
  }

  submitClicked() {
    fire.database().ref(this._getFirePrefix() + '/deck').set(this.createDeck.getCards());
    window.alert('submitted to database!');
    this.props.backToHome();
  }

  cancelClicked() {
    this.props.backToHome();
  }

  renderCreateInterface() {
    return (
      <div>
        { this.createDeck.render() }
        <button onClick={ this.submitClicked.bind(this) }>Submit Game Type</button>
        <button onClick={ this.cancelClicked.bind(this) }>Cancel</button>
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.renderCreateInterface() }
      </div>
    );
  }
}

export default CreateGameType;