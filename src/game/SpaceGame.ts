/**
 * The core game logic. Pretend this is just a complicated board game.
 */

import { ActivePlayers, Game, StageConfig } from "boardgame.io";
import { GameConfiguration } from "../glossary/Compendium";
import { DayStage, TimeCoordinate } from "../glossary/Events";

const STAGES = Object.fromEntries(
  Object.values(DayStage).map((p, i) => [
    p,
    {
      next: i >= Object.values(DayStage).length ? undefined :
        Object.values(DayStage)[i+1]
    } as StageConfig
  ])
);

export const SpaceGame = (gameConfiguration : GameConfiguration) : Game => ({
  setup: () => ({
    // This should be read-only.
    config: gameConfiguration,
    // These are initialized from the config, but are mutable.
    resources: {
      ...gameConfiguration.initialResources
    },
    schedule: {
      ...gameConfiguration.initialEventSchedule
    },
    currentConversation: undefined
  }),
  moves: {
    // TODO: Map turns to the traversal of the conversation graph.
    // Need a bit of a state machine...
    selectOption: ({ G, ctx, events, playerID}, choice: string | null): void => {
      if (typeof G.currentDialogueNode === "undefined" &&
          typeof G.currentConversation === "undefined") {
        const stage = (ctx.activePlayers as ActivePlayers)[playerID] as DayStage;
        const tc : TimeCoordinate = `${ctx.turn}.${stage}`;
        G.currentConversation = G.schedule[tc];
        const conversation = G.config.conversationLibrary[G.currentConversation]; 
        G.currentDialogueNode = conversation.initialDialogueNode;
      }
      if (typeof G.currentDialogueNode === "undefined" &&
          typeof G.currentConversation !== "undefined") {
        // We've reached a dead end in the conversation.
        G.currentConversation = undefined;
        events.endStage();
        return;
      }
    },
  },

  turn: {
    onBegin: ({G, ctx, events}) => {
      const stage = (ctx.activePlayers as ActivePlayers)[ctx.currentPlayer] as DayStage;
      const tc : TimeCoordinate = `${ctx.turn}.${stage}`;
      G.currentConversation = G.schedule[tc];
    },
    activePlayers: {
      currentPlayer: Object.values(DayStage)[0],
    },
    stages: STAGES
  },
});