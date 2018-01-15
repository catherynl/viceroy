import { getStandardDeck } from '../card';

const TestHearts = {
    deck: getStandardDeck(),
    handSortOrder: 'suitFirst',
    maxPlayers: 4,
    minPlayers: 1,
    name: 'Test Hearts',
    numPlayers: 4,
    rankOrder: 'A-high',
    stages: [
        {
            name: 'Deal Stage',
            type: 'deal',
            dealCountPerPlayer: 13,
            handleRemaining: 'keepInDeck'
        },
        {
            name: 'Play Stage',
            type: 'play',
            nextPlayerRules: 'trickTaking',
            availableActions: [true, false, false, true]
        }
    ]
};

export default TestHearts;