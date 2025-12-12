import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [clientId, setClientId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load client ID and access token from localStorage on mount
    const savedClientId = localStorage.getItem('soundcloud_client_id') || ''
    const savedAccessToken = localStorage.getItem('soundcloud_access_token') || ''
    setClientId(savedClientId)
    setAccessToken(savedAccessToken)
  }, [])

  const handleSave = () => {
    localStorage.setItem('soundcloud_client_id', clientId)
    localStorage.setItem('soundcloud_access_token', accessToken)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Settings</h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Soundcloud Client ID</Label>
            <Input
              id="client-id"
              type="text"
              placeholder="Enter your Soundcloud Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Soundcloud Access Token</Label>
            <Input
              id="access-token"
              type="text"
              placeholder="Enter your Soundcloud Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saved}>
            {saved ? (
              <>
                <Check className="size-4" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>

        <div className="mt-8 p-4 rounded-lg border bg-muted/50">
          <h2 className="text-lg font-semibold mb-3">How to retrieve your Client ID and Access Token</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Go to soundcloud.com and log in (skip this step if you are already logged in)</li>
            <li>Open developer tools (Right click → Inspect) and go to the Network tab</li>
            <li>Go to soundcloud.com, you should see several requests in the Network tab</li>
            <li>Find the request named <code className="px-1.5 py-0.5 rounded bg-background text-foreground font-mono text-xs">session</code> (you can filter by typing "session" in the filter box) and click on it</li>
            <li>Go to the Payload tab</li>
            <li>You should see your client id in the Query String Parameters section, and your oauth token (<code className="px-1.5 py-0.5 rounded bg-background text-foreground font-mono text-xs">access_token</code>) in the Request Payload section</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

