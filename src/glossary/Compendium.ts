/**
 * There's a lot of stuff here that isn't particularly helpful for public documentation.
 * 
 * The one thing you want to actually look at is {@link GameConfiguration} to see the top-level data model
 * for how we define all the content for the game.
 * 
 * @packageDocumentation
 **/

import { Character, CharacterId, CharacterLibrary, CharacterMood, CharacterRole } from "./Characters";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntry, DialogueEntryId, DialogueEntryLibrary, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "./Conversations";
import { EventSchedule } from "./Events";
import { Image, ImageId, ImageLibrary } from "./Images";
import { Item, ItemId, ItemLibrary } from "./Items";
import { Location, LocationId, LocationLibrary } from "./Locations";
import { RaceLibrary } from "./Races";
import { ResourceBundle } from "./Resources";

// Grouping these types this way is a bit heavy-handed, but I'm doing it here to prevent typos where
// everything can be laid out in parallel and visually obvious as a result.
//
// It'll be much harder to remember whether I'm dealing with Foo, FooId or FooLibrary when they're
// bumping up against each other in actual code.

/** @private */
export type IdentifiableEntity = Character | Conversation | DialogueNode | DialogueEntry | Image | Item | Location;

/** @private */
export type EntityId = CharacterId | ConversationId | DialogueNodeId | DialogueEntryId | ImageId | ItemId | LocationId;

/** @private */
export type EntityLibrary = CharacterLibrary | ConversationLibrary | DialogueNodeLibrary | DialogueEntryLibrary | ImageLibrary | ItemLibrary | LocationLibrary;

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
      locationId: "jane/home",
      characterIds: [
        "jane"
      ],
      // This tree most certainly would have to be constructed with a drag-drop UI.
      initialDialogueNode: {
        dialogueEntryId: "jane/hello",
        next: {
          // As a convention, let's just use the choice key of "_" to indicate we intend
          // not to give the player any choice.
          _: {
            dialogueEntryId: "gameover/bad",
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
  /** All the races, indexed by a shorthand id (i.e. "human") */
  raceLibrary: RaceLibrary;
  
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

/**
 * @hidden
 */
const EMPTY_GAME_CONFIGURATION : GameConfiguration = {
  characterLibrary: {
    jane: {
      name: "Jane Doe",
      title: "The Proctor",
      role: CharacterRole.MainCharacter,
      imageIds: {
        [CharacterMood.Neutral]: "jane/portrait" 
      },
      raceId: "human"
    },
    baz: {
      name: "Baz Buzz",
      title: "Boozelfop",
      role: CharacterRole.Colleague,
      imageIds: {
        [CharacterMood.Neutral]: "jane/portrait" 
      },
      raceId: "human"
    }
  },
  raceLibrary: {
    human: {
      raceName: "The Coalition of Human Races",
      imageId: "jane/portrait" // You are the avatar of humanity!
    }
  },
  conversationLibrary: {},
  dialogueEntryLibrary: {
    hello: {
      textMarkdown: `One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. "What's happened to me?" he thought.`, 
    },
    goodbye: {
      textMarkdown: `It wasn't a dream. His room, a proper human room although a little too small, lay peacefully between its four familiar walls. A collection of textile samples lay spread out on the table - Samsa was a travelling salesman - and above it there hung a picture that he had recently cut out of an illustrated magazine and housed in a nice, gilded frame. It showed a lady fitted out with a fur hat and fur boa who sat upright, raising a heavy fur muff that covered the whole of her lower arm towards the viewer.`,
    }
  },
  imageLibrary: {
    "jane/portrait": {
      alt: "Your face.",
      url: "404.png",
    },
    "jane/home": {
      alt: "Your flat.",
      url: "404.png",
    }
  },
  itemLibrary: {},
  locationLibrary: {
    home: {
      name: "Your Apartment",
      description: "It's pretty dusty, I guess.",
      imageId: "jane/home"
    },
    bar: {
      name: "The Bar",
      description: "This is just your house?",
      imageId: "jane/home"
    }
  },
  initialEventSchedule: {},
  initialResources: {},
}

export function newGameConfiguration() : GameConfiguration {
  return {
    ...EMPTY_GAME_CONFIGURATION
  };
}