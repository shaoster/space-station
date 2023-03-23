/**
 * This file doesn't introduce any new concepts but compiles the other concepts described in this directory in
 * a hopefully easier-to-understand manner.
 */

import { Character, CharacterId, CharacterLibrary, CharacterRole } from "./Characters";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntry, DialogueEntryId, DialogueEntryLibrary } from "./Conversation"
import { Item, ItemId, ItemLibrary } from "./Items";
import { Image, ImageId, ImageLibrary } from "./Images";
import { Location, LocationId, LocationLibrary } from "./Locations";
import { EventSchedule } from "./Events";
import { FungibleResource, ResourceBundle } from "./Resources";
import { monitorEventLoopDelay } from "perf_hooks";

export type IdentifiableEntity = Character | Conversation | DialogueEntry | Image | Item | Location;

export type EntityId = CharacterId | ConversationId | DialogueEntryId | ImageId | ItemId | LocationId;

export type EntityLibrary = CharacterLibrary | ConversationLibrary | DialogueEntryLibrary | ImageLibrary | ItemLibrary | LocationLibrary;

// Everything you need to specify for the computer to know how to make the game.
export interface GameConfiguration {
  // All the characters.
  characterLibrary: CharacterLibrary;
  // All the de-copy-fied dialogue trees.
  conversationLibrary: ConversationLibrary;
  // All the copy.
  dialogueEntryLibrary: DialogueEntryLibrary;
  // All the images.
  imageLibrary: ImageLibrary;
  // All the items.
  itemLibrary: ItemLibrary;
  // All the locations.
  locationLibrary: LocationLibrary;
  // The initial event schedule.
  // I guess choices you make might impact your actual event schedule, but TBD.
  initialEventSchedule: EventSchedule;
  // What you start with.
  initialResources: ResourceBundle;
}

/**
 * Just an example to show how it all comes together.
 */
export const EXAMPLE_DUMMY_GAME_CONFIGURATION : GameConfiguration = {
  characterLibrary: {
    jane: {
      name: "Jane Doe",
      title: "Dr.",
      role: CharacterRole.MainCharacter,
      imageId: "jane/portrait"
    },
  },
  conversationLibrary: {
    welcome: {
      location: "jane/home",
      charactersPresent: [
        "jane"
      ],
      // This tree most certainly would have to be constructed with a drag-drop UI.
      initialDialogueNode: {
        dialogEntryId: "jane/hello",
        next: {
          // As a convention, let's just use the choice key of "_" to indicate we intend
          // not to give the player any choice.
          _: {
            dialogEntryId: "gameover/bad",
            isGameOver: true,
          }
        },
        cost: {
          items: {
            // Lose your heart. Sad.
            heart: 1 // For convention, let's just use `1` for the uncountable single items.
          }
        },
        reward: {
          // Doesn't matter what you choose tho...
          Fame: {
            fungibles: {
              [FungibleResource.Notoriety]: 10,
            }
          },
          Fortune: {
            fungibles: {
              [FungibleResource.Money]: 1000,
            },
          },
          Fuel: {
            fungibles: {
              [FungibleResource.Energy]: 10,
            },
          },
          Flatulence: {
            items: {
              farts: 100
            }
          },
          Friendship: {
            relationships: {
              // Truly the greatest love of all.
              jane: 10
            }
          }
        }
      }
    }
  },
  dialogueEntryLibrary: {
    // The slash character "/" is not allowed in javascript barestrings, so we need to add quotes.
    // Otherwise computer thinks we mean division.
    "jane/hello": {
      speakerId: "jane",
      textMarkdown: "Wow what a grand world!",
    },
    "gameover/bad": {
      textMarkdown: "You gave up on life... And your adventure was just getting started too!",
    }
  },
  imageLibrary: {
    "jane/portrait": {
      alt: "A portrait of Jane Doe.",
      url: "404.png", // TBD: Host some images.
    },
    "jane/heart": {
      alt: "A heart that's still beating.",
      url: "404.png", // TBD: Host some images.
    },
    "jane/flat": {
      alt: "This place is disgusting.",
      url: "404.png", // TBD: Host some images.
    },
  },
  itemLibrary: {
    heart: {
      name: "Beating Heart",
      description: "Thump. Thump. Thump.",
      isCountable: false,
      isQuestItem: true,
      imageId: "jane/heart",
    }
  },
  locationLibrary: {
    "jane/home": {
      name: "Your Flat",
      imageId: "jane/flat",
    }
  },
  initialEventSchedule: {
    // Die another day... or today, whatever.
    ["1.0"]: "welcome",
  },
  initialResources: {
    fungibles: {
      [FungibleResource.Money]: 100,
      [FungibleResource.Notoriety]: 0,
      [FungibleResource.Energy]: 0,
    },
    items: {
      heart: 1
    },
    relationships: {
      jane: 0,
    }
  }
}