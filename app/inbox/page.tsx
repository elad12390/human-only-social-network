import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getInboxMessages, getSentMessages } from '@/lib/actions/messages'

interface InboxPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const activeTab = params.tab === 'sent' ? 'sent' : 'inbox'
  const messages =
    activeTab === 'sent'
      ? await getSentMessages(session.user.id)
      : await getInboxMessages(session.user.id)

  return (
    <div id="content">
      <div className="grayheader">Messages</div>

      <div className="inbox_tabs">
        <a href="/inbox" className={activeTab !== 'sent' ? 'active_tab' : ''}>
          Inbox
        </a>
        <a
          href="/inbox?tab=sent"
          className={activeTab === 'sent' ? 'active_tab' : ''}
        >
          Sent
        </a>
        <a href="/inbox/compose" style={{ float: 'right', color: '#3b5998' }}>
          + Compose New Message
        </a>
      </div>

      <div className="message_list">
        {messages.length === 0 ? (
          <div className="standard_message">No messages.</div>
        ) : activeTab === 'sent' ? (
          (messages as Awaited<ReturnType<typeof getSentMessages>>).map(
            (msg) => (
              <div key={msg.id} className="message_row">
                <span className="message_from">
                  <a href={`/profile.php?id=${msg.recipientId}`}>
                    {msg.recipientName}
                  </a>
                </span>
                <span className="message_subject">
                  <a href={`/inbox/read?id=${msg.id}`}>{msg.subject}</a>
                </span>
                <span className="message_date">
                  {msg.createdAt?.toLocaleDateString()}
                </span>
                <div className="clearfix"></div>
              </div>
            )
          )
        ) : (
          (messages as Awaited<ReturnType<typeof getInboxMessages>>).map(
            (msg) => (
              <div
                key={msg.id}
                className={`message_row ${!msg.read ? 'unread' : ''}`}
              >
                <span className="message_from">
                  <a href={`/profile.php?id=${msg.senderId}`}>
                    {msg.senderName}
                  </a>
                </span>
                <span className="message_subject">
                  <a href={`/inbox/read?id=${msg.id}`}>{msg.subject}</a>
                </span>
                <span className="message_date">
                  {msg.createdAt?.toLocaleDateString()}
                </span>
                <div className="clearfix"></div>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
