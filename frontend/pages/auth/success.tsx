import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AuthSuccess() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch session info including tokens and store in localStorage
    async function fetchSessionInfo() {
      try {
        // The session tokens are already stored on the backend
        // We just need to verify authentication and redirect
        const res = await fetch(`${API_URL}/auth/status`, { credentials: 'include' })
        const data = await res.json()
        
        if (data.authenticated) {
          // Add a small delay to show success state
          setTimeout(() => {
            router.push('/emails')
          }, 1500)
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Failed to verify auth:', err)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionInfo()
  }, [router])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Authentication Successful!</CardTitle>
          <CardDescription>
            You've successfully connected your Gmail account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to your inbox...
          </div>
          <Button 
            className="w-full" 
            onClick={() => router.push('/emails')}
          >
            Go to Inbox Now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
