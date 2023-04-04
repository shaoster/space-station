/**
 * Stuff about defining a {@link Conversation}, including most copy concerns, are dealt with here.
 * 
 * @packageDocumentation
 */

import { CharacterId } from "./Characters";
import { DependencyLister } from "./Compendium";
import { ImageId } from "./Images";
import { LocationId } from "./Locations";
import { ResourceBundle } from "./Resources";

/**
 * The smallest cell for copy.
 */
export interface DialogueEntry {
  /**
   * An identifier for the {@link Characters.Character} that should be speaking, registered in the
   * {@link Characters.CharacterLibrary}.
   * 
   * An unspecified {@link speakerId} will be interpreted to be the narrator voice.
   */
  speakerId?: CharacterId;
  /**
   * Markdown-formatted dialogue copy.
   */
  textMarkdown: string; 
  /**
   * Maybe we want some non-location character sprite too if they're particularly emotive?
   */
  imageId?: ImageId; 
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
  /**
   * The copy snippet to associate with this node.
   * 
   * This is an identifier to a {@link DialogueEntry} in the {@link DialogueEntryLibrary}.
   */
  dialogueEntryId: DialogueEntryId;

  /**
   * Maybe this character is calling on the phone and we want a cut-in when they talk.
   * Can be omitted to just use the location of the top-level conversation.
   * I'm including this initially because I foresee us using this as a flag for "shop-like"
   * situations where we want to resort to a different UI when we're shoehorning a
   * dialogue tree to model a shopping spree.
   **/
  locationId?: string;
  
  /**
   * This is where we set up the dialogue tree.
   * This field specifies 0 or more subsequent other {@link DialogueNode} instances inline.
   *  - If 0 or unspecified, this is the end of the conversation.
   *  - If 1, the dialogue continues without player action. The choice key is ignored.
   *  - If more than 1, the player is presented with (at least the illusion of) a choice.
   *    * The choice key will represent the textual label corresponding to each choice.
   * 
   * Note: In practice, a dialogue node might be locked behind a resource requirement.
   * For now, we have no way of distinguishing between hidden and visible unmet requirements, but
   * this is where we would add it in the future. 
   **/
  next: { [key: string] : DialogueNodeId };

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

  /**
   * This is only used in the studio to persist 
   */
  position?: {
    x: number,
    y: number
  }
}


export const getDialogueNodeDependencies : DependencyLister<DialogueNode> = (prefix: string[], key: string, node: DialogueNode) => {
  let deps : string[][] = [];
  // Siblings.
  for (const sibling of Object.values(node.next)) {
    deps.push(
      prefix.concat(sibling)
    );
  }
  // Dialogue Entries.
  deps.push(
    ["dialogueEntryLibrary", node.dialogueEntryId]
  );

  // Locations.
  if (typeof node.locationId !== "undefined") {
    deps.push(
      ["locationLibrary", node.locationId]
    )
  }
  console.log("Dependencies:", deps);
  return deps;
};


export const getConversationDependencies : DependencyLister<Conversation> = (prefix: string[], key: string, conversation: Conversation) => {
  let deps : string[][] = [];
  for (const characterId of conversation.characterIds) {
    deps.push(
      ["characterLibrary", characterId]
    );
  }
  deps.push(
    prefix.concat(key).concat(["dialogueNodeLibrary", conversation.initialDialogueNodeId])
  )
  deps.push(
    ["locationLibrary", conversation.locationId]
  )
  let nodeDeps : string[][] = [];
  for (const [id, node] of Object.entries(conversation.dialogueNodeLibrary)) {
    nodeDeps = nodeDeps.concat(getDialogueNodeDependencies(
      prefix.concat([key, "dialogueNodeLibrary"]), id, node
    ));
  }
  return deps.concat(nodeDeps);
};

export type DialogueNodeId = string;
export type DialogueNodeLibrary = { [key: DialogueNodeId]: DialogueNode };
/**
 * A conversation represents an top-level interaction with one or more characters.
 * 
 * This can be encountered:
 *  - manually, by going up to somebody and talking to them, or
 *  - automatically, by getting to a certain point in the game.
 */
export interface Conversation {
  /**
   * Where are you when this conversation is happening?
   * The {@link Locations.LocationId} is a reference into the {@link Locations.LocationLibrary}.
   */
  locationId: LocationId;
  /**
   * It might be useful for UI reasons to show which characters are present in the
   * conversation at the outset.
   */
  characterIds: CharacterId[];
  /**
   * The entry point into how we set up the dialogue tree for this interaction.
   */
  initialDialogueNodeId: DialogueNodeId;

  /**
   * Scoped dialogue node library for this conversation.
   * "Scoped" here means that an id of "foo" can be reused for different dialogue nodes
   * in different conversations without colliding.
   */
  dialogueNodeLibrary: {
    [key : DialogueNodeId] : DialogueNode
  }
}

export type ConversationId = string;

export type ConversationLibrary = { [key: ConversationId] : Conversation };