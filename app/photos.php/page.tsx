import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getAlbums } from '@/lib/actions/photos'
import CreateAlbumForm from '@/components/CreateAlbumForm'

interface PhotosPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function PhotosPage({ searchParams }: PhotosPageProps) {
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

  const albums = await getAlbums(userId)
  const isOwnPage = session?.user?.id === userId

  return (
    <div id="content">
      <div className="grayheader">{user.name}'s Photos</div>

      {isOwnPage && <CreateAlbumForm userId={userId} />}

      {albums.length === 0 ? (
        <div className="standard_message">No photo albums yet.</div>
      ) : (
        <div className="album_list">
          {albums.map((album) => (
            <div key={album.id} className="album_item">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt={album.name} style={{ width: '150px', height: '150px', objectFit: 'cover', border: '1px solid #ccc' }} />
              ) : (
                <div className="album_no_cover">No Cover</div>
              )}
              <a href={`/album.php?id=${album.id}`} className="album_name">
                {album.name}
              </a>
              <div className="album_count">{album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
