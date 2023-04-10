/**
 * The core game logic. Pretend this is just a complicated board game.
 */

import { Ctx, Game, State } from "boardgame.io";
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationId, DialogueNodeId } from "../glossary/Conversations";
import { EventSchedule, TimeCoordinate, getTimeCoordinateFromTurn } from "../glossary/Events";
import { ResourceBundle } from "../glossary/Resources";

/**
 * This enum describes what the selectOption move actually means in context.
 */
export enum TurnStage {
  SelectConversation = "SelectConversation",
  SelectDialogueNode = "SelectDialogueNode", 
  Continue = "Continue",
};

export type SpaceGameState = State & {
  readonly config: GameConfiguration,
  resources: ResourceBundle,
  schedule: EventSchedule,
  conversationSelect?: ConversationId[],
  currentConversation?: ConversationId,
  currentDialogueNode?: DialogueNodeId,
};

export function GetStage(ctx: Ctx) : TurnStage {
  const playerID = ctx.currentPlayer;
  if (ctx.activePlayers === null) {
    throw new Error("No active players set.");
  }
  const stage = ctx.activePlayers[playerID];
  return stage as TurnStage;
}

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
    stages: {
      [TurnStage.SelectConversation]: {
        moves: {
          selectConversation: ({ G, events }, choice: string): void => {
            const conversations = (G.conversationSelect as ConversationId[]);
            if (typeof conversations === "undefined") {
              throw new Error("If we are in the SelectConversation stage, we must have at least one conversation scheduled.");
            }
            if (conversations.indexOf(choice) === -1) {
              throw new Error(`Invalid choice [${choice}] selected.`);
            }
            const conversation = G.config.conversationLibrary[choice];
            // Process the consequences of this initial choice.
            G.currentConversation = choice;
            G.currentDialogueNode = conversation.initialDialogueNodeId;
            G.conversationSelect = undefined;
            const dialogueNode = conversation.dialogueNodeLibrary[G.currentDialogueNode];
            if (Object.keys(dialogueNode.next).length === 0) {
              events.setStage(TurnStage.Continue);
            } else {
              events.setStage(TurnStage.SelectDialogueNode);
            }
          }
        }
      },
      [TurnStage.SelectDialogueNode]: {
        moves: {
          selectDialogue: ({ G, events }, choice: string): void => {
            if (typeof G.currentConversation === "undefined") {
              throw new Error("Attempting to select a dialogue node when no conversation is active.");
            }
            if (typeof G.currentDialogueNode === "undefined") {
              throw new Error("Attempting to select a choice when no dialogue node is active.");
            }
            const conversation = G.config.conversationLibrary[G.currentConversation];
            const currentDialogueNode = conversation.dialogueNodeLibrary[G.currentDialogueNode];
            if (!(choice in currentDialogueNode.next)) {
              throw new Error(`Invalid choice [${choice}] selected.`);
            } 
            // Process the consequences of the choice.
            const newDialogueNodeId = currentDialogueNode.next[choice];
            const newDialogueNode = conversation.dialogueNodeLibrary[newDialogueNodeId];
            G.currentDialogueNode = newDialogueNodeId;
            if (Object.keys(newDialogueNode.next).length === 0) {
              events.setStage(TurnStage.Continue);
            } else {
              events.setStage(TurnStage.SelectDialogueNode);
            }
          }
        }
      },
      [TurnStage.Continue]: {
        moves: {
          continue: ({ G, events}): void => {
            // Timeslot over. Nothing more to do.
            G.conversationSelect = undefined;
            G.currentConversation = undefined;
            G.currentDialogueNode = undefined;
            events.endTurn();
          }
        }
      },
    },
    // TODO: Map turns to the traversal of the conversation graph.
    // Need a bit of a state machine...
    // The various states are:
    // 1. We're in a timeslot with no events scheduled: Just continue.
    // 2. We're in a timeslot with one or more events and we need to choose one.
    // 3. We are in the middle of an event.
    // 4. We have reached the ending of an event.
    //
    // This is called at the beginning of a time segment, never mid-conversation.
    onBegin: ({G, ctx, events}) => {
      const tc : TimeCoordinate = getTimeCoordinateFromTurn(ctx.turn);
      G.conversationSelect = G.schedule[tc];
      if (typeof G.conversationSelect === "undefined") {
        // Nothing scheduled.
        events.setActivePlayers({
          currentPlayer: TurnStage.Continue
        });
        return;
      }
      events.setActivePlayers({
        currentPlayer: TurnStage.SelectConversation
      });
    },
  },
});