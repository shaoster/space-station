import { ConversationId } from "./Conversation";

export enum DayPhase {
  Morning = 0,
  Afternoon,
  Evening,
  LateNight
}

// A standardized way of referring to a specific point in time.
// TBD: Clarify how to work with this thing as a text string.
// For now, we can just talk about it like "3.Morning" or "3.0"
export type TimeCoordinate = `${number}.${DayPhase}`;

export type EventSchedule = { [key: TimeCoordinate] : ConversationId }