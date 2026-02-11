import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getGroups } from '@/lib/actions/groups'
import CreateGroupForm from '@/components/CreateGroupForm'

export default async function GroupsPage() {
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const groups = await getGroups()

  return (
    <div id="content">
      <div className="grayheader">Groups</div>

      {session?.user?.id && <CreateGroupForm userId={session.user.id} />}

      {groups.length === 0 ? (
        <div className="standard_message">No groups yet.</div>
      ) : (
        <div className="group_list">
          {groups.map((group) => (
            <div key={group.id} className="group_item">
              <a href={`/group.php?id=${group.id}`} className="group_name">
                {group.name}
              </a>
              {group.description && (
                <div className="group_desc">{group.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
