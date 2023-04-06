import { Client } from 'boardgame.io/react';
import { Debug } from 'boardgame.io/debug';
import { SpaceGame } from './SpaceGame';
import { GameConfiguration } from '../glossary/Compendium';
import { Board } from './Board';

const getClient = (gameConfiguration: GameConfiguration) => {
  return Client({
    game: SpaceGame(gameConfiguration),
    numPlayers: 1,
    board: Board,
    // TODO: Eventually turn this off.
    debug: { impl: Debug }
  })
};

export default getClient;