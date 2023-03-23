/**
 * There's a lot of stuff here that isn't particularly helpful for public documentation.
 * 
 * The one thing you want to actually look at is {@link GameConfiguration} to see the top-level data model
 * for how we define all the content for the game.
 * 
 * @packageDocumentation
 **/

import { Character, CharacterId, CharacterLibrary} from "./Characters";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntry, DialogueEntryId, DialogueEntryLibrary } from "./Conversations"
import { Item, ItemId, ItemLibrary } from "./Items";
import { Image, ImageId, ImageLibrary } from "./Images";
import { Location, LocationId, LocationLibrary } from "./Locations";
import { EventSchedule } from "./Events";
import { ResourceBundle } from "./Resources";

/** @private */
export type IdentifiableEntity = Character | Conversation | DialogueEntry | Image | Item | Location;

/** @private */
export type EntityId = CharacterId | ConversationId | DialogueEntryId | ImageId | ItemId | LocationId;

/** @private */
export type EntityLibrary = CharacterLibrary | ConversationLibrary | DialogueEntryLibrary | ImageLibrary | ItemLibrary | LocationLibrary;

/**
 * 
 * Everything you need to specify for the computer to know how to make the game.
 * 
 * @example
 * {
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
*/
export interface GameConfiguration {
  /** All the characters, indexed by a shorthand id (i.e. "jane"). */
  characterLibrary: CharacterLibrary;
  /** All the conversations, indexed by a shorthand id (i.e. "first-taste-of-blood"). */
  conversationLibrary: ConversationLibrary;
  /** All the dialogue copy, indexed by a shorthand id (i.e. "jane/greeting"). */
  dialogueEntryLibrary: DialogueEntryLibrary;
  /** All the images, indexed by a shorthand id (i.e. "jane/portrait"). */
  imageLibrary: ImageLibrary;
  /** All the items, indexed by a shorthand id (i.e. "drugs/awesome-sauce") */
  itemLibrary: ItemLibrary;
  /** All the locations, indexed by a shorthand id (i.e. "loading-docks") */
  locationLibrary: LocationLibrary;
  
  /**
   * The initial event schedule.
   * 
   * I guess choices you make might impact your actual event schedule, but TBD.
   **/
  initialEventSchedule: EventSchedule;

  /**
   * The set of resources you start the game with.
   **/
  initialResources: ResourceBundle;
}