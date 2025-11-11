import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'

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
    // Convert data URL to Blob
    const blob = dataURLtoBlob(imageDataUrl)
    
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
