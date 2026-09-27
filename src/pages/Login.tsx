import { FaAws, FaCloud, FaGithub, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { HiArrowRight, HiCheck, HiOutlineArrowLeft, HiOutlineCube, HiOutlineShieldCheck, HiOutlineTerminal } from 'react-icons/hi';
import './Login.css';

export default function Login() {
  const loginWithGithub = () => { window.location.href = `${import.meta.env.VITE_BACKEND_URI}/auth/github`; };
  return <main className="forge-login">
    <header className="signin-header">
      <a className="signin-brand" href="/" aria-label="DeployForge home"><span><FaCloud /></span><strong>Deploy<span>Forge</span></strong></a>
      <a className="signin-back" href="/"><HiOutlineArrowLeft /> Back to home</a>
    </header>

    <div className="signin-layout">
      <section className="signin-story" aria-labelledby="signin-story-title">
        <div className="signin-story-copy">
          <span className="signin-eyebrow"><span /> BUILT FOR YOUR NEXT DEPLOYMENT</span>
          <h1 id="signin-story-title">Your code.<br />Any cloud.<br /><span>One workspace.</span></h1>
          <p>From your first commit to your next release.<br />Build, deploy, and keep everything in view.</p>
        </div>

        <div className="signin-deployment" aria-label="Example deployment workflow">
          <div className="signin-demo-heading"><span><HiOutlineTerminal /> Deployment workflow</span><small>PREVIEW</small></div>
          <div className="signin-demo-project"><span className="signin-repo-icon"><FaGithub /></span><div><strong>your-next-project</strong><small>main <span>·</span> Ready to ship</small></div><span className="signin-demo-tag">Production</span></div>
          <ol className="signin-pipeline">
            <li><span className="signin-stage-icon"><FaGithub /></span><div><strong>Connect your repository</strong><small>Start with the code you already have</small></div><HiCheck className="signin-stage-check" /></li>
            <li><span className="signin-stage-icon"><HiOutlineCube /></span><div><strong>Build your container</strong><small>A consistent image for every cloud</small></div><HiCheck className="signin-stage-check" /></li>
            <li><span className="signin-stage-icon"><FaCloud /></span><div><strong>Make your next move</strong><small>Choose a cloud. Deploy with confidence.</small></div><HiArrowRight className="signin-stage-arrow" /></li>
          </ol>
          <div className="signin-demo-footer"><HiOutlineShieldCheck /> Built for a more resilient application.</div>
        </div>
        <div className="signin-providers"><span>ONE PLATFORM. THREE CLOUDS.</span><div><span><FaAws /> AWS</span><span><FaGoogle /> Google Cloud</span><span><FaMicrosoft /> Azure</span></div></div>
      </section>

      <section className="signin-access" aria-labelledby="signin-title">
        <div className="signin-form">
          <div className="signin-welcome-icon"><FaCloud /><span><HiCheck /></span></div>
          <span className="signin-form-kicker">YOUR NEXT RELEASE STARTS HERE</span>
          <h2 id="signin-title">Welcome to<br />Deploy<span>Forge.</span></h2>
          <p className="signin-description">Your projects. Your infrastructure.<br />Sign in to bring it all together.</p>
          <button className="signin-github" type="button" onClick={loginWithGithub}><FaGithub /><span>Continue with GitHub</span><HiArrowRight /></button>
          <p className="signin-account-note">Use your GitHub account to get started.</p>
          <div className="signin-security"><span><HiOutlineShieldCheck /></span><div><strong>A familiar, secure sign-in</strong><p>You’ll continue to GitHub to sign in and review the requested permissions.</p></div></div>
          <div className="signin-workspace-note"><span /> One account for your entire workspace</div>
        </div>
        <div className="signin-access-footer"><HiOutlineCube /> Less setup. More shipping.</div>
      </section>
    </div>
    <footer className="signin-footer"><span>© 2026 DeployForge</span><span>From code to cloud, with confidence.</span></footer>
  </main>;
}
