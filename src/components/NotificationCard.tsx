import { Bell, User, Phone, Calendar, ShoppingBag, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  customer_name: string
  customer_phone?: string
  deal_title: string
  quantity: number
  service_type: 'dine_in' | 'takeaway'
  claim_date: string
  created_at: string
  is_read: boolean
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className={cn(
        'card p-4 border-l-4 transition-all hover:shadow-md',
        notification.is_read 
          ? 'border-l-muted bg-muted/20' 
          : 'border-l-primary bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            'p-2 rounded-full',
            notification.is_read ? 'bg-muted' : 'bg-primary/10'
          )}>
            <Bell className={cn(
              'h-4 w-4',
              notification.is_read ? 'text-muted-fg' : 'text-primary'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">
                Ny bestilling mottatt!
              </h3>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              {/* Customer Info */}
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-fg" />
                <span className="font-medium">{notification.customer_name}</span>
                {notification.customer_phone && (
                  <>
                    <span className="text-muted-fg">•</span>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-fg" />
                      <span>{notification.customer_phone}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Deal Info */}
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-3 w-3 text-muted-fg" />
                <span className="font-medium">{notification.deal_title}</span>
                <span className="text-muted-fg">
                  ({notification.quantity} {notification.quantity === 1 ? 'stk' : 'stk'})
                </span>
              </div>
              
              {/* Service Type */}
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-fg" />
                <span className="capitalize">
                  {notification.service_type === 'dine_in' ? 'Spise på stedet' : 'Takeaway'}
                </span>
              </div>
              
              {/* Claim Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-fg" />
                <span>Ønsket hentedato: {formatDate(notification.claim_date)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right text-xs text-muted-fg ml-4">
          <div>{formatTime(notification.created_at)}</div>
          <div>{formatDate(notification.created_at)}</div>
        </div>
      </div>
      
      {!notification.is_read && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Marker som lest
          </button>
        </div>
      )}
    </div>
  )
}
