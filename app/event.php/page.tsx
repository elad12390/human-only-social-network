import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getEvent,
  getEventRsvps,
  getEventRsvpStatus,
} from '@/lib/actions/events'
import RsvpButtons from '@/components/RsvpButtons'

interface EventPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function EventPage({ searchParams }: EventPageProps) {
  const params = await searchParams
  const headersList = await headers()

  const session = await auth.api.getSession({ headers: headersList })

  const eventIdParam = params.id
  if (!eventIdParam) {
    redirect('/')
  }
  const eventId: string = eventIdParam

  const event = await getEvent(eventId)

  if (!event) {
    return (
      <div id="content">
        <div className="standard_message">Event not found</div>
      </div>
    )
  }

  const rsvps = await getEventRsvps(eventId)

  let currentStatus: string | null = null
  if (session?.user?.id) {
    currentStatus = await getEventRsvpStatus(session.user.id, eventId)
  }

  return (
    <div id="content">
      <div style={{ padding: '10px 20px' }}>
        <a href="/events.php" style={{ color: '#3b5998', fontSize: '11px' }}>
          &laquo; Back to Events
        </a>
      </div>
      <div className="event_info">
        <div className="event_title">{event.name}</div>
        {event.description && (
          <div className="event_description">{event.description}</div>
        )}
        {event.location && (
          <div className="event_location">Location: {event.location}</div>
        )}
        {event.startTime && (
          <div className="event_time">
            Start: {event.startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
        {event.endTime && (
          <div className="event_time">
            End: {event.endTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {event.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {session?.user?.id ? (
        <RsvpButtons
          eventId={eventId}
          userId={session.user.id}
          currentStatus={currentStatus}
        />
      ) : (
        <div style={{ padding: '10px 20px', fontSize: '11px', color: '#666' }}>
          Log in to RSVP to this event
        </div>
      )}

      <div className="grayheader">Guest List</div>
      <div className="event_guest_list">
        {['attending', 'maybe', 'declined'].map((status) => {
          const guests = rsvps.filter((r) => r.status === status)
          if (guests.length === 0) return null
          return (
            <div key={status} className="guest_section">
              <div className="guest_section_title">
                {status.charAt(0).toUpperCase() + status.slice(1)} (
                {guests.length})
              </div>
              {guests.map((guest) => (
                <span key={guest.id} className="guest_item">
                  <a href={`/profile.php?id=${guest.userId}`}>
                    {guest.userName}
                  </a>
                </span>
              ))}
            </div>
          )
        })}
        {rsvps.length === 0 && (
          <div className="standard_message">No RSVPs yet.</div>
        )}
      </div>

      <div style={{ padding: '10px 20px' }}>
        <a href="/events.php" style={{ color: '#3b5998', fontSize: '11px' }}>
          Back to Events
        </a>
      </div>
    </div>
  )
}
