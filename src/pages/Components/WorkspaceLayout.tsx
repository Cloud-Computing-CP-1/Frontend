import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiCloud, FiGrid, FiKey, FiLayers, FiMenu, FiSettings, FiX } from "react-icons/fi";
import type { AuthUser } from "../../React-Query/Auth";
import "../Workspace.css";

export type WorkspaceSection = "overview" | "projects" | "deployments" | "environment" | "settings";

export default function WorkspaceLayout({ user, active, children, projectId }: { user?: AuthUser; active: WorkspaceSection; children: ReactNode; projectId?: string }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const name = user?.username || user?.email || "Your workspace";
  const initials = name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  const closeDrawer = () => { drawer.current?.close(); document.body.style.overflow = ""; };
  const projectQuery = projectId ? `&project=${encodeURIComponent(projectId)}` : "";
  const links = [
    { id: "overview", label: "Overview", icon: FiGrid, to: "/dashboard" },
    { id: "projects", label: "Projects", icon: FiLayers, to: "/projects" },
    { id: "deployments", label: "Deployments", icon: FiActivity, to: `/dashboard?view=deployments${projectQuery}` },
    { id: "environment", label: "Environment", icon: FiKey, to: projectId ? `/projects/${projectId}?tab=environment` : "/dashboard?view=environment" },
    { id: "settings", label: "Settings", icon: FiSettings, to: projectId ? `/projects/${projectId}?tab=settings` : "/dashboard?view=settings" },
  ];
  const brand = <Link to="/dashboard" className="dfw-brand" onClick={closeDrawer}><span><FiCloud /></span><strong>Deploy<span>Forge</span></strong></Link>;
  const sidebar = <>
    <div className="dfw-sidebar-brand">{brand}</div>
    <div className="dfw-workspace-label">Workspace <span>Personal</span></div>
    <nav aria-label="Workspace navigation">{links.map(item => <Link key={item.id} to={item.to} onClick={closeDrawer} aria-current={active === item.id ? "page" : undefined}><item.icon />{item.label}</Link>)}</nav>
    <div className="dfw-sidebar-bottom"><div className="dfw-account"><span className="dfw-avatar">{initials}</span><div><strong>{name}</strong><small>{user?.email || "Personal workspace"}</small></div></div><Link to="/" onClick={closeDrawer}>DeployForge home <span aria-hidden="true">↗</span></Link></div>
  </>;
  return <div className="dfw-shell">
    <a className="dfw-skip" href="#workspace-content">Skip to content</a>
    <div className="dfw-mobile-bar">{brand}<button type="button" className="dfw-button" aria-label="Open workspace navigation" aria-haspopup="dialog" onClick={() => { drawer.current?.showModal(); document.body.style.overflow = "hidden"; }}><FiMenu /></button></div>
    <aside className="dfw-sidebar">{sidebar}</aside>
    <dialog ref={drawer} className="dfw-drawer" aria-label="Workspace navigation" onClose={() => { document.body.style.overflow = ""; }} onClick={event => { if (event.target === event.currentTarget) closeDrawer(); }}><div className="dfw-drawer-inner"><button type="button" autoFocus className="dfw-drawer-close dfw-button" aria-label="Close navigation" onClick={closeDrawer}><FiX /></button>{sidebar}</div></dialog>
    <main id="workspace-content" className="dfw-main"><div className="dfw-content">{children}</div></main>
  </div>;
}
