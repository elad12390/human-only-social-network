import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getNavigatorCounts } from '@/lib/actions/notifications'
import LogoutButton from './LogoutButton'

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
         <a href="/home.php">Home</a>
         <a href="/profile.php">Profile</a>
         <a href="/reqs.php">
           Friends{counts.friendRequests > 0 ? ` (${counts.friendRequests})` : ''}
         </a>
         <a href="/inbox">
           Inbox{counts.unreadMessages > 0 ? ` (${counts.unreadMessages})` : ''}
         </a>
         {isLoggedIn && counts.unseenPokes > 0 && (
           <a href="/home.php">
             Pokes ({counts.unseenPokes})
           </a>
         )}
       </div>
       <div className="secondary_set">
         <a href="/groups.php">Groups</a>
         <span className="nav_count">|</span>
         <a href="/events.php">Events</a>
         {isLoggedIn && (
           <>
             <span className="nav_count">|</span>
             <a href="/notifications.php">Notifications</a>
             <span className="nav_count">|</span>
             <LogoutButton />
           </>
         )}
       </div>
    </div>
  )
}
