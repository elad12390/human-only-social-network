import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getPhotoTags } from '@/lib/actions/photos'
import { getFriends } from '@/lib/actions/friends'
import PhotoTagForm from '@/components/PhotoTagForm'

interface PhotoPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function PhotoPage({ searchParams }: PhotoPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const photoId = params.id
  if (!photoId) {
    redirect('/')
  }

  // Fetch photo
  const photos = await db
    .select()
    .from(schema.photo)
    .where(eq(schema.photo.id, photoId))

  const photo = photos[0]

  if (!photo) {
    return (
      <div id="content">
        <div className="standard_message">Photo not found</div>
      </div>
    )
  }

  // Fetch photo tags
  const tags = await getPhotoTags(photoId)

  // Fetch current user's friends (if logged in)
  let friends: Array<{ friendId: string; friendName: string | null }> = []
  if (session?.user?.id) {
    const allFriends = await getFriends(session.user.id)
    friends = allFriends.map((f) => ({
      friendId: f.friendId,
      friendName: f.friendName,
    }))
  }

  return (
    <div id="content">
      <a
        href={`/album.php?id=${photo.albumId}`}
        style={{ padding: '10px', display: 'block', color: '#3b5998' }}
      >
        Back to Album
      </a>

      <div className="photo_viewer">
        <img src={photo.blobUrl} alt={photo.caption || 'Photo'} />
      </div>

      {photo.caption && (
        <div className="photo_caption">{photo.caption}</div>
      )}

      <div className="photo_tags">
        <span className="tag_label">Tagged: </span>
        {tags.length === 0
          ? 'No one tagged'
          : tags.map((tag) => (
              <a
                key={tag.id}
                href={`/profile.php?id=${tag.taggedUserId}`}
                style={{ color: '#3b5998', marginRight: '8px' }}
              >
                {tag.taggedUserName}
              </a>
            ))}
      </div>

      {session?.user?.id && friends.length > 0 && (
        <PhotoTagForm
          photoId={photoId}
          currentUserId={session.user.id}
          friends={friends}
        />
      )}
    </div>
  )
}
