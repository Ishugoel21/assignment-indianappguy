import { Badge } from './ui/badge'
import { Mail, Calendar } from 'lucide-react'
import { getBadgeVariant } from '../utils/badgeUtils'

export interface Email {
  id: string;
  threadId?: string;
  snippet?: string;
  from?: string;
  subject?: string;
  date?: string;
  category?: string;
}

export default function EmailCard({ email, onClick }: { email: Email; key?: any; onClick?: () => void }) {
  const { from, subject, snippet, category, date } = email || {};

  return (
    <div className="email-card cursor-pointer group hover:bg-blue-50/50 transition-colors" onClick={onClick}>
      <div className="email-meta mb-3">
        <div className="from flex items-center gap-2 flex-1 min-w-0">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-sm truncate">{from || 'No sender'}</span>
        </div>
        {category && (
          <Badge variant={getBadgeVariant(category)} className="flex-shrink-0 ml-2">
            {category}
          </Badge>
        )}
      </div>
      <h3 className="subject text-base font-semibold mb-2 line-clamp-1">{subject || 'No subject'}</h3>
      <p className="snippet text-sm text-muted-foreground line-clamp-2 leading-relaxed">{snippet || 'No preview available'}</p>
      {date && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-2 border-t border-muted">
          <Calendar className="h-3 w-3" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
