/**
 * Art and stuff. 
 * 
 * @packageDocumentation
 */

/**
 * A placeholder concept for when we get images.
 */
export interface Image {
  /** Caption/subtext available for the image. */
  alt: string;
  /** The url for the image, eventually. */
  url: string;  
}

/**
 * A short-hand identifier for an image, like "jane/portrait".
 */
export type ImageId = string;

/**
 * The library containing all the images we know of, indexed by a short-hand identifier, like "jane/portrait".
 */
export type ImageLibrary = { [key: ImageId]: Image };