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
export type EventSchedule = { [key: TimeCoordinate] : [ConversationId] }

/**
 * Define the canonical mapping from turn to time coordinate.
 */
export const getDayAndStageFromTurn = (turn: number) : [number, DayStage] => {
  const stageCount = Object.keys(DayStage).length;
  const [day, stageIndex] = [(Math.floor((turn-1) / stageCount) + 1), (turn - 1) % stageCount];
  const stage = Object.values(DayStage)[stageIndex];
  return [day, stage];
}

export const getTimeCoordinateFromTurn = (turn: number) : TimeCoordinate => {
  const [day, stage] = getDayAndStageFromTurn(turn);
  return `${day}.${stage}`;
}

export const getTimeCoordinateFromDayAndStage = (day: number, stage: DayStage) : TimeCoordinate => {
  return `${day}.${stage}`;
}

export const getTurnFromTimeCoordinate = (tc: TimeCoordinate) : number => {
  const pattern = /^([0-9]+)\.(.+)$/;
  const match = pattern.exec(tc);
  if (match === null) {
    throw new Error("Invalid time coordinate.");
  }
  const day : number = parseInt(match[0]);
  const stage = Object.keys(DayStage).indexOf(match[1]);
  // Test cases, 1.Morning , 5.LateNight.
  return (day - 1) * Object.keys(DayStage).length + stage + 1;
}