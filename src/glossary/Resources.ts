/**
 * This is where we define top-level resources and mechanisms for talking about a collection of resources.
 * 
 * @packageDocumentation
 */

import { CharacterId } from "./Characters";
import { ItemId } from "./Items";

/**
 * Countable core resources we'll need to keep track of.
 * 
 * Inventory and relationship levels aren't included here even though it might make sense
 * to talk about those generically as "resources."
 * For example, we might want to define pretty flexible concepts like:
 *  - "Resource Requirement" 
 *  - "Resource Cost"
 *  - "Resource Rewards"
 * 
 * that might guard certain conversations or events.
 * 
 * These concepts are handled separately for now.
 */
export enum FungibleResource {
  /**
   * How well-known you are.
   * 
   * Also, maybe how close the cops are to raiding you.
   */
  Notoriety,
  /**
   * You use this to buy things.
   */
  Money,
  /**
   * You may or may not need this to do things.
   */
  Energy,
}

/**
 * A really general way of specifying a bundle of resources.
 * These can be used as requirements, costs, or rewards.
 */
export interface ResourceBundle {
  /**
   * The core numeric resources that should show up in your HUD most of the time.
   * 
   * The "Type Declaration" documentation generated for this field is kind of hard to read, so just check out {@link FungibleResource}.
   */
  fungibles?: { [key in FungibleResource]?: number };
  /**
   * The "inventory."
   */
  items?: {
    [key : ItemId] : number
  };
  /**
   * Your closeness with various characters.
   */
  relationships?: {
    [key: CharacterId] : number
  };
}