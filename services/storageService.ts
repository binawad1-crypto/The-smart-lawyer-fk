import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file will be stored (e.g., 'site/logo.png').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading file to ${path}:`, error);
    throw new Error('File upload failed.');
  }
};
