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
export enum DayPhase {
  /**
   * Morning is the first phase each day, I guess.
   */
  Morning = 0,
  Afternoon,
  Evening,
  /**
   * LateNight might be the last phase each day?
   */
  LateNight
}

/**
 * A standardized way of referring to a specific point in time.
 * TBD: Clarify how to work with this thing as a text string.
 * For now, we can just talk about it like "3.Morning" or "3.0"
 **/
export type TimeCoordinate = `${number}.${DayPhase}`;

/**
 * An EventSchedule corresponds to all of the events that are currently 
 * scheduled by the game.
 * 
 * For now, the "events" are just {@link Conversations.Conversation} objects referenced
 * by an identifier into the {@link Conversations.ConversationLibrary}.
 */
export type EventSchedule = { [key: TimeCoordinate] : ConversationId }