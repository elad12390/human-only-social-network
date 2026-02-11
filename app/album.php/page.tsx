import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAlbumWithPhotos } from '@/lib/actions/photos'
import PhotoUploadForm from '@/components/PhotoUploadForm'

interface AlbumPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function AlbumPage({ searchParams }: AlbumPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const albumId = params.id
  if (!albumId) {
    redirect('/')
  }

  const albumData = await getAlbumWithPhotos(albumId)

  if (!albumData) {
    return (
      <div id="content">
        <div className="standard_message">Album not found</div>
      </div>
    )
  }

  const isOwner = session?.user?.id === albumData.album.userId
  const photos = albumData.photos

  return (
    <div id="content">
      <div className="grayheader">{albumData.album.name}</div>

      {albumData.album.description && (
        <p style={{ padding: '10px', color: '#333' }}>
          {albumData.album.description}
        </p>
      )}

      <a
        href={`/photos.php?id=${albumData.album.userId}`}
        style={{ padding: '10px', display: 'block', color: '#3b5998' }}
      >
        Back to Albums
      </a>

      {isOwner && (
        <PhotoUploadForm albumId={albumId} userId={albumData.album.userId} />
      )}

      {photos.length === 0 ? (
        <div className="standard_message">No photos in this album yet.</div>
      ) : (
        <div className="photo_grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo_grid_item">
              <a href={`/photo.php?id=${photo.id}`}>
                <img
                  src={photo.blobUrl}
                  alt={photo.caption || 'Photo'}
                />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
