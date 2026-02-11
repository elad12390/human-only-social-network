import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMessage, markAsRead } from '@/lib/actions/messages'

interface ReadPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function ReadPage({ searchParams }: ReadPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const messageId = params.id
  if (!messageId) {
    redirect('/inbox')
  }

  const msg = await getMessage(messageId)

  if (!msg) {
    return (
      <div id="content">
        <a href="/inbox" style={{ display: 'block', padding: '10px', color: '#3b5998' }}>
          Back to Inbox
        </a>
        <div className="standard_message">Message not found</div>
      </div>
    )
  }

  // Mark message as read
  await markAsRead(messageId)

  return (
    <div id="content">
      <a href="/inbox" style={{ display: 'block', padding: '10px', color: '#3b5998' }}>
        Back to Inbox
      </a>

      <div className="read_message">
        <div className="message_header">
          <div className="grayheader">{msg.subject}</div>
        </div>
        <div className="message_meta">
          <strong>From:</strong>{' '}
          <a href={`/profile.php?id=${msg.senderId}`} style={{ color: '#3b5998' }}>
            {msg.senderName}
          </a>
        </div>
        <div className="message_meta">
          <strong>To:</strong>{' '}
          <a href={`/profile.php?id=${msg.recipientId}`} style={{ color: '#3b5998' }}>
            {msg.recipientName}
          </a>
        </div>
        <div className="message_meta">
          <strong>Date:</strong> {msg.createdAt?.toLocaleString()}
        </div>
        <div className="message_body">{msg.body}</div>
        <div className="message_actions">
          <a
            href={`/inbox/compose?to=${msg.senderId}&subject=${encodeURIComponent('Re: ' + msg.subject)}`}
            className="inputsubmit"
            style={{ textDecoration: 'none', padding: '4px 10px' }}
          >
            Reply
          </a>
        </div>
      </div>
    </div>
  )
}
