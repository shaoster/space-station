import { Character, CharacterId } from "./Characters";
import { LocationId } from "./Locations";
import { ResourceBundle } from "./Resources";

/**
 * The smallest cell for copy.
 */
export interface DialogueEntry {
  // An unspecified speakerId will be interpreted to be narrator voice.
  speakerId?: string;
  // Markdown-formatted dialogue.
  textMarkdown: string; 
  // Maybe we want some non-location character sprite too if they're particularly emotive?
  // idk.
  imageId?: string; 
}

export type DialogueEntryId = string;

/**
 * A dumping ground for dialogue entries.
 * Splitting dialogue entries from dialogue nodes, instead of including copy in-line with a dialogue tree,
 * lets us do nice things like infinite dialogue loops.
 * 
 * Additionally, as a matter of convenience, it's probably easier to write and manage a bunch of reusable
 * dialogue cells (think catch-phrases) and then assemble them together later instead of writing a
 * giant dialogue tree at once.
 * 
 * This data delineation reflects my preference toward that authoring workflow.
 * 
 * Note: This library is not partitioned by speaker or location or anything for now, but we can revisit this
 * if we want to make our dialogue copy more maintainable.
 * 
 * In the meantime, I recommend just using identifiers like <speaker>/<entryShorthand>
 *  e.g. "thomas/bye" -> Cpl. Thomas Marx saying "Smell ya later, kid."
 */
export type DialogueEntryLibrary = { [key: DialogueEntryId] : DialogueEntry };

export interface DialogueNode {
  // The copy snippet to associate with this node.
  dialogEntryId: DialogueEntryId;

  // Maybe this character is calling on the phone and we want a cut-in when they talk.
  // Can be omitted to just use the location of the top-level conversation.
  // I'm including this initially because I foresee us using this as a flag for "shop-like"
  // situations where we want to resort to a different UI when we're shoehorning a
  // dialogue tree to model a shopping spree.
  locationIdOverride?: string;
  
  // 0 or more subsequent dialogue nodes.
  // If 0 or unspecified, this is the end of the conversation.
  // If 1, the dialogue continues without player action. The choice key is ignored.
  // If more than 1, the player is presented with (at least the illusion of) a choice.
  //    * The choice key will represent the textual label corresponding to each choice.
  // (In practice, a dialogue node might be locked behind a resource requirement.)
  //
  // For now, we have no way of distinguishing between hidden and visible unmet requirements, but
  // this is where we would add it in the future. 
  next?: { [key: string] : DialogueNode };

  // requirement, cost, and reward are the same type of thing, but mean different things.
  // We might have a requirement for unlocking this conversation node, but not incur that cost for doing so.
  //    e.g. You have to show me you have $100 to be fancy enough to enter the club, but I'll only charge you 
  //         a $10 if you've got the goods. 
  // 
  // Likewise, we might have differences in UI presentation between costs and rewards.
  requirement?: ResourceBundle;
  cost?: ResourceBundle;
  // ... Specifically, we may want to allow the player to choose from a list of rewards.
  // The key will be the text label corresponding to the choice.
  reward?: { [key: string] : ResourceBundle };

  // For now, this seems like the easiest way to model a game-over. Defaults to false.
  isGameOver?: boolean;
}

/**
 * A conversation represents an top-level interaction with one or more characters.
 * This can be encountered:
 *  - manually, by going up to somebody and talking to them, or
 *  - automatically, by getting to a certain point in the game.
 */
export interface Conversation {
  location: LocationId;
  charactersPresent: CharacterId[];
  initialDialogueNode: DialogueNode;
}

export type ConversationId = string;

export type ConversationLibrary = { [key: ConversationId] : Conversation };