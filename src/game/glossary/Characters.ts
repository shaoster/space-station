export enum CharacterRole {
  MainCharacter,
  LawEnforcement,
  Supplier,
  Customer,
  Colleague,
}

export interface Character {
  name: string;
  title: string;
  faction?: never; // No factions yet.
  role: CharacterRole;
  imageId: string;

}

export type CharacterId = string;

export type CharacterLibrary = { [key: CharacterId]: Character };