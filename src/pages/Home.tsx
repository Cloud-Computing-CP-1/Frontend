import PublicNavbar from './Components/PublicNavbar';
import HeroDeployment from './Components/HeroDeployment';
import DeploymentPreview from './Components/DeploymentPreview';
import { FaAws, FaCloud, FaDocker, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { HiArrowDown, HiArrowRight, HiChartBar, HiCheck, HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineStatusOnline } from 'react-icons/hi';
import { HiServer } from 'react-icons/hi2';
import './Home.css';

const features = [
  { title: 'One deployment. More possibilities.', text: 'Run your containers on AWS, Google Cloud, or Azure. Manage every provider from the same workspace.', icon: HiServer, detail: 'MULTI-CLOUD DEPLOYMENT' },
  { title: 'A fallback, already in place.', text: 'When a provider goes down, health checks detect the failure and trigger deployment to a healthy backup.', icon: HiOutlineRefresh, detail: 'AUTOMATIC FAILOVER' },
  { title: 'Keep moving. Keep serving.', text: 'Coordinate deployments and infrastructure changes with application availability in mind.', icon: HiOutlineStatusOnline, detail: 'APPLICATION CONTINUITY' },
  { title: 'The whole picture, in one place.', text: 'Follow application health, deployment activity, and cloud availability without switching between consoles.', icon: HiChartBar, detail: 'CENTRALIZED MONITORING' },
];

const steps = [
  ['Connect', 'Start with your repository or a container image.'],
  ['Configure', 'Choose your providers, resources, and deployment settings.'],
  ['Deploy', 'Send your application to your selected cloud infrastructure.'],
  ['Stay available', 'Monitor health and let automatic failover handle interruptions.'],
];

export default function Home() {
  return (
    <main id="top" className="landing-page">
      <a className="home-skip-link" href="#home-content">Skip to content</a>
      <PublicNavbar items={['Product', 'How It Works', 'Workspace']} />
      <section className="home-hero home-container" id="home-content" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <span className="home-kicker"><span /> ONE APP. EVERY CLOUD.</span>
          <h1 id="home-title">Your fastest path<br />to production.<br /><span className="home-hero-highlight">Across clouds.<i aria-hidden="true" /></span></h1>
          <p>Deploy your Docker apps with confidence.<br />One workspace for AWS, Google Cloud, and Azure.<br />A backup plan built in.</p>
          <div className="home-hero-actions">
            <a className="home-button" href="#get-started">Deploy your first app <HiArrowRight /></a>
            <a className="home-text-link" href="#how-it-works">See how it works <HiArrowDown /></a>
          </div>
          <div className="home-hero-note"><FaDocker /> Your containers. Your clouds. One control plane.</div>
        </div>
        <div className="home-hero-visual">
          <div className="home-image-source"><FaDocker /><code>my-app:latest</code><span>CONTAINER IMAGE</span></div>
          <figure className="home-demo">
            <div className="home-demo-heading"><span>PRODUCTION / MULTI-CLOUD</span><span>LIVE SIMULATION</span></div>
            <HeroDeployment />
          </figure>
        </div>
      </section>
      <div className="home-clouds home-container" aria-label="Supported cloud providers">
        <span>ONE WORKFLOW.<br /><strong>THREE CLOUDS.</strong></span>
        <span><FaAws /> Amazon Web Services</span><span><FaGoogle /> Google Cloud</span><span><FaMicrosoft /> Microsoft Azure</span>
        <span className="home-clouds-end">Built around your stack.</span>
      </div>
      <section className="home-product home-container" id="product" aria-labelledby="product-title">
        <div className="home-section-heading"><span className="home-kicker">01 / THE PLATFORM</span><div><h2 id="product-title">Less infrastructure to manage.<br /><span>More room to build.</span></h2><p>The tools to ship, the visibility to stay in control, and a backup plan for the unexpected.</p></div></div>
        <div className="home-features">{features.map(({ title, text, icon: FeatureIcon, detail }, index) => (
          <article className="home-feature" key={title}><div className="home-feature-meta"><FeatureIcon /><span>0{index + 1}</span></div><span className="home-feature-label">{detail}</span><h3>{title}</h3><p>{text}</p></article>
        ))}</div>
      </section>
      <section className="home-process" id="how-it-works" aria-labelledby="process-title">
        <div className="home-container"><div className="home-section-heading"><span className="home-kicker">02 / FROM IMAGE TO LIVE</span><div><h2 id="process-title">A clear path to production.</h2><p>Connect your application. Choose your clouds. Take it from there.</p></div></div>
          <div className="home-steps">{steps.map(([title, description], index) => (
            <article key={title}><div className="home-step-number"><span>0{index + 1}</span>{index < steps.length - 1 ? <HiArrowRight /> : <HiCheck />}</div><h3>{title}</h3><p>{description}</p></article>
          ))}</div>
        </div>
      </section>
      <div id="workspace" className="home-workspace"><DeploymentPreview /></div>
      <section className="home-config home-container" aria-labelledby="config-title">
        <div className="home-config-copy"><span className="home-kicker">03 / DEVELOPER FIRST</span><h2 id="config-title">Your deployment.<br /><em>Your rules.</em></h2><p>Choose where your app runs and where it goes next. DeployForge brings your configuration, health checks, and deployment history together.</p><ul>{['Multi-cloud configuration', 'Automated health checks', 'Deployment history', 'Coordinated failover'].map(item => <li key={item}><HiCheck />{item}</li>)}</ul></div>
        <div className="home-config-card"><div className="home-config-top"><span><FaDocker /> Deployment blueprint</span><span>ILLUSTRATIVE CONFIG</span></div><pre aria-label="Example deployment configuration"><code><span className="home-code-comment"># One app. A plan for every cloud.</span>{'\n\n'}<b>app</b>: my-app{'\n'}<b>image</b>: my-registry/my-app:latest{'\n\n'}<b>primary</b>: <span>aws</span>{'\n'}<b>backup</b>:{'\n'}  - gcp{'\n'}  - azure{'\n\n'}<b>healthCheck</b>: <span>enabled</span>{'\n'}<b>failover</b>: <span>automatic</span></code></pre><div className="home-config-foot"><HiOutlineShieldCheck /> Resilience starts with a plan.</div></div>
      </section>
      <section className="home-cta home-container" id="get-started" aria-labelledby="cta-title">
        <div><span className="home-kicker">BUILD SOMETHING THAT LASTS</span><h2 id="cta-title">Your next deployment.<br /><em>On stronger ground.</em></h2></div>
        <div><a className="home-button" href="/login">Start deploying <HiArrowRight /></a><p>One workspace. Every cloud.</p></div>
      </section>
      <footer className="home-footer home-container">
        <div className="home-footer-top"><a className="home-footer-brand" href="#top"><FaCloud /> DeployForge</a><p>Built for the way forward.</p><nav aria-label="Footer navigation"><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#workspace">Workspace</a><a href="/login">Get started <HiArrowRight /></a></nav></div>
        <div className="home-footer-bottom"><span>&copy; 2026 DeployForge</span><span>YOUR CLOUDS. WORKING TOGETHER.</span><a href="#top">Back to top <HiArrowDown /></a></div>
      </footer>
    </main>
  );
}
