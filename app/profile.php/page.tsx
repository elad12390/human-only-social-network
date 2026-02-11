import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'
import WallPostForm from '@/components/WallPostForm'
import { getWallPosts } from '@/lib/actions/wall'

interface ProfilePageProps {
  searchParams: Promise<{ id?: string }>
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

  const isOwnProfile = session?.user?.id === userId

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

      <div id="tabs">
        <div className="activetab">
          <a href={`/profile.php?id=${userId}&tab=wall`}>Wall</a>
        </div>
        <div>
          <a href={`/profile.php?id=${userId}&tab=info`}>Info</a>
        </div>
        <div>
          <a href={`/profile.php?id=${userId}&tab=photos`}>Photos</a>
        </div>
        <div>
          <a href={`/profile.php?id=${userId}&tab=friends`}>Friends</a>
        </div>
      </div>

      {isOwnProfile && session?.user?.id && (
        <WallPostForm
          authorId={session.user.id}
          profileOwnerId={userId}
          onPostCreated={() => {}}
        />
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
    </div>
  )
}
