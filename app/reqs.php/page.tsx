import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getPendingRequests } from '@/lib/actions/friends'
import FriendRequestActions from '@/components/FriendRequestActions'

export default async function FriendRequestsPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const requests = await getPendingRequests(session.user.id)

  return (
    <div id="content">
      <div className="grayheader">Friend Requests</div>
      {requests.length === 0 ? (
        <div className="standard_message">
          You have no pending friend requests.
          <div style={{ marginTop: '8px' }}>
            <a href="/search.php" style={{ color: '#3b5998' }}>Search for people</a> to connect with friends on HumanBook.
          </div>
        </div>
      ) : (
        <div>
          {requests.map((request) => (
            <div key={request.id} className="friend_request_item">
              <div className="friend_request_info">
                <a href={'/profile.php?id=' + request.requesterId}>
                  {request.requesterName}
                </a>
              </div>
              <FriendRequestActions
                friendshipId={request.id}
                currentUserId={session.user.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
