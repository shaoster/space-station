/**
 * Stuff about defining a {@link Character} is dealt with here.
 * 
 * @packageDocumentation
 */

import { ImageId } from "./Images";
import { RaceId } from "./Races";

export enum CharacterMood {
  Neutral = 0,
  Happy,
  Upset,
};

/**
 * Every character should belong to one and exactly one of these roles.
 * 
 * For situations where a single character might not fit this 1-to-1 designation, we should consider
 * thinking more about a factions mechanic, or allowing a single character to be interacted with
 * via separate role modes.
 * 
 * Maybe your supplier is a cop, but you want the same relationship progress to carry over between
 * both roles.
 */
export enum CharacterRole {
  /**
   * You, or the character you control.
   */
  MainCharacter,
  /**
   * The fuzz. Keep them off your tail.
   */
  LawEnforcement,
  /**
   * You get supplies from these folks.
   */
  Supplier,
  /**
   * You sell stuff to these folks.
   */
  Customer,
  /**
   * You talk to these folks to manage your business.
   */
  Colleague,
}

/**
 * All the data we need to specify for a character in the game.
 */
export interface Character {
  /**
   *  The character's full name.
   **/
  name: string;
  /**
   * A character's title (e.g. Rear Admiral of the Imperial Navy) is often rendered as a subtitle in the UI.
   * 
   * Thus, this is separate from the character's full name.
   **/
  title: string;

  /**
   * Race of the character.
   * From the gameplay perspective, this is primarily useful for managing drug interactions.
   * 
   * Note that this is distinct from {@link role}.
   * 
   */
  raceId: RaceId;

  /**
   * How do you interact with this character?
   */
  role: CharacterRole;
  
  /**
   * to an image in the {@link Images.ImageLibrary}.
   */
  imageIds: {
    [key in CharacterMood]?: ImageId
  };

}

export type CharacterId = string;

/**
 * A collection of characters indexed by a shorthand identifier.
 * 
 * e.g. "jane" would be our identifier for a {@link Character} definition with all the info about Jane.
 */
export type CharacterLibrary = { [key: CharacterId]: Character };