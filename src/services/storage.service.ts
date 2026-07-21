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

/**
 * Downloads an image and converts it to Base64.
 * If Firebase Storage or URL download fails (CORS, network error, or timeout),
 * it returns the local fallback logo `/company_logo1.jpeg` safely.
 */
export async function downloadImageAsBase64(url: string): Promise<string> {
  if (!url || url === '/company_logo1.jpeg') return '/company_logo1.jpeg'
  if (url.startsWith('data:')) return url

  // 1. Try Firebase SDK getBlob with 3 second timeout race
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

        // Race getBlob with a 2.5s timeout to prevent long hanging retries on CORS blocks
        const blobPromise = getBlob(storageRef)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage blob download timeout')), 2500)
        )

        const blob = await Promise.race([blobPromise, timeoutPromise])

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    }
  } catch {
    // Silently fall through to image element canvas loader or fallback logo
  }

  // 2. Fallback: Try HTML Image element via canvas
  try {
    const base64FromCanvas = await new Promise<string>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const timer = setTimeout(() => resolve('/company_logo1.jpeg'), 2000)

      img.onload = () => {
        clearTimeout(timer)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || 120
          canvas.height = img.naturalHeight || 120
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
            return
          }
        } catch {
          // Canvas tainted by CORS -> resolve local fallback
        }
        resolve('/company_logo1.jpeg')
      }

      img.onerror = () => {
        clearTimeout(timer)
        resolve('/company_logo1.jpeg')
      }

      img.src = url
    })

    return base64FromCanvas
  } catch {
    return '/company_logo1.jpeg'
  }
}
