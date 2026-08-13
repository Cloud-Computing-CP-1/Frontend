import { FaCloud, FaGithub, FaShieldAlt, FaChartBar } from 'react-icons/fa';
import { HiOutlineArrowLeft, HiOutlineShieldCheck } from 'react-icons/hi';

const features = [
  { icon: <FaCloud />, title: 'Cloud Infrastructure', text: 'Provision and manage powerful cloud resources.' },
  { icon: <FaShieldAlt />, title: 'Secure & Reliable', text: 'Enterprise-grade security and 99.9% uptime' },
  { icon: <FaChartBar />, title: 'Monitor & Optimize', text: 'Real-time insights to monitor and optimize performance.' },
];

export default function Login() {
  const loginWithGithub = () => { window.location.href = `${import.meta.env.VITE_BACKEND_URI}/auth/github`; };
  return <main className="login-page">
    <section className="intro-panel">
      <div className="dot-field" />
      <a className="login-brand" href="/" aria-label="Go to DeployForge home"><img src="/logo.png" alt="DeployForge" /></a>
      <div className="intro-copy">
        <span className="login-eyebrow">Multi-cloud deployment platform</span>
        <h1>Deploy. Manage. Scale.<br />Effortlessly.</h1>
        <p>DeployForge is your all-in-one cloud platform to build, deploy and scale applications with ease and confidence.</p>
        <div className="feature-list">{features.map((item) => <div className="feature" key={item.title}><div className="feature-icon">{item.icon}</div><div><strong>{item.title}</strong><span>{item.text}</span></div></div>)}</div>
      </div>
    </section>
    <section className="auth-panel">
      <div className="blue-blob" />
      <div className="login-card">
        <a className="back-home" href="/"><HiOutlineArrowLeft /> Back to home</a>
        <div className="card-logo"><FaCloud /></div>
        <h2 className="welcome">Welcome to <span className="accent">DeployForge</span></h2>
        <p className="subtitle">Sign in to your account to continue</p>
        <button className="github-button" type="button" onClick={loginWithGithub}><FaGithub /> Login with GitHub</button>
        <div className="security-divider"><span className="security-icon"><HiOutlineShieldCheck /></span></div>
        <p className="security-note"><HiOutlineShieldCheck size={21} /> <span>We only use GitHub to authenticate you securely.<br />No additional permissions are required.</span></p>
      </div>
      <footer className="footer">© 2026 DeployForge. All rights reserved. <a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></footer>
    </section>
  </main>;
}
