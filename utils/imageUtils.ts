/**
 * Image Utility Functions
 * Provides image compression and base64 conversion for inventory items
 */

import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImageResult {
  base64: string;
  uri: string;
  width: number;
  height: number;
}

/**
 * Compress an image to 300x300 pixels and convert to base64
 * @param imageUri - URI of the image to compress (from camera or gallery)
 * @returns Promise with compressed image data including base64 string
 */
export async function compressAndEncodeImage(imageUri: string): Promise<CompressedImageResult> {
  try {
    // Compress and resize image to 300x300
    const compressedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: 300,
            height: 300,
          },
        },
      ],
      {
        compress: 0.8, // 80% quality for good balance of size/quality
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // This will generate base64 string
      }
    );

    if (!compressedImage.base64) {
      throw new Error('Failed to generate base64 string');
    }

    return {
      base64: compressedImage.base64,
      uri: compressedImage.uri,
      width: compressedImage.width,
      height: compressedImage.height,
    };
  } catch (error) {
    console.error('Error compressing and encoding image:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}

/**
 * Create a data URI from base64 string for display purposes
 * @param base64String - Base64 encoded image string (without data URI prefix)
 * @returns Full data URI string that can be used in Image components
 */
export function createDataUri(base64String: string): string {
  return `data:image/jpeg;base64,${base64String}`;
}

/**
 * Extract base64 string from data URI
 * @param dataUri - Full data URI string
 * @returns Just the base64 string part
 */
export function extractBase64(dataUri: string): string {
  return dataUri.replace(/^data:image\/[a-z]+;base64,/, '');
}

/**
 * Validate if a string is a valid base64 image
 * @param base64String - String to validate
 * @returns Boolean indicating if string is valid base64
 */
export function isValidBase64Image(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // Check if it's a proper base64 string
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(base64String) && base64String.length > 0;
}

/**
 * Get estimated file size of base64 image in bytes
 * @param base64String - Base64 encoded image string
 * @returns Estimated size in bytes
 */
export function getBase64ImageSize(base64String: string): number {
  // Base64 encoding increases size by ~33%
  // Each base64 character represents 6 bits
  return Math.round((base64String.length * 6) / 8);
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "45.2 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
} 