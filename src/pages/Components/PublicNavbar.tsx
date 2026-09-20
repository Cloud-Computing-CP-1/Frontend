import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCloud } from "react-icons/fa";
import { HiArrowRight, HiMenu, HiX } from "react-icons/hi";
import { UsergetUser } from "../../React-Query/Auth";
import "./PublicNavbar.css";

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user, isLoading, isError } = UsergetUser();
  const loggedIn = Boolean(user?.id) && !isError;
  const label = loggedIn ? "Dashboard" : "Login";
  const nav = ["Product", "How It Works", "Multi-Cloud", "Reliability", "Pricing"];
  const authAction = isLoading ? <span className="df-auth-loading" role="status" aria-label="Checking session" /> : <Link key={label} className="df-auth-link" to={loggedIn ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)}>{label}<HiArrowRight /></Link>;

  return <header className="df-nav df-public-nav">
    <Link className="df-brand" to="/"><span className="df-brand-icon"><FaCloud /><i /></span><span>Deploy<span>Forge</span></span></Link>
    <nav id="public-navigation" aria-label="Main navigation" className={menuOpen ? "open" : ""} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("public-menu-toggle")?.focus(); } }}>{nav.map(item => <a onClick={() => setMenuOpen(false)} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>{item}</a>)}<div className="df-mobile-auth">{authAction}</div></nav>
    <div className="df-public-actions">{authAction}</div>
    <button type="button" id="public-menu-toggle" className="menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <HiX /> : <HiMenu />}</button>
  </header>;
}
