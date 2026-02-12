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
              <form method="get" action="/search.php">
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
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '3px' }}>Navigation</div>
              <a href="/home.php">News Feed</a>
              <a href="/inbox">Messages</a>
              <a href="/reqs.php">Friend Requests</a>
            </div>
            <div style={{ padding: '5px 0', borderTop: '1px solid #ddd', marginTop: '5px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '3px' }}>Explore</div>
              <a href="/events.php">Events</a>
              <a href="/photos.php">Photos</a>
              <a href="/groups.php">Groups</a>
            </div>
            <div id="qsearch">
              <form method="get" action="/search.php">
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
