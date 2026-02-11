import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getGroup,
  getGroupMembers,
  getGroupWallPosts,
  joinGroup,
  leaveGroup,
} from '@/lib/actions/groups'
import GroupWallPostForm from '@/components/GroupWallPostForm'

interface GroupPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function GroupPage({ searchParams }: GroupPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const groupIdParam = params.id
  if (!groupIdParam) {
    redirect('/')
  }
  const groupId: string = groupIdParam

  const group = await getGroup(groupId)

  if (!group) {
    return (
      <div id="content">
        <div className="standard_message">Group not found</div>
      </div>
    )
  }

  const members = await getGroupMembers(groupId)
  const wallPosts = await getGroupWallPosts(groupId)

  const isLoggedIn = !!session?.user?.id
  const isMember = isLoggedIn && members.some((m) => m.userId === session.user.id)

  // Server actions for join/leave
  async function handleJoin() {
    'use server'
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    if (session?.user?.id) {
      await joinGroup(session.user.id, groupId)
    }
    redirect(`/group.php?id=${groupId}`)
  }

  async function handleLeave() {
    'use server'
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    if (session?.user?.id) {
      await leaveGroup(session.user.id, groupId)
    }
    redirect(`/group.php?id=${groupId}`)
  }

  return (
    <div id="content">
      <div className="group_info">
        <div className="group_title">{group.name}</div>
        {group.description && (
          <div className="group_description">{group.description}</div>
        )}
      </div>

      <div className="group_actions">
        {isLoggedIn ? (
          isMember ? (
            <form action={handleLeave}>
              <button type="submit" className="inputsubmit">
                Leave Group
              </button>
            </form>
          ) : (
            <form action={handleJoin}>
              <button type="submit" className="inputsubmit">
                Join Group
              </button>
            </form>
          )
        ) : (
          <div style={{ fontSize: '11px', color: '#666' }}>
            Log in to join this group
          </div>
        )}
      </div>

      <div className="grayheader">Members ({members.length})</div>
      <div className="group_members">
        {members.map((member) => (
          <span key={member.id} className="member_item">
            <a href={`/profile.php?id=${member.userId}`}>{member.userName}</a>
            <span className="member_role">({member.role})</span>
          </span>
        ))}
      </div>

      <div className="grayheader">Wall</div>
      {isMember && <GroupWallPostForm groupId={groupId} userId={session.user.id} />}

      <div className="group_wall">
        {wallPosts.length === 0 ? (
          <div className="standard_message">No posts yet.</div>
        ) : (
          wallPosts.map((post) => (
            <div key={post.id} className="group_wall_post">
              <span className="post_author">
                <a href={`/profile.php?id=${post.authorId}`}>{post.authorName}</a>
              </span>
              <span className="post_time">
                {post.createdAt?.toLocaleDateString()}
              </span>
              <div className="post_content">{post.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
