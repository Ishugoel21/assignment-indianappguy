import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Input } from '../components/ui'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Home() {
  const [openaiKey, setOpenaiKey] = useState<string>('')
  const [isKeySaved, setIsKeySaved] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('OPENAI_KEY')
  })
  const router = useRouter()

  function handleSaveKey() {
    if (openaiKey) {
      localStorage.setItem('OPENAI_KEY', openaiKey)
      setIsKeySaved(true)
      alert('OpenAI API key saved successfully!')
    }
  }

  function handleLogin() {
    // redirect to backend Google OAuth endpoint
    window.location.href = `${API_URL}/auth/google`
  }

  return (
    <div className="center-screen">
      <div className="container" style={{maxWidth:640}}>
        <div className="flex flex-col gap-6">
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={!isKeySaved}
            style={{
              opacity: isKeySaved ? 1 : 0.5,
              cursor: isKeySaved ? 'pointer' : 'not-allowed'
            }}
          >
            Login with Google
          </Button>

          <div>
            <label className="block text-sm font-medium mb-2">Enter OpenAI API Key</label>
            <div className="flex gap-2 mb-3">
              <Input 
                type="password" 
                value={openaiKey} 
                onChange={(e:any) => setOpenaiKey(e.target.value)} 
                placeholder="Enter your OpenAI API key" 
                className="flex-1"
              />
              <Button onClick={handleSaveKey}>Save</Button>
            </div>
            <p className="text-sm text-gray-600">
              First save API key, then only you will be able to login
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


