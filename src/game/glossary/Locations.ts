export interface Location {
  name: string;
  imageId: string;
};

export type LocationId = string;

export type LocationLibrary = { [key: string] : Location};