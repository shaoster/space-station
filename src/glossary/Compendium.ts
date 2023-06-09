/**
 * There's a lot of stuff here that isn't particularly helpful for public documentation.
 * 
 * The one thing you want to actually look at is {@link GameConfiguration} to see the top-level data model
 * for how we define all the content for the game.
 * 
 * @packageDocumentation
 **/

import { PathComponent } from "jsonpath";
import { Character, CharacterId, CharacterLibrary, CharacterMood, CharacterRole } from "./Characters";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntry, DialogueEntryId, DialogueEntryLibrary, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "./Conversations";
import { EventSchedule } from "./Events";
import { Image, ImageId, ImageLibrary } from "./Images";
import { Item, ItemId, ItemLibrary } from "./Items";
import { Location, LocationId, LocationLibrary } from "./Locations";
import { Race, RaceId, RaceLibrary } from "./Races";
import { ResourceBundle } from "./Resources";

// Grouping these types this way is a bit heavy-handed, but I'm doing it here to prevent typos where
// everything can be laid out in parallel and visually obvious as a result.
//
// It'll be much harder to remember whether I'm dealing with Foo, FooId or FooLibrary when they're
// bumping up against each other in actual code.

/** @private */
export type IdentifiableEntity = Character | Conversation | DialogueNode | DialogueEntry | Image | Item | Location | Race;

/** @private */
export type EntityId = CharacterId | ConversationId | DialogueNodeId | DialogueEntryId | ImageId | ItemId | LocationId | RaceId;

/** @private */
export type EntityLibrary = CharacterLibrary | ConversationLibrary | DialogueNodeLibrary | DialogueEntryLibrary | ImageLibrary | ItemLibrary | LocationLibrary | RaceLibrary;

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


export type DependencyFinder = (path: PathComponent[], value: any) => PathComponent[][];

/**
 * The keys are outbound foreign relations in JsonPath format.
 * The values are of type DependencyFinder, instead of JsonPath to make it easier
 * to deal with relative paths, which is useful for the dialogueNode stuff.
 **/
export const DATA_DEPENDENCIES : {[key: string]: DependencyFinder}= {
  /// Characters
  "$.characterLibrary.*.imageIds.*":
    (_p, v) => [(["$", "imageLibrary" as PathComponent]).concat([v])],
  "$.characterLibrary.*.raceId":
    (_p, v) => [(["$", "raceLibrary" as PathComponent]).concat([v])],

  /// Locations
  "$.locationLibrary.*.imageId":
    (_p, v) => [(["$", "imageLibrary" as PathComponent]).concat([v])],

  /// Races
  "$.raceLibrary.*.imageId":
    (_p, v) => [(["$", "imageLibrary" as PathComponent]).concat([v])],
  "$.raceLibrary.*.itemAffinities.*":
    (_p, v) => [(["$", "itemLibrary" as PathComponent]).concat(_p.slice(-1))],

  /// Conversations (Interaction Trees)
  "$.conversationLibrary.*.characterIds.*":
    (_p, v) => [(["$", "characterLibrary" as PathComponent].concat([v]))],
  "$.conversationLibrary.*.locationId": 
    (_p, v) => [(["$", "locationLibrary" as PathComponent].concat([v]))],
  "$.conversationLibrary.*.initialDialogueNodeId":
    (p, v) => [(p.slice(0, -1).concat(["dialogueNodeLibrary"]).concat([v]))],
  "$.conversationLibrary.*.dialogueNodeLibrary.*.next.*":
    (p, v) => [(p.slice(0, -3).concat([v]))],
  "$.conversationLibrary.*.dialogueNodeLibrary.*.dialogueEntryId":
    (p, v) => [(["$", "dialogueEntryLibrary" as PathComponent]).concat([v])],

  /// Dialogue Entries (Dialogue Copy)
  "$.dialogueEntryLibrary.*.speakerId":
    (_p, v) => [(["$", "characterLibrary" as PathComponent]).concat([v])],

  /// Items
  "$.itemLibrary.*.imageId":
    (_p, v) => [(["$", "imageLibrary" as PathComponent]).concat([v])],

  /// Initial Schedule
  "$.initialEventSchedule.*":
    (_p, vs: any[]) => vs.map(v => (["$", "conversationLibrary" as PathComponent].concat([v]))),

  /// Initial Resources
  "$.initialResources.items.*":
    (_p, v) => [(["$", "itemLibrary" as PathComponent]).concat(_p.slice(-1))],

};

