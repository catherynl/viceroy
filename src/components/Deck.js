import React, { Component } from 'react';
import Card from './Card';
import { range } from 'lodash';
import { Suits } from '../utils/card';

const RANKS = 13;

class Deck extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cards: []
    };
    this.initializeCards();
    this.shuffle();
  }

  initializeCards() {
    range(RANKS).forEach(rank => {
      Object.keys(Suits).forEach(suit => {
        let card = {
          rank: rank + 1,
          suit: suit
        }
        this.state.cards.push(card);
      });
    });
  }

  getCards() {
    return this.state.cards;
  }

  shuffle() {
    const { cards } = this.state;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }
  }

  // TODO: generalize this to allow other sorting orders
  cardComparison(card1, card2) {
    return this.cardValue(card1) - this.cardValue(card2);
  }
  cardValue(card) {
    return card.suit * 100 + card.rank;
  }

  deal(numPlayers) {
    const { cards } = this.state;
    let hands = range(numPlayers).map(i => []);
    range(cards.length).forEach(i => {
      hands[i % numPlayers].push(cards[i]);
    });
    hands.forEach(hand => {hand.sort(this.cardComparison.bind(this))});
    return hands;
  }

  render() {
    return (
      <div>
        { this.state.cards.map((card, index) => <Card key={ index } card={ card } /> ) }
      </div>
    );
  }
}

export default Deck;