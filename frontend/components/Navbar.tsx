import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from './ui/button'

export default function Navbar(){
  const router = useRouter()
  
  return (
    <header className="site-header container">
      <Link href="/" className="text-xl font-semibold text-primary">Gmail Classifier</Link>
      <nav className="nav-links">
        <Link href="/emails" className="text-sm font-medium hover:text-primary transition-colors">Inbox</Link>
        <a href="#" onClick={(e)=>{e.preventDefault();}} className="text-sm font-medium hover:text-primary transition-colors">About</a>
        <Button variant="outline" size="sm" onClick={() => { router.push('/') }}>Login</Button>
      </nav>
    </header>
  )
}
