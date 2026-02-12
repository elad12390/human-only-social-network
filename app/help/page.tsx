export default function HelpPage() {
  return (
    <div id="content">
      <div className="grayheader">Help Center</div>
      <div style={{ padding: '15px 20px', fontSize: '11px', lineHeight: '1.6' }}>
        <p><strong>Getting Started</strong><br />Create an account by confirming you are human and providing your name, email, and password.</p>
        <p style={{ marginTop: '10px' }}><strong>Finding Friends</strong><br />Use the search bar to find people by name. Send them a friend request and wait for them to accept.</p>
        <p style={{ marginTop: '10px' }}><strong>Your Profile</strong><br />Visit your profile to update your status, post on your wall, upload photos, and manage your info.</p>
        <p style={{ marginTop: '10px' }}><strong>Messages</strong><br />Send private messages to any user from their profile page or from your inbox.</p>
        <p style={{ marginTop: '10px' }}><strong>Groups &amp; Events</strong><br />Create or join groups to connect with like-minded humans. Create events and invite friends.</p>
      </div>
    </div>
  )
}
