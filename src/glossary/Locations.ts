/**
 * Where you can go.
 * 
 * @packageDocumentation
 */

import { ImageId } from "./Images";

/**
 * A physical (or virtual) space in the game.
 */
export interface Location {
  /**
   * The top-level label text for this location.
   */
  name: string;
  /**
   * A sub-label containing additional information.
   */
  description: string;
  /** An shorthand identifier for the image, registerd in an {@link Images.ImageLibrary}. */
  imageId: ImageId;
};

/**
 * A shorthand identifer for a location, like "loading-dock".
 */
export type LocationId = string;

/**
 * A compendium of locations and their descriptions, indexed by a shorthand identifier, like "loading-dock".
 */
export type LocationLibrary = { [key: string] : Location};