import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';
import GameType from '../utils/GameType';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId, leaveGame (callback)
    this.state = {
      gameState: {
        started: false,
        finished: false,
        currentStage: 0,
        hands: [],
        players: [],
        recentlyPlayed: [] },
      cardsSelected: [],  // booleans, one for each card in this player's hand
      minPlayers: 10000,  // prevents "Start Game" from being shown too early
    };
    this.gameType = 0;
  }

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getNumPlayers() {
    return this.state.gameState.players.length;
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    const newGameState = Object.assign(this.state.gameState, currentState.val());
    this.setState({ gameState: newGameState });

    const gameTypeRef = fire.database().ref('gameTypes/' + newGameState.gameTypeId);
    const gameType = await gameTypeRef.once('value');
    this.gameType = new GameType(gameType.val());
    this.setState({ minPlayers: this.gameType.getMinPlayers() });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    };
    const removalListenerCallback = snapshot => {
      if (snapshot.key === 'hands') {
        const { gameState } = this.state;
        gameState.hands = gameState.hands.map((el) => []);
        this.setState({ gameState });
      } else {
        window.alert('WARNING: a field other than "hands" has been removed from the game state database:', snapshot.key);
      }
    };

    gamesRef.on('child_changed', listenerCallback);
    gamesRef.on('child_added', listenerCallback);
    gamesRef.on('child_removed', removalListenerCallback);
  }

  onCardSelected(cardIndex) {
    let { cardsSelected } = this.state;
    cardsSelected[cardIndex] = !(cardsSelected[cardIndex]);
    this.setState({ cardsSelected });
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayersTurn(ind) {
    const { gameState } = this.state;
    return (gameState.started) && (ind === gameState.playerToMove);
  }

  shouldShowGameInPlay() {
    return this.state.gameState.started && !this.state.gameState.finished;
  }

  shouldShowGameFinished() {
    return this.state.gameState.finished;
  }

  shouldShowNextStageButton() {
    return this.state.gameState.currentStage + 1 < this.gameType.getNumStages();
  }

  shouldShowEndGameButton() {
    return true; // TODO game logic
  }

  startGameClicked() {
    const deck = new Deck({ cards: this.gameType.getDeck() });
    const hands = deck.deal(this._getNumPlayers());
    hands.forEach(hand => this.gameType.sortHand(hand));
    const numCardsInMyHand = hands[this.props.playerIndex].length;
    this.setState({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  playCardsClicked() {
    const myHand = this.state.gameState.hands[this.props.playerIndex];
    const cardsSelected = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
    if (cardsSelected.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    fire.database().ref(this._getFirePrefix() + '/recentlyPlayed/' + this.props.playerIndex).set(cardsSelected);
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex).set(remainingHand);
    const newPlayerToMove = (this.state.gameState.playerToMove + 1) % this._getNumPlayers();
    fire.database().ref(this._getFirePrefix() + '/playerToMove').set(newPlayerToMove);
  }

  nextStageClicked() {
    const nextStage = this.state.gameState.currentStage + 1;
    fire.database().ref(this._getFirePrefix() + '/currentStage').set(nextStage);
  }

  endGameClicked() {
    const winner = Math.floor(Math.random() * this._getNumPlayers()) + 1;
    fire.database().ref(this._getFirePrefix() + '/winner').set(winner);
    fire.database().ref(this._getFirePrefix() + '/finished').set(true);
  }

  leaveGameClicked() {
    this.props.leaveGame();
  }

  renderStartGameButton() {
    return (
      <div>
        <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
      </div>
    );
  }

  renderPlayer(ind) {
    const { gameState } = this.state;
    return (
      <div className='player' key={ ind }>
        <div className='player-name'>
          {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
          &nbsp;
          { this.props.playerIndex === this.state.gameState.playerToMove 
            ? <span className='your-turn'>(Your turn)</span>
            : null }
          { this.shouldShowPlayersTurn(ind) ? this.renderPlayersTurn() : null }
        </div>
        { gameState.hands ? this.renderPlayersHand(ind) : null }
        <br />
        Recently played
        <br /><br />
        { gameState.recentlyPlayed[ind]
          ? <Hand
            cards={ gameState.recentlyPlayed[ind] }
            isYours={ false }
            visible={ true } />
          : null }
      </div>
    );
  }

  renderPlayersHand(playerInd) {
    const { gameState } = this.state;
    if (playerInd === this.props.playerIndex) {
      return (
        <Hand
          cards={ gameState.hands[playerInd] ? gameState.hands[playerInd] : [] }
          isYours={ true }
          visible={ true }
          onSelect={ this.onCardSelected.bind(this) }
          onPlayCards= { this.playCardsClicked.bind(this) }
          cardsSelected={ this.state.cardsSelected }
        />);
    } else {
      return (
        <Hand
          cards={ gameState.hands[playerInd] ? gameState.hands[playerInd] : [] }
          isYours={ false }
          visible={ false }
        />);
    }
  }

  renderPlayersTurn() {
    return (
      <div>
        { this.props.playerIndex === this.state.gameState.playerToMove
          ? <button onClick={ this.playCardsClicked.bind(this) }>Play card</button>
          : <div>(This player's turn)</div> }
      </div>
    );
  }

  renderDealStage() {

  }

  renderPlayStage() {

  }

  renderStage() {
    const { gameState } = this.state;
    switch(this.gameType.getStage(gameState.currentStage).type) {
      case 'deal':
        console.log('deal stage');
        return this.renderDealStage();
      case 'play':
        console.log('play stage');
        return this.renderPlayStage();
      default:
        console.log('not recognized stage');
        return null;
    }
  }

  renderGameInPlay() {
    return (
      <div>
        { range(this._getNumPlayers()).map(ind =>
          this.renderPlayer(ind)
        )}
        { this.renderStage() }
        { this.shouldShowNextStageButton()
          ? <button onClick={ this.nextStageClicked.bind(this) }>Next stage</button>
          : null }
        { this.shouldShowEndGameButton()
          ? <button onClick={ this.endGameClicked.bind(this) }>End game</button>
          : null }
      </div>
    );
  }

  renderGameFinished() {
    return (
      <div>
        <p>Game is finished! The winner is <span className='player-name'>player { this.state.gameState.winner }!</span></p>
        <button onClick={ this.leaveGameClicked.bind(this) }>Back to Home</button>
      </div>
    );
  }

  render() {
    return (
      <div className='game'>
        <div className='game-id'>
          Game ID: {this.props.gameId }
        </div>
        Give this id to your friends so they can join your game!
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
        { this.shouldShowGameInPlay() ? this.renderGameInPlay() : null }
        { this.shouldShowGameFinished() ? this.renderGameFinished() : null }
      </div>
    );
  }
}

export default Game;