export const EXAMPLE_CHARACTER : Character = {
  name: "Jane Doe",
  title: "The Proctor",
  role: CharacterRole.MainCharacter,
  imageIds: {
    [CharacterMood.Neutral]: "jane/portrait" 
  },
  raceId: "human"
};

// A test example for now.
export const EXAMPLE_CONVERSATION : Conversation = {
  characterIds: ["jane", "baz"],
  initialDialogueNodeId: "0",
  dialogueNodeLibrary: {
    "0": {
      dialogueEntryId: "hello",
      next: {
        _: "1"
      }
    },
    "1": {
      dialogueEntryId: "goodbye",
      isGameOver: true,
      next: {}
    }
  },
  locationId: "bar"
};

export const EXAMPLE_IMAGE: Image = {
  alt: "Don't push this to prod.",
  /* TODO: Re-host placeholders. */
  /* https://www.svgrepo.com/svg/51211/question-mark */
  url: "https://www.svgrepo.com/show/51211/question-mark.svg",
};

export const EXAMPLE_ITEM: Item = {
  name: "Beating Heart",
  description: "Thump. Thump. Thump.",
  isQuestItem: true,
  imageId: "jane/heart",
};

export const EXAMPLE_RACE: Race = {
  raceName: "The Coalition of Human Races",
  imageId: "jane/portrait",// You are the avatar of humanity!
  // I guess humanity is neutral by default?
  itemAffinities: {}
};

export const EXAMPLE_DIALOGUE_ENTRY : DialogueEntry = {
  textMarkdown: `One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.
He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.
The bedding was hardly able to cover it and seemed ready to slide off any moment.
His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. "What's happened to me?" he thought.`, 
};

/**
 * @hidden
 */
const EMPTY_GAME_CONFIGURATION : GameConfiguration = {
  characterLibrary: {
    jane: EXAMPLE_CHARACTER,
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
    human: EXAMPLE_RACE,
  },
  conversationLibrary: {
    welcome: EXAMPLE_CONVERSATION
  },
  dialogueEntryLibrary: {
    lorem: EXAMPLE_DIALOGUE_ENTRY,
    hello: {
      speakerId: "baz",
      textMarkdown: `Howdy, Pardner!`, 
    },
    goodbye: {
      speakerId: "baz",
      textMarkdown: `Catch you... on the flip side...`,
    },
  },
  imageLibrary: {
    "tbd": EXAMPLE_IMAGE,
    "jane/portrait": {
      alt: "Your face.",
      /* https://www.svgrepo.com/svg/169450/smiley-face */
      url: "https://www.svgrepo.com/show/169450/smiley-face.svg",
    },
    "jane/home": {
      alt: "Your flat.",
      /* https://www.svgrepo.com/svg/513635/house */
      url: "https://www.svgrepo.com/show/513635/house.svg",
    },
    "jane/heart": {
      alt: "Your heart.",
      /* https://www.svgrepo.com/svg/105119/heart */
      url: "https://www.svgrepo.com/show/105119/heart.svg",
    }

  },
  itemLibrary: {
    "jane/heart": EXAMPLE_ITEM,
  },
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
  initialEventSchedule: {
  },
  initialResources: {},
};

export function newGameConfiguration() : GameConfiguration {
  return {
    ...EMPTY_GAME_CONFIGURATION
  };
}