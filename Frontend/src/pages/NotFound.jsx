import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page notfound">
      <h2>Page not found</h2>
      <p>Looks like the page you were trying to reach doesn't exist.</p>
      <Link className="btn primary" to="/">
        Go home
      </Link>
    </div>
  );
}
