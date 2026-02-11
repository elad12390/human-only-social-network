'use client'

import { useSession } from '@/lib/auth-client'
import SidebarLoginForm from './SidebarLoginForm'

export default function Sidebar() {
  const { data: session } = useSession()

  return (
    <div id="sidebar">
      <a href="/" className="go_home">
        humanbook
      </a>
      <div id="sidebar_content">
        {!session ? (
          <>
            <SidebarLoginForm />
            <div id="qsearch">
              <form method="get" action="/search">
                <input
                  type="text"
                  name="q"
                  className="inputtext"
                  placeholder="Search"
                />
              </form>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '5px 0' }}>
              <a href="/home.php">News Feed</a>
              <a href="/messages.php">Messages</a>
              <a href="/events.php">Events</a>
              <a href="/photos.php">Photos</a>
              <a href="/groups.php">Groups</a>
            </div>
            <div id="qsearch">
              <form method="get" action="/search">
                <input
                  type="text"
                  name="q"
                  className="inputtext"
                  placeholder="Search"
                />
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
