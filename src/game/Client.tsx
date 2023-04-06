import { Client } from 'boardgame.io/react';
import { Debug } from 'boardgame.io/debug';
import { SpaceGame } from './SpaceGame';
import { GameConfiguration } from '../glossary/Compendium';

const getClient = (gameConfiguration: GameConfiguration) => {
  return Client({
    game: SpaceGame(gameConfiguration),
    numPlayers: 1,
    // TODO: Eventually turn this off.
    debug: { impl: Debug }
  })
};

export default getClient;