import { Sidebar } from "./Sidebar";
import { getCurrentUser } from "../auth";
import { ChatWidget } from "./ChatWidget";

export function Layout({ children }) {
  const user = getCurrentUser();

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Welcome Back, <span style={{color: 'var(--text-primary)'}}>{(user?.name && user.name.split(' ')[0]) || "User"}</span>
          </div>

          <div className="header-user">
            <div className="user-avatar">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
