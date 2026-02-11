import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import StatusUpdateForm from '@/components/StatusUpdateForm'

export default async function HomePage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  return (
    <div id="content">
      <StatusUpdateForm
        userId={session.user.id}
        userName={session.user.name || 'You'}
        onStatusCreated={() => {}}
      />
      <div className="standard_message">Your news feed will appear here.</div>
    </div>
  )
}
