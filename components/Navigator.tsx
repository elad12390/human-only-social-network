import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getNavigatorCounts } from '@/lib/actions/notifications'

export default async function Navigator() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  let counts = { friendRequests: 0, unreadMessages: 0, unseenPokes: 0 }
  if (session?.user?.id) {
    counts = await getNavigatorCounts(session.user.id)
  }

  const isLoggedIn = !!session?.user?.id

  return (
    <div id="navigator">
      <div className="main_set">
        <a href="/home.php">home</a>
        <a href="/profile.php">profile</a>
        <a href="/reqs.php">
          friends{counts.friendRequests > 0 ? ` (${counts.friendRequests})` : ''}
        </a>
        <a href="/inbox">
          inbox{counts.unreadMessages > 0 ? ` (${counts.unreadMessages})` : ''}
        </a>
        {isLoggedIn && counts.unseenPokes > 0 && (
          <a href="/home.php">
            pokes ({counts.unseenPokes})
          </a>
        )}
      </div>
      <div className="secondary_set">
        <a href="/groups.php">groups</a>
        <span className="nav_count">|</span>
        <a href="/events.php">events</a>
        {isLoggedIn && (
          <>
            <span className="nav_count">|</span>
            <a href="/notifications.php">notifications</a>
            <span className="nav_count">|</span>
            <a href="/api/auth/sign-out">logout</a>
          </>
        )}
      </div>
    </div>
  )
}
