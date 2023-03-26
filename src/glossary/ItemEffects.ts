import { CharacterId } from "./Characters";
import { ConversationId } from "./Conversations";
import { ItemId } from "./Items";
import { RaceId } from "./Races";

/**
 * The key used to identify a specific item/race interaction.
 */
export interface RaceEffectKey {
    itemId: ItemId;
    raceId: RaceId;
}

/**
 * The key used to identify a specific item/character interaction.
 * 
 * In general, this should be used to override race-level behaviors if there's multiple
 * characters of the same race.
 */
export interface CharacterEffectKey {
    itemId: ItemId;
    characterId: CharacterId;
}

export interface ItemEffect {
    itemId: ItemId;
    raceId: RaceId;
    conversationId?: ConversationId
}

