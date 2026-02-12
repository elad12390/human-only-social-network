import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getFriends } from '@/lib/actions/friends'
import ComposeMessageForm from '@/components/ComposeMessageForm'

interface ComposePageProps {
  searchParams: Promise<{ to?: string; subject?: string }>
}

export default async function ComposePage({ searchParams }: ComposePageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.id) {
    redirect('/')
  }

  const friends = await getFriends(session.user.id)

  return (
    <div id="content">
      <div className="grayheader">Compose Message</div>
      <a href="/inbox" style={{ display: 'block', padding: '10px', color: '#3b5998' }}>
        Back to Inbox
      </a>
      <ComposeMessageForm
        currentUserId={session.user.id}
        prefillRecipientId={params.to}
        prefillSubject={params.subject}
        friends={friends}
      />
    </div>
  )
}
