/**
 * The specifics of inventory management are dealt with here.
 * Collections of things are dealt with more broadly in {@link Resources.ResourceBundle}.
 * 
 * @packageDocumentation
 */

import { ImageId } from "./Images";

/**
 * Items are cool, I guess.
 */
export interface Item {
  /**
   * The top-level label of an item.
   **/
  name: string;
  /**
   * The sub-label of the item.
   * 
   * This copy should be gameplay-directed.
   **/
  description: string;
  /**
   * Optional additional sub-label of the item.
   * 
   * This copy should be lore-directed.
   **/
  flavor?: string;

  /**
   * A shorthand identifier for an {@link Images.Image} in an {@link Images.ImageLibrary}.
   */
  imageId: ImageId;

  /**
   * TBD: This and {@link isQuestItem} are probably the same thing.
   * 
   * Defaults to true by default.
   */
  isCountable?: boolean;

  /**
   * TBD: This and {@link isCountable} are probably the same thing.
   * 
   * Defaults to false by default.
   */
  isQuestItem?: boolean;
}

/**
 * A shorthand identifier for an item, like "drugs/happiness".
 */
export type ItemId = string;

/**
 * A compendium of items and their descriptions, indexed by a shorthand identifier, like "drugs/happiness".
 */
export type ItemLibrary = { [key: ItemId] : Item };
