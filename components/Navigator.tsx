export default function Navigator() {
  return (
    <div id="navigator">
      <div className="main_set">
        <a href="/home.php">home</a>
        <a href="/profile.php">profile</a>
        <a href="/reqs.php">friends</a>
        <a href="/inbox">inbox</a>
      </div>
      <div className="secondary_set">
        <a href="/settings">settings</a>
        <span className="nav_count">|</span>
        <a href="/logout">logout</a>
      </div>
    </div>
  );
}
