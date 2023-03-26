import { ImageId } from "./Images";

/**
 * A Race object defines a set of characteristics common to members of a race.
 * This is critical for drug interactions, but initially stands in for faction as well.
 */
export interface Race {
    /**
     * The proper noun form of the race as a whole. e.g. "The Globulans"
     */
    raceName: string;

    /**
     * An emblem or seal for this race.
     */
    imageId: ImageId;

}

/**
 * Shorthand identifier for the race.
 * 
 * This isn't directly exposed to the player, so feel free to use a name like "glob" for "The Globulans".
 */
export type RaceId = string;

export type RaceLibrary = { [key : RaceId] : Race};