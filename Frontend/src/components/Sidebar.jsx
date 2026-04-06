import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, UploadCloud, UserCircle, LogOut } from "lucide-react";
import { signOut } from "../auth";

export function Sidebar() {
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    window.location.href = "/signin";
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/upload", label: "Upload", icon: UploadCloud },
    { path: "/account", label: "Account", icon: UserCircle },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">SmartInvoice</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="btn ghost" onClick={handleSignOut} style={{ width: "100%", justifyContent: "flex-start", padding: "12px 16px" }}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
