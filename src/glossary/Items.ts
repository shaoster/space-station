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
   * Indicator for whether this is a one-off item.
   * TBD: Potentially roll this into an "item type" field.
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
