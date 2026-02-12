import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import StatusUpdateForm from '@/components/StatusUpdateForm'
import { getFeedItems, getFeedItemCount } from '@/lib/actions/feed'
import { getUnseenPokes } from '@/lib/actions/poke'
import { getSuggestedFriends } from '@/lib/actions/friends'
import PokeBackButton from '@/components/PokeBackButton'

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
  const unseenPokes = await getUnseenPokes(session.user.id)
  const suggestions = await getSuggestedFriends(session.user.id, 5)

  return (
    <div id="content">
      <StatusUpdateForm
        userId={session.user.id}
        userName={session.user.name || 'You'}
      />
      {suggestions.length > 0 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #e9e9e9', background: '#f7f7f7' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>People You May Know</div>
          {suggestions.map((s) => (
            <div key={s.id} style={{ display: 'inline-block', marginRight: '12px', textAlign: 'center', fontSize: '10px' }}>
              <a href={`/profile.php?id=${s.id}`} style={{ color: '#3b5998' }}>{s.name}</a>
            </div>
          ))}
        </div>
      )}
      {unseenPokes.length > 0 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #e9e9e9', background: '#fff9d7' }}>
          {unseenPokes.map((poke) => (
            <div key={poke.id} style={{ marginBottom: '4px' }}>
              <a href={'/profile.php?id=' + poke.pokerId} style={{ fontWeight: 'bold', color: '#3b5998' }}>{poke.pokerName}</a>
              {' poked you. '}
              <PokeBackButton pokeId={poke.id} currentUserId={session.user.id} />
            </div>
          ))}
        </div>
      )}
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
