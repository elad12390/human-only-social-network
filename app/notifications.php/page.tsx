import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications'

function formatNotificationType(type: string): string {
  switch (type) {
    case 'poke':
      return 'poked you'
    case 'friend_request':
      return 'sent you a friend request'
    case 'friend_accepted':
      return 'accepted your friend request'
    case 'wall_post':
      return 'wrote on your Wall'
    case 'photo_tag':
      return 'tagged you in a photo'
    case 'group_invite':
      return 'invited you to a group'
    case 'message':
      return 'sent you a message'
    default:
      return `sent you a notification (${type})`
  }
}

async function handleMarkAllRead() {
  'use server'
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (session?.user?.id) {
    await markAllNotificationsAsRead(session.user.id)
  }
  redirect('/notifications.php')
}

export default async function NotificationsPage() {
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const notifications = await getNotifications(session.user.id)

  return (
    <div id="content">
      <div className="grayheader">Notifications</div>

      <div style={{ padding: '10px 20px' }}>
        <form action={handleMarkAllRead} style={{ display: 'inline' }}>
          <button type="submit" className="inputsubmit">
            Mark All as Read
          </button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <div className="standard_message">No notifications.</div>
      ) : (
        <div>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: '8px 20px',
                borderBottom: '1px solid #e9e9e9',
                fontSize: '11px',
                fontFamily: '"lucida grande", tahoma, verdana, arial, sans-serif',
                backgroundColor: notif.read ? 'transparent' : '#fff8e1',
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#3b5998' }}>
                {notif.fromUserName ? (
                  <a href={`/profile.php?id=${notif.fromUserId}`} style={{ color: '#3b5998' }}>
                    {notif.fromUserName}
                  </a>
                ) : (
                  'Someone'
                )}
              </span>
              {' '}
              {formatNotificationType(notif.type)}
              <span style={{ color: '#999', fontSize: '10px', marginLeft: '8px' }}>
                {notif.createdAt?.toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
