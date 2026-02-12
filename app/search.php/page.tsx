import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { searchUsers } from '@/lib/actions/search'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  const query = params.q || ''
  const results = await searchUsers(query, session?.user?.id)

  return (
    <div id="content">
      <div className="grayheader">
        {query ? `Search Results for "${query}"` : 'Search'}
      </div>

      {!query ? (
        <div className="standard_message">Enter a search term to find people.</div>
      ) : results.length === 0 ? (
        <div className="standard_message">No results found for "{query}".</div>
      ) : (
        <div>
          {results.map((user) => (
            <div
              key={user.id}
              style={{
                padding: '8px 20px',
                borderBottom: '1px solid #e9e9e9',
                fontSize: '11px',
                fontFamily: '"lucida grande", tahoma, verdana, arial, sans-serif',
              }}
            >
              <div style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                {user.image ? (
                  <img src={user.image} alt="" style={{ width: '30px', height: '30px', border: '1px solid #ccc' }} />
                ) : (
                  <div style={{ width: '30px', height: '30px', background: '#f0f0f0', border: '1px solid #ccc', display: 'inline-block' }} />
                )}
              </div>
              <a
                href={`/profile.php?id=${user.id}`}
                style={{ fontWeight: 'bold', color: '#3b5998', fontSize: '12px' }}
              >
                {user.name}
              </a>
              {session?.user?.id && (
                <span style={{ marginLeft: '10px' }}>
                  <a
                    href={`/profile.php?id=${user.id}`}
                    style={{ color: '#3b5998', fontSize: '11px' }}
                  >
                    View Profile
                  </a>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
