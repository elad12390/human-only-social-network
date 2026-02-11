import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getEvents } from '@/lib/actions/events'
import CreateEventForm from '@/components/CreateEventForm'

export default async function EventsPage() {
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const events = await getEvents()

  return (
    <div id="content">
      <div className="grayheader">Events</div>

      {session?.user?.id && <CreateEventForm userId={session.user.id} />}

      {events.length === 0 ? (
        <div className="standard_message">No events yet.</div>
      ) : (
        <div className="event_list">
          {events.map((event) => (
            <div key={event.id} className="event_item">
              <a href={`/event.php?id=${event.id}`} className="event_name">
                {event.name}
              </a>
              {(event.location || event.startTime) && (
                <div className="event_details">
                  {event.location && <div>{event.location}</div>}
                  {event.startTime && (
                    <div>{event.startTime.toLocaleDateString()}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
