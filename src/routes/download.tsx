import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  X,
  Download as DownloadIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { getSoundCloudTrackInfo, getSoundCloudTrackPreview, type TrackPreview } from '@/lib/soundcloud-download'
import JSZip from 'jszip'

export const Route = createFileRoute('/download')({
  component: DownloadPage,
})

interface DownloadStatus {
  url: string
  status: 'idle' | 'downloading' | 'success' | 'error'
  message?: string
}

function DownloadPage() {
  const [urls, setUrls] = useState<string[]>([''])
  const [clientId, setClientId] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [downloadStatuses, setDownloadStatuses] = useState<Map<string, DownloadStatus>>(new Map())
  const [isDownloading, setIsDownloading] = useState(false)
  const [trackPreviews, setTrackPreviews] = useState<Map<string, TrackPreview>>(new Map())
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set())
  const [downloadAsZip, setDownloadAsZip] = useState(false)
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    // Charger le client ID et access token depuis localStorage
    const savedClientId = localStorage.getItem('soundcloud_client_id') || ''
    const savedAccessToken = localStorage.getItem('soundcloud_access_token') || ''
    setClientId(savedClientId)
    setAccessToken(savedAccessToken)
  }, [])

  const fetchTrackPreview = async (url: string) => {
    if (!clientId || !url.trim()) {
      return
    }

    // Vérifier si c'est une URL SoundCloud valide
    if (!url.includes('soundcloud.com')) {
      return
    }

    setLoadingPreviews((prev) => new Set(prev).add(url))

    try {
      const preview = await getSoundCloudTrackPreview({
        data: { url, clientId, accessToken },
      })
      setTrackPreviews((prev) => {
        const newMap = new Map(prev)
        newMap.set(url, preview)
        return newMap
      })
    } catch (error) {
      console.error('Error retrieving preview:', error)
    } finally {
      setLoadingPreviews((prev) => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }

  const handleUrlChange = (value: string) => {
    // Debounce pour récupérer la preview
    const timerId = debounceTimers.current.get(-1)
    if (timerId) {
      clearTimeout(timerId)
    }

    if (value.trim() && value.includes('soundcloud.com')) {
      const newTimer = setTimeout(async () => {
        await fetchTrackPreview(value)
        // Une fois la preview chargée, mettre à jour les URLs
        setUrls((prev) => {
          // Remplacer le premier input vide par l'URL validée et ajouter un nouvel input
          const emptyIndex = prev.findIndex((url) => url.trim() === '')
          if (emptyIndex !== -1) {
            const newUrls = [...prev]
            newUrls[emptyIndex] = value
            // S'assurer qu'il y a toujours un input vide à la fin
            if (!newUrls.some((url) => url.trim() === '')) {
              newUrls.push('')
            }
            return newUrls
          }
          return [...prev, value, '']
        })
      }, 500)
      debounceTimers.current.set(-1, newTimer)
    }
  }

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls((prev) => {
      const filtered = prev.filter((url) => url !== urlToRemove)
      // S'assurer qu'il y a toujours au moins un input vide
      if (filtered.every((url) => url.trim() !== '')) {
        return [...filtered, '']
      }
      return filtered
    })
    setTrackPreviews((prev) => {
      const newMap = new Map(prev)
      newMap.delete(urlToRemove)
      return newMap
    })
  }

  const handleDownloadSingle = async (url: string) => {
    if (!clientId) {
      alert('Please configure your Soundcloud Client ID in settings')
      return
    }

    try {
      // Get track information and download URL from server
      const result = await getSoundCloudTrackInfo({
        data: { url, clientId, accessToken },
      })

      if (result.success && result.downloadUrl && result.trackTitle) {
        // Download file on client side
        const response = await fetch(result.downloadUrl)
        if (!response.ok) {
          throw new Error('Error downloading file')
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${result.trackTitle}.mp3`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        alert(result.error || 'Error downloading')
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Error downloading',
      )
    }
  }

  const handleDownload = async () => {
    if (!clientId) {
      alert('Please configure your Soundcloud Client ID in settings')
      return
    }

    const validUrls = urls.filter((url) => url.trim() !== '')
    if (validUrls.length === 0) {
      alert('Please enter at least one URL')
      return
    }

    setIsDownloading(true)
    const newStatuses = new Map<string, DownloadStatus>()

    // Initialiser les statuts
    validUrls.forEach((url) => {
      newStatuses.set(url, { url, status: 'idle' })
    })
    setDownloadStatuses(newStatuses)

    if (downloadAsZip) {
      // Download all files and zip them
      const zip = new JSZip()
      const files: Array<{ name: string; blob: Blob }> = []

      for (const url of validUrls) {
        newStatuses.set(url, { url, status: 'downloading' })
        setDownloadStatuses(new Map(newStatuses))

        try {
          // Get track information and download URL from server
          const result = await getSoundCloudTrackInfo({
            data: { url, clientId, accessToken },
          })

          if (result.success && result.downloadUrl && result.trackTitle) {
            // Download file on client side
            const response = await fetch(result.downloadUrl)
            if (!response.ok) {
              throw new Error('Error downloading file')
            }

            const blob = await response.blob()
            const sanitizedTitle = result.trackTitle.replace(/[<>:"/\\|?*]/g, '').trim()
            files.push({ name: `${sanitizedTitle}.mp3`, blob })

            newStatuses.set(url, {
              url,
              status: 'success',
              message: result.trackTitle,
            })
          } else {
            newStatuses.set(url, {
              url,
              status: 'error',
              message: result.error || 'Erreur inconnue',
            })
          }
        } catch (error) {
          newStatuses.set(url, {
            url,
            status: 'error',
            message: error instanceof Error ? error.message : 'Erreur inconnue',
          })
        }

        setDownloadStatuses(new Map(newStatuses))
      }

      // Créer le zip avec tous les fichiers
      if (files.length > 0) {
        files.forEach((file) => {
          zip.file(file.name, file.blob)
        })

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const downloadUrl = window.URL.createObjectURL(zipBlob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = 'soundcloud-downloads.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      }
    } else {
      // Download each file individually
      for (const url of validUrls) {
        newStatuses.set(url, { url, status: 'downloading' })
        setDownloadStatuses(new Map(newStatuses))

        try {
          // Get track information and download URL from server
          const result = await getSoundCloudTrackInfo({
            data: { url, clientId, accessToken },
          })

          if (result.success && result.downloadUrl && result.trackTitle) {
            // Download file on client side
            const response = await fetch(result.downloadUrl)
            if (!response.ok) {
              throw new Error('Error downloading file')
            }

            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `${result.trackTitle}.mp3`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)

            newStatuses.set(url, {
              url,
              status: 'success',
              message: result.trackTitle,
            })
          } else {
            newStatuses.set(url, {
              url,
              status: 'error',
              message: result.error || 'Erreur inconnue',
            })
          }
        } catch (error) {
          newStatuses.set(url, {
            url,
            status: 'error',
            message: error instanceof Error ? error.message : 'Erreur inconnue',
          })
        }

        setDownloadStatuses(new Map(newStatuses))
      }
    }

    setIsDownloading(false)
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Download</h1>

        <div className="space-y-4">
          {/* Afficher les cards pour les URLs avec preview */}
          {Array.from(trackPreviews.keys())
            .filter((url) => urls.includes(url))
            .map((url) => {
              const preview = trackPreviews.get(url)
              const isLoadingPreview = loadingPreviews.has(url)

              if (isLoadingPreview) {
                return (
                  <div
                    key={url}
                    className="flex items-center gap-2 p-4 rounded-lg border bg-card"
                  >
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Loading information...
                    </span>
                  </div>
                )
              }

              if (preview && preview.success) {
                return (
                  <div
                    key={url}
                    className="relative flex gap-4 p-4 rounded-lg border bg-card group"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUrl(url)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                    {preview.artworkUrl && (
                      <div className="flex items-center h-24">
                        <img
                          src={preview.artworkUrl}
                          alt={preview.title}
                          className="w-24 h-24 rounded-lg object-cover shrink-0"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-8 flex flex-col justify-between h-24">
                      <div>
                        <h3 className="font-semibold text-base truncate">
                          {preview.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {preview.artist}
                        </p>
                        {preview.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.floor(preview.duration / 1000 / 60)}:
                            {Math.floor((preview.duration / 1000) % 60)
                              .toString()
                              .padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSingle(url)}
                          className="gap-2"
                        >
                          <DownloadIcon className="size-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                          className="gap-2"
                        >
                          <ExternalLink className="size-4" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              }

              if (preview && !preview.success) {
                return (
                  <div
                    key={url}
                    className="relative p-3 rounded-lg border border-destructive/50 bg-destructive/10"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUrl(url)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-4" />
                    </Button>
                    <p className="text-sm text-destructive pr-8">
                      {preview.error || 'Unable to load information'}
                    </p>
                  </div>
                )
              }

              return null
            })}

          {/* Afficher l'input vide pour ajouter de nouvelles URLs */}
          {urls
            .filter((url) => url.trim() === '')
            .map((url, index) => (
              <Input
                key={`input-${index}`}
                type="url"
                placeholder="Enter a SoundCloud URL..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full"
              />
            ))}
        </div>

        {urls.some((url) => url.trim() !== '') && (
          <div className="mt-8">
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="download-as-zip"
                  checked={downloadAsZip}
                  onCheckedChange={(checked) => setDownloadAsZip(checked === true)}
                />
                  <Label
                    htmlFor="download-as-zip"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Download as ZIP file
                  </Label>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !clientId}
                className="gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="size-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
            {!clientId && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                ⚠️ Please configure your Soundcloud Client ID and Access Token in settings
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

