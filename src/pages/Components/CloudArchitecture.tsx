import { useState } from 'react';
import { FaAws, FaCloud, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { HiCheck, HiOutlineShieldCheck, HiPause, HiPlay } from 'react-icons/hi';
import './CloudArchitecture.css';

const providers = [
  { id: 'aws', name: 'AWS', label: 'Primary cloud', status: 'Serving traffic', detail: 'Your application runs here', icon: FaAws },
  { id: 'gcp', name: 'Google Cloud', label: 'Backup cloud', status: 'Ready for failover', detail: 'Standing by when you need it', icon: FaGoogle },
  { id: 'azure', name: 'Microsoft Azure', label: 'Backup cloud', status: 'Ready for failover', detail: 'Another layer of resilience', icon: FaMicrosoft },
];

const connections = [
  'M 500 0 V 26 Q 500 46 480 46 H 180 Q 160 46 160 66 V 110',
  'M 500 0 V 110',
  'M 500 0 V 26 Q 500 46 520 46 H 820 Q 840 46 840 66 V 110',
];

export default function CloudArchitecture() {
  const [paused, setPaused] = useState(false);

  return (
    <div className={`cloud-map${paused ? ' is-paused' : ''}`} role="group" aria-label="Multi-cloud architecture preview">
      <div className="cloud-map-toolbar">
        <span className="cloud-map-caption"><span /> Architecture preview</span>
        <button className="cloud-map-motion" type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label="Pause diagram animation">
          {paused ? <HiPlay aria-hidden="true" /> : <HiPause aria-hidden="true" />}
          <span>{paused ? 'Resume motion' : 'Pause motion'}</span>
        </button>
      </div>

      <div className="cloud-map-topology">
        <div className="cloud-map-control">
          <div className="cloud-map-emblem"><span /><FaCloud aria-hidden="true" /></div>
          <span className="cloud-map-overline">One control plane</span>
          <strong>DeployForge</strong>
          <span className="cloud-map-control-status"><span /> Orchestration active</span>
          <span className="cloud-map-port" aria-hidden="true" />
        </div>

        <svg className="cloud-map-connections" viewBox="0 0 1000 110" preserveAspectRatio="none" aria-hidden="true">
          {connections.map((path, index) => (
            <g key={path} className={`cloud-map-route cloud-map-route-${index}`}>
              <path className="cloud-map-track" d={path} vectorEffect="non-scaling-stroke" />
              <path className="cloud-map-packet" d={path} pathLength="100" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>

        <div className="cloud-map-providers">
          {providers.map(({ id, name, label, status, detail, icon: ProviderIcon }, index) => (
            <article className={`cloud-map-provider cloud-map-${id}`} key={id}>
              <span className="cloud-map-provider-port" aria-hidden="true" />
              <div className="cloud-map-provider-top">
                <span className="cloud-map-provider-icon"><ProviderIcon aria-hidden="true" /></span>
                <span className={`cloud-map-role${index === 0 ? ' is-primary' : ''}`}>{label}</span>
              </div>
              <h3>{name}</h3>
              <p>{detail}</p>
              <div className="cloud-map-activity" aria-hidden="true">
                {Array.from({ length: 24 }, (_, bar) => <i key={bar} style={{ height: `${8 + ((bar * 7 + index * 3) % 19)}px`, animationDelay: `${bar * -0.13 - index * 0.6}s` }} />)}
              </div>
              <div className="cloud-map-provider-status"><span /><span>{status}</span><HiCheck aria-hidden="true" /></div>
            </article>
          ))}
        </div>
      </div>

      <div className="cloud-map-footer">
        <span><HiOutlineShieldCheck aria-hidden="true" /> Connected. Monitored. Ready.</span>
        <span className="cloud-map-legend"><i /> Traffic routing <i /> Health checks</span>
      </div>
    </div>
  );
}
