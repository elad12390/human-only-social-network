import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'
import WallPostForm from '@/components/WallPostForm'
import StatusUpdateForm from '@/components/StatusUpdateForm'
import FriendButton from '@/components/FriendButton'
import PokeButton from '@/components/PokeButton'
import { getWallPosts } from '@/lib/actions/wall'
import { getLatestStatus } from '@/lib/actions/status'
import { getFriends, getFriendshipStatus } from '@/lib/actions/friends'

interface ProfilePageProps {
  searchParams: Promise<{ id?: string; tab?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  let userId = params.id
  if (!userId && session?.user?.id) {
    userId = session.user.id
  }

  if (!userId) {
    redirect('/')
  }

  const users = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))

  const user = users[0]

  if (!user) {
    return (
      <div id="content">
        <div className="standard_message">User not found</div>
      </div>
    )
  }

  const profiles = await db
    .select()
    .from(schema.profile)
    .where(eq(schema.profile.userId, userId))

  const profile = profiles[0]

    const wallPosts = await getWallPosts(userId)
    const latestStatus = await getLatestStatus(userId)
    const friends = await getFriends(userId)

    const isOwnProfile = session?.user?.id === userId
    const friendshipRecord = session?.user?.id && session.user.id !== userId ? await getFriendshipStatus(session.user.id, userId) : null
   const activeTab = params.tab || 'wall'

   return (
     <div id="content">
       <div className="profile_top">
         <div className="profile_photo">
           {profile?.profilePhotoUrl ? (
             <img src={profile.profilePhotoUrl} alt={user.name} />
           ) : (
             <div className="no_photo_placeholder">No Photo</div>
           )}
         </div>
         <div className="profile_info">
           <div className="profile_name">{user.name}</div>
           {latestStatus && (
             <div className="profile_status" style={{ marginTop: '4px', fontStyle: 'italic' }}>
               is {latestStatus.content}
             </div>
           )}
           <div className="profile_status">
             Member since {user.createdAt?.toLocaleDateString() || 'Unknown'}
           </div>
           {profile?.bio && (
             <div className="profile_status" style={{ marginTop: '8px' }}>
               {profile.bio}
             </div>
           )}
           {isOwnProfile && (
             <div className="profile_actions">
               <a href="/edit-profile.php">Edit Profile</a>
             </div>
           )}
         </div>
         <div className="clearfix"></div>
       </div>

        {!isOwnProfile && session?.user?.id && (
          <div className="friend_button">
            <FriendButton
              currentUserId={session.user.id}
              profileUserId={userId}
              profileUserName={user.name}
            />
            {friendshipRecord?.status === 'accepted' && (
              <PokeButton
                currentUserId={session.user.id}
                profileUserId={userId}
                profileUserName={user.name}
              />
            )}
          </div>
        )}

       <div id="tabs">
         <div className={activeTab === 'wall' ? 'activetab' : ''}>
           <a href={`/profile.php?id=${userId}&tab=wall`}>Wall</a>
         </div>
         <div className={activeTab === 'info' ? 'activetab' : ''}>
           <a href={`/profile.php?id=${userId}&tab=info`}>Info</a>
         </div>
         <div className={activeTab === 'photos' ? 'activetab' : ''}>
           <a href={`/profile.php?id=${userId}&tab=photos`}>Photos</a>
         </div>
         <div className={activeTab === 'friends' ? 'activetab' : ''}>
           <a href={`/profile.php?id=${userId}&tab=friends`}>Friends</a>
         </div>
       </div>

       {activeTab === 'wall' && (
         <>
           {isOwnProfile && session?.user?.id && (
             <>
               <StatusUpdateForm
                 userId={session.user.id}
                 userName={user.name}
                 onStatusCreated={() => {}}
               />
               <WallPostForm
                 authorId={session.user.id}
                 profileOwnerId={userId}
                 onPostCreated={() => {}}
               />
             </>
           )}

           {wallPosts.length === 0 ? (
             <div className="standard_message">No wall posts yet.</div>
           ) : (
             wallPosts.map((post) => (
               <div key={post.id} className="wall_post">
                 <div>
                   <span className="wall_post_author">{post.authorName}</span>
                   <span className="wall_post_time">
                     {post.createdAt?.toLocaleString() || 'Unknown'}
                   </span>
                 </div>
                 <div className="wall_post_content">{post.content}</div>
               </div>
             ))
           )}
         </>
       )}

       {activeTab === 'info' && (
         <div>
           <div className="grayheader">Basic Information</div>
           <div className="profile_status">
             Member since {user.createdAt?.toLocaleDateString() || 'Unknown'}
           </div>
           {profile?.bio && (
             <div className="profile_status" style={{ marginTop: '8px' }}>
               {profile.bio}
             </div>
           )}
         </div>
       )}

       {activeTab === 'photos' && (
         <div className="standard_message">No photos yet.</div>
       )}

        {activeTab === 'friends' && (
          <div>
            <div className="friend_count">Friends ({friends.length})</div>
            <div className="friend_grid">
              {friends.length === 0 ? (
                <div className="standard_message">No friends yet.</div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="friend_grid_item">
                    {friend.friendImage ? (
                      <img src={friend.friendImage} alt={friend.friendName || ''} />
                    ) : (
                      <div className="no_photo_small">No Photo</div>
                    )}
                    <a href={`/profile.php?id=${friend.friendId}`} className="friend_name">
                      {friend.friendName}
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
     </div>
   )
}
