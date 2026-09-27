import { useState } from 'react';
import { Activity, ArrowRight, Box, Check, Cloud, GitBranch, GitCommitHorizontal, Layers, Radio, ShieldCheck, Terminal } from 'lucide-react';
import { FaGithub as Github } from 'react-icons/fa';

const stages = [
  { name: 'Build', icon: Box, title: 'Your code. Ready for the cloud.', description: 'Turn your repository into a container image, with build progress and logs in one place.', lines: ['Repository connected · main', 'Docker image built successfully', 'Container image ready to deploy'], status: 'Image ready', label: 'Container image', value: 'api-service:main', foot: 'One image, ready for your infrastructure.' },
  { name: 'Deploy', icon: Cloud, title: 'Choose your cloud. Ship your app.', description: 'Select your infrastructure and follow your application from container image to running deployment.', lines: ['Container image selected', 'Primary provider configured · AWS', 'Application deployment complete'], status: 'Deployment ready', label: 'Primary provider', value: 'Amazon Web Services', foot: 'A clear view of every deployment.' },
  { name: 'Monitor', icon: Activity, title: 'Know what is running. Stay ahead.', description: 'Keep application health, cloud availability, and deployment history together in one workspace.', lines: ['Application health check passed', 'Backup providers on standby', 'Traffic routed to healthy application'], status: 'Checks passing', label: 'Application health', value: 'Healthy & available', foot: 'Visibility across your entire deployment.' },
];

export default function DeploymentPreview() {
  const [selected, setSelected] = useState(0);
  const stage = stages[selected];
  return <section className="deployment-preview section" aria-labelledby="preview-heading">
    <div className="preview-heading">
      <div><span className="eyebrow"><Layers size={14} /> From commit to cloud</span><h2 id="preview-heading">Less switching tabs.<br /><span>More shipping.</span></h2></div>
      <p>Your deployment journey, connected.<br />Bring builds, cloud deployments, and application health into one workspace.</p>
    </div>
    <div className="preview-workspace">
      <div className="preview-toolbar"><span><Terminal size={15} /> DeployForge workspace</span><span className="preview-example">Interactive preview · sample data</span></div>
      <div className="preview-body">
        <div className="preview-sidebar">
          <div className="preview-tabs" role="tablist" aria-label="Deployment workflow">{stages.map(({ name, icon: StageIcon }, index) => <button key={name} id={`preview-tab-${index}`} role="tab" type="button" aria-selected={index === selected} aria-controls="preview-panel" tabIndex={index === selected ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => {
            const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % stages.length : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + stages.length - 1) % stages.length : event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : null;
            if (next !== null) { event.preventDefault(); setSelected(next); document.getElementById(`preview-tab-${next}`)?.focus(); }
          }}><StageIcon size={17} /><span>{name}</span><span className="preview-tab-number">0{index + 1}</span></button>)}</div>
          <div className="preview-sidebar-note"><ShieldCheck size={19} /><p>One workflow.<br />Every cloud.</p></div>
        </div>
        <div className="preview-panel" id="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${selected}`} tabIndex={0}>
          <div className="preview-project"><div className="preview-project-icon"><Github size={23} /></div><div><strong>api-service</strong><span><GitBranch size={12} /> main <i /> Production</span></div><span className="preview-ready"><span />{stage.status}</span></div>
          <div className="preview-details" key={selected}>
            <div className="preview-stage-copy"><h3>{stage.title}</h3><p>{stage.description}</p></div>
            <div className="preview-console"><div className="preview-console-label"><GitCommitHorizontal size={14} /> Deployment activity <span>EXAMPLE</span></div>{stage.lines.map((line, index) => <div className="preview-log" key={line} style={{ animationDelay: `${index * 110}ms` }}><span>0{index + 1}</span><Check size={14} /><span>{line}</span><span>done</span></div>)}</div>
            <div className="preview-result"><div><span>{stage.label}</span><strong>{stage.value}</strong></div><div className="preview-result-icon"><Radio size={23} /></div></div>
          </div>
          <div className="preview-panel-footer"><span><ShieldCheck size={14} />{stage.foot}</span><a href="/login">Open your workspace <ArrowRight size={14} /></a></div>
        </div>
      </div>
    </div>
  </section>;
}
