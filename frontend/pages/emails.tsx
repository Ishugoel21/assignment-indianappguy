import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import EmailCard from '../components/EmailCard'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Card, CardContent } from '../components/ui/card'
import { RefreshCw, Sparkles, Inbox, Loader2, Mail, Calendar, X, User, LogOut } from 'lucide-react'
import { getBadgeVariant } from '../utils/badgeUtils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Email {
  id: string
  threadId?: string
  snippet?: string
  from?: string
  subject?: string
  date?: string
  category?: string
}

export default function EmailsPage() {
  const router = useRouter()
  const [limit, setLimit] = useState<number>(15)
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [classifying, setClassifying] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>('')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [fullEmailContent, setFullEmailContent] = useState<any>(null)
  const [loadingContent, setLoadingContent] = useState<boolean>(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [userInfo, setUserInfo] = useState<{ displayName?: string; emails?: any[] } | null>(null)

  useEffect(() => {
    checkAuthentication()
  }, [])

  async function checkAuthentication() {
    try {
      const res = await fetch(`${API_URL}/auth/status`, { credentials: 'include' })
      const data = await res.json()
      if (!data.authenticated) {
        router.push('/')
        return
      }
      if (data.user) {
        setUserInfo(data.user)
      }
      setCheckingAuth(false)
      fetchEmails()
    } catch (err) {
      console.error('Auth check failed:', err)
      router.push('/')
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, { credentials: 'include' })
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/')
    }
  }

  useEffect(() => {
    if (!checkingAuth) {
      fetchEmails()
    }
  }, [checkingAuth])

  async function fetchEmails() {
    setLoading(true)
    setStatusMsg('Fetching emails...')
    try {
      // Get tokens from localStorage if available
      const tokens = typeof window !== 'undefined' ? localStorage.getItem('GMAIL_TOKENS') : null
      const headers: any = { credentials: 'include' }
      if (tokens) {
        headers.headers = { 'X-Tokens': tokens }
      }
      
      const res = await fetch(`${API_URL}/api/emails/fetch?limit=${limit}`, headers)
      const data = await res.json()
      if (data.ok && Array.isArray(data.emails)) {
        setEmails(data.emails)
        setStatusMsg(`Fetched ${data.emails.length} messages`)
      } else {
        setStatusMsg(data.error || 'Unable to fetch emails (maybe not authenticated)')
      }
    } catch (err) {
      setStatusMsg(String(err))
    }
    setLoading(false)
  }

  async function classifyEmails() {
    setClassifying(true)
    setStatusMsg('Classifying emails...')
    try {
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('OPENAI_KEY') : null
      const res = await fetch(`${API_URL}/api/emails/classify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiKey, limit })
      })
      const data = await res.json()
      if (data.ok && Array.isArray(data.classifications)) {
        setEmails(data.classifications)
        setStatusMsg('Classification complete')
      } else {
        setStatusMsg(data.error || 'Classification failed')
      }
    } catch (err) {
      setStatusMsg(String(err))
    }
    setClassifying(false)
  }

  async function fetchEmailContent(emailId: string) {
    setLoadingContent(true)
    try {
      // Get tokens from localStorage if available
      const tokens = typeof window !== 'undefined' ? localStorage.getItem('GMAIL_TOKENS') : null
      const headers: any = { credentials: 'include' }
      if (tokens) {
        headers.headers = { 'X-Tokens': tokens }
      }
      
      const res = await fetch(`${API_URL}/api/emails/content/${emailId}`, headers)
      const data = await res.json()
      if (data.ok && data.email) {
        setFullEmailContent(data.email)
      }
    } catch (err) {
      console.error('Failed to fetch email content:', err)
      setFullEmailContent(null)
    }
    setLoadingContent(false)
  }

  function handleEmailClick(email: Email) {
    setSelectedEmail(email)
    setFullEmailContent(null)
    fetchEmailContent(email.id)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className={`grid gap-6 transition-all duration-300 ${
        selectedEmail ? 'grid-cols-1 lg:grid-cols-[420px_1fr]' : 'grid-cols-1'
      }`}>
        {/* Main Inbox */}
        <div className={`space-y-6 transition-all duration-300 ${selectedEmail ? 'order-2 lg:order-1' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{userInfo?.displayName || 'User'}</h2>
                <div className="space-y-1 mt-1">
                  {userInfo?.emails?.[0]?.value && (
                    <p className="text-sm text-muted-foreground">{userInfo.emails[0].value}</p>
                  )}
                  {statusMsg && (
                    <p className="text-sm text-blue-600 font-medium">{statusMsg}</p>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogoutDialog(true)}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          <Card className="border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold">Email Count:</label>
                  <Select 
                    value={limit.toString()} 
                    onChange={(e) => setLimit(Number(e.target.value))}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={fetchEmails} 
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={classifyEmails} 
                    disabled={classifying || loading}
                    size="sm"
                    className="flex items-center"
                  >
                    {classifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Classifying...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Classify with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {emails.length === 0 && !loading && (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                        <Inbox className="h-12 w-12 text-primary" />
                      </div>
                      <p className="font-medium text-lg mb-1">No emails to show</p>
                      <p className="text-sm text-muted-foreground">Click refresh to fetch emails from your Gmail</p>
                    </CardContent>
                  </Card>
                )}
                {emails.map((e) => (
                  <EmailCard 
                    key={e.id} 
                    email={e} 
                    onClick={() => handleEmailClick(e)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Preview */}
        <aside className={`transition-all duration-300 ${selectedEmail ? '' : 'hidden'} ${selectedEmail ? 'order-1 lg:order-2' : ''}`}>
          {selectedEmail && (
            <Card className="sticky top-24 border-2 shadow-xl h-[calc(100vh-120px)] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Preview
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedEmail(null)
                    setFullEmailContent(null)
                  }}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {loadingContent ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : fullEmailContent ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-muted-foreground min-w-[40px]">From:</span>
                            <p className="font-semibold">{fullEmailContent.from || 'No sender'}</p>
                          </div>
                          {fullEmailContent.to && (
                            <div className="flex items-start gap-2 mt-1">
                              <span className="text-sm text-muted-foreground min-w-[40px]">To:</span>
                              <p className="text-sm text-muted-foreground">{fullEmailContent.to}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedEmail.category && (
                        <Badge variant={getBadgeVariant(selectedEmail.category)}>
                          {selectedEmail.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-semibold mb-2">{fullEmailContent.subject || 'No subject'}</h2>
                      {fullEmailContent.date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(fullEmailContent.date).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {fullEmailContent.body && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-2">Email Content</h4>
                        {fullEmailContent.isHtml ? (
                          <div 
                            className="text-sm text-foreground break-words max-h-none prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: fullEmailContent.body }}
                            style={{
                              fontFamily: 'inherit',
                              lineHeight: '1.6'
                            }}
                          />
                        ) : (
                          <div className="text-sm text-foreground whitespace-pre-wrap break-words max-h-none">
                            {fullEmailContent.body}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="border-t pt-4 text-xs text-muted-foreground">
                      <p>Email ID: {fullEmailContent.id}</p>
                      {fullEmailContent.threadId && <p>Thread ID: {fullEmailContent.threadId}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{selectedEmail.from || 'No sender'}</p>
                          <p className="text-sm text-muted-foreground">From</p>
                        </div>
                      </div>
                      {selectedEmail.category && (
                        <Badge variant={getBadgeVariant(selectedEmail.category)}>
                          {selectedEmail.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-semibold mb-2">{selectedEmail.subject || 'No subject'}</h2>
                      {selectedEmail.date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">Preview</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {selectedEmail.snippet || 'No preview available'}
                      </p>
                    </div>
                    
                    <div className="border-t pt-4 text-xs text-muted-foreground">
                      <p>Email ID: {selectedEmail.id}</p>
                      {selectedEmail.threadId && <p>Thread ID: {selectedEmail.threadId}</p>}
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to access your emails.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

