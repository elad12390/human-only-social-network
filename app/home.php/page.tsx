import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import StatusUpdateForm from '@/components/StatusUpdateForm'
import { getFeedItems, getFeedItemCount } from '@/lib/actions/feed'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const feedItems = await getFeedItems(session.user.id, currentPage, 20)
  const totalCount = await getFeedItemCount(session.user.id)
  const totalPages = Math.ceil(totalCount / 20) || 1

  return (
    <div id="content">
      <StatusUpdateForm
        userId={session.user.id}
        userName={session.user.name || 'You'}
        onStatusCreated={() => {}}
      />
      {feedItems.length === 0 ? (
        <div className="feed_empty">No news to show. Add some friends to see their activity here!</div>
      ) : (
        <>
          {feedItems.map((item) => (
            <div key={item.id} className="feed_item">
              {item.type === 'status_update' && (
                <>
                  <a href={"/profile.php?id=" + item.userId} className="feed_item_author">{item.userName}</a> is {item.content} <span className="feed_item_time">{item.createdAt?.toLocaleString()}</span>
                </>
              )}
              {item.type === 'wall_post' && (
                <>
                  <a href={"/profile.php?id=" + item.userId} className="feed_item_author">{item.userName}</a> wrote on {item.targetUserName}'s wall: <span className="feed_item_content">{item.content}</span> <span className="feed_item_time">{item.createdAt?.toLocaleString()}</span>
                </>
              )}
              {item.type === 'friend_accepted' && (
                <>
                  <a href={"/profile.php?id=" + item.userId} className="feed_item_author">{item.userName}</a> and {item.targetUserName} are now friends. <span className="feed_item_time">{item.createdAt?.toLocaleString()}</span>
                </>
              )}
            </div>
          ))}
          {totalPages > 1 && (
            <div className="feed_pagination">
              {currentPage > 1 && <a href={"/home.php?page=" + (currentPage - 1)}>Newer</a>}
              {currentPage < totalPages && <a href={"/home.php?page=" + (currentPage + 1)}>Older</a>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
