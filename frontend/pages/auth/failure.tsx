import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { XCircle, Home } from 'lucide-react'

export default function AuthFailure() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 shadow-xl border-red-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Authentication Failed</CardTitle>
          <CardDescription>
            We couldn't connect your Gmail account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Please try logging in again. Make sure you grant all necessary permissions.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="flex-1" 
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Go Back Home
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

