/**
 * The core game logic. Pretend this is just a complicated board game.
 */

import { Game, State } from "boardgame.io";
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationId, DialogueNodeId } from "../glossary/Conversations";
import { EventSchedule, TimeCoordinate, getTimeCoordinateFromTurn } from "../glossary/Events";
import { ResourceBundle } from "../glossary/Resources";

export type SpaceGameState = State & {
  readonly config: GameConfiguration,
  resources: ResourceBundle,
  schedule: EventSchedule,
  currentConversation?: ConversationId,
  currentDialogueNode?: DialogueNodeId,
};

export const SpaceGame = (gameConfiguration : GameConfiguration) : Game<SpaceGameState> => ({
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
    currentConversation: undefined,
    currentDialogueNode: undefined,
  } as SpaceGameState),
  moves: {
    // TODO: Map turns to the traversal of the conversation graph.
    // Need a bit of a state machine...
    // The various states are:
    // - We're in a timeslot with no events scheduled.
    // - We are in the middle of an event.
    // - We have reached the ending of an event.
    selectOption: ({ G, ctx, events, playerID}, choice: string | null): void => {
      // There's nothing currently scheduled.
      if (typeof G.currentDialogueNode === "undefined" &&
          typeof G.currentConversation === "undefined") {
        events.endTurn();
        return;
      }
      // We've reached a dead end in the conversation.
      if (typeof G.currentDialogueNode === "undefined" &&
          typeof G.currentConversation !== "undefined") {
        G.currentConversation = undefined;
        events.endTurn();
        return;
      }
      // We're in an event.
      const conversation = G.config.conversationLibrary[G.currentConversation as string] as Conversation;
      const dialogueNode = conversation.dialogueNodeLibrary[G.currentDialogueNode as DialogueNodeId];
      const choices = dialogueNode.next;
      G.currentDialogueNode = choice ? choices[choice] : undefined;
    },
  },
  turn: {
    onBegin: ({G, ctx, events}) => {
      const tc : TimeCoordinate = getTimeCoordinateFromTurn(ctx.turn);
      G.currentConversation = G.schedule[tc];
      if (typeof G.currentConversation !== "undefined") {
        G.currentDialogueNode = G.config.conversationLibrary[G.currentConversation].initialDialogueNodeId;
      }
    },
  },
});