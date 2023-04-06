/**
 * This is where we talk about scheduling events.
 * 
 * For now, "events" are just {@link Conversations.Conversation}.
 * 
 * @packageDocumentation
 */

import { ConversationId } from "./Conversations";

/**
 * This is where we decide how many phases a given day has.
 */
export enum DayStage {
  /**
   * Morning is the first phase each day, I guess.
   */
  Morning = "Morning",
  Afternoon = "Afternoon",
  Evening = "Evening",
  /**
   * LateNight might be the last phase each day?
   */
  LateNight = "LateNight"
}

/**
 * A standardized way of referring to a specific point in time.
 * TBD: Clarify how to work with this thing as a text string.
 * For now, we can just talk about it like "3.Morning"
 **/
export type TimeCoordinate = `${number}.${DayStage}`;

/**
 * An EventSchedule corresponds to all of the events that are currently 
 * scheduled by the game.
 * 
 * For now, the "events" are just {@link Conversations.Conversation} objects referenced
 * by an identifier into the {@link Conversations.ConversationLibrary}.
 */
export type EventSchedule = { [key: TimeCoordinate] : ConversationId }