import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'

// Maximum image dimensions and file size
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const MAX_FILE_SIZE = 400 * 1024 // 400 KB
const JPEG_QUALITY = 0.85

/**
 * Convert base64 data URL to Blob
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Compress and resize image to reduce file size
 * @param dataURL - Base64 data URL of the image
 * @returns Compressed base64 data URL
 */
const compressImage = async (dataURL: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const aspectRatio = width / height
        if (width > height) {
          width = MAX_WIDTH
          height = Math.round(MAX_WIDTH / aspectRatio)
        } else {
          height = MAX_HEIGHT
          width = Math.round(MAX_HEIGHT * aspectRatio)
        }
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      // Use better quality settings
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      
      // Try different quality levels to stay under file size limit
      let quality = JPEG_QUALITY
      let compressedDataURL = canvas.toDataURL('image/jpeg', quality)
      
      // Reduce quality if file is still too large
      while (compressedDataURL.length > MAX_FILE_SIZE * 1.37 && quality > 0.5) {
        quality -= 0.05
        compressedDataURL = canvas.toDataURL('image/jpeg', quality)
      }
      
      resolve(compressedDataURL)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = dataURL
  })
}

/**
 * Upload recipe image to Firebase Storage
 * @param imageDataUrl - Base64 data URL of the image
 * @param recipeId - Unique recipe ID (will be used as filename)
 * @returns Download URL of the uploaded image
 */
export const uploadRecipeImage = async (
  imageDataUrl: string,
  recipeId: string
): Promise<string> => {
  try {
    // Compress image before upload to reduce storage costs
    const compressedDataUrl = await compressImage(imageDataUrl)
    
    // Convert data URL to Blob
    const blob = dataURLtoBlob(compressedDataUrl)
    
    // Log compression stats
    const originalSize = Math.round((imageDataUrl.length * 0.75) / 1024)
    const compressedSize = Math.round(blob.size / 1024)
    console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)
    
    // Create a reference to the storage location
    const storageRef = ref(storage, `recipes/${recipeId}/image.jpg`)
    
    // Upload the image
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000' // Cache for 1 year
    })
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete recipe image from Firebase Storage
 * @param recipeId - Recipe ID whose image should be deleted
 */
export const deleteRecipeImage = async (recipeId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `recipes/${recipeId}/image.jpg`)
    await deleteObject(storageRef)
  } catch (error) {
    // Ignore errors if image doesn't exist
    console.warn('Error deleting image (may not exist):', error)
  }
}
