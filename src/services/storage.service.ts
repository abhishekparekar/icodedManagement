import { deleteObject, getDownloadURL, ref, uploadBytes, getBlob } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export async function uploadProfileImage(
  tenantId: string,
  employeeId: string,
  file: File,
): Promise<string> {
  const path = `tenants/${tenantId}/employees/${employeeId}/${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    const path = decodeURIComponent(imageUrl.split('/o/')[1]?.split('?')[0] ?? '')
    if (path) await deleteObject(ref(storage, path))
  } catch {
    // ignore missing files
  }
}

export async function uploadCompanyLogo(
  tenantId: string,
  file: File,
): Promise<string> {
  const path = `tenants/${tenantId}/company/logo/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function downloadImageAsBase64(url: string): Promise<string> {
  try {
    if (url.includes('firebasestorage.googleapis.com')) {
      const decodedUrl = decodeURIComponent(url)
      const oIndex = decodedUrl.indexOf('/o/')
      if (oIndex !== -1) {
        const questionMarkIndex = decodedUrl.indexOf('?', oIndex)
        const pathPart = questionMarkIndex !== -1 
          ? decodedUrl.substring(oIndex + 3, questionMarkIndex)
          : decodedUrl.substring(oIndex + 3)
          
        const storageRef = ref(storage, pathPart)
        const blob = await getBlob(storageRef)
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    }
  } catch (err) {
    console.error('Failed to download from Firebase Storage', err)
  }
  return url
}
