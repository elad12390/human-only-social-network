import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProfile } from '@/lib/actions/profile'
import EditProfileForm from '@/components/EditProfileForm'

export default async function EditProfilePage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session?.user?.id) {
    redirect('/')
  }
  const profile = await getProfile(session.user.id)
  return (
    <div id="content">
      <div className="grayheader">Edit Profile</div>
      <a href="/profile.php" style={{ display: 'block', padding: '10px 20px', color: '#3b5998', fontSize: '11px' }}>
        Back to Profile
      </a>
      <EditProfileForm
        userId={session.user.id}
        currentBio={profile?.bio || ''}
        currentPhotoUrl={profile?.profilePhotoUrl || ''}
      />
    </div>
  )
}
