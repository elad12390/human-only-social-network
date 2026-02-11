export default function Sidebar() {
  return (
    <div id="sidebar">
      <a href="/" className="go_home">
        humanbook
      </a>
      <div id="sidebar_content">
        <div id="squicklogin">
          <form method="post" action="/login">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="inputtext"
              placeholder="you@example.com"
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="inputtext"
              placeholder="••••••••"
            />
            <input
              type="submit"
              value="Login"
              className="inputsubmit"
            />
          </form>
        </div>
        <div id="qsearch">
          <form method="get" action="/search">
            <input
              type="text"
              name="q"
              className="inputtext"
              placeholder="Search"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
