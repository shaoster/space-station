export interface Image {
  // Caption/subtext available for the image.
  alt: string;
  url: string;  
  // We'll eventually stick the multi-resolution logic underneath here.
}

export type ImageId = string;

export type ImageLibrary = { [key: ImageId]: Image };