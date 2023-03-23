export interface Item {
  name: string;
  description: string;
  imageId: string;

  // TBD: These two might be the same.
  // Defaults to true if not given.
  isCountable?: boolean;
  // Defaults to false if not given.
  isQuestItem?: boolean;
}

export type ItemId = string;

/**
 * A compendium of items and their descriptions.
 */
export type ItemLibrary = { [key: ItemId] : Item };
