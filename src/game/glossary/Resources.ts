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
  Notoriety,
  Money,
  Energy,
}

/**
 * A really general way of specifying a bundle of resources.
 * These can be used as requirements, costs, or rewards.
 */
export interface ResourceBundle {
  fungibles?: { [key in FungibleResource]?: number };
  items?: {
    [key : ItemId] : number
  };
  relationships?: {
    [key: CharacterId] : number
  };
}