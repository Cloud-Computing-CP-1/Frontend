import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useInView } from 'framer-motion';
import { Activity, AlertTriangle, Check, Cloud, Pause, Play, RotateCcw, Server, ShieldCheck, SkipForward } from 'lucide-react';
import { FaAws, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { demoReducer, initialDemoState, phases, providerState } from './failoverDemo';
import type { CloudState } from './failoverDemo';
import './HeroDeployment.css';

const providers = [
  { id: 'aws', name: 'AWS', icon: FaAws },
  { id: 'gcp', name: 'Google Cloud', icon: FaGoogle },
  { id: 'azure', name: 'Microsoft Azure', icon: FaMicrosoft },
] as const;
const branches = [
  'M300 0 V8 Q300 16 288 16 H112 Q100 16 100 26 V40',
  'M300 0 V40',
  'M300 0 V8 Q300 16 312 16 H488 Q500 16 500 26 V40',
];
const returns = [
  'M100 0 V12 Q100 22 112 22 H288 Q300 22 300 32 V40',
  'M300 0 V40',
  'M500 0 V12 Q500 22 488 22 H312 Q300 22 300 32 V40',
];
const cloudLabels: Record<CloudState, [string, string]> = {
  primary: ['PRIMARY', 'Application running'],
  standby: ['STANDBY', 'Ready for failover'],
  outage: ['OUTAGE', 'Health check failed'],
  starting: ['STARTING', 'Starting deployment'],
  healthy: ['HEALTHY', 'Ready for traffic'],
};
const progressLabels = ['Detect', 'Select', 'Deploy', 'Route'];

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Connection({ path, state, flow }: { path: string; state: CloudState; flow: boolean }) {
  return <g className={`failover-route is-${state}`}>
    <path className="failover-track" d={path} vectorEffect="non-scaling-stroke" />
    {flow && <path className="failover-particle" d={path} pathLength="100" vectorEffect="non-scaling-stroke" />}
  </g>;
}

export default function HeroDeployment() {
  const [demo, dispatch] = useReducer(demoReducer, initialDemoState);
  const container = useRef<HTMLDivElement>(null);
  const visible = useInView(container, { amount: .35 });
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const phase = phases[demo.phase];
  const stopped = demo.paused || !!reducedMotion || !visible || !pageVisible;
  const clock = useRef({ key: '', remaining: 0 });

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const key = `${demo.phase}:${demo.replay}`;
    if (clock.current.key !== key) clock.current = { key, remaining: phase.duration };
    if (stopped) return;
    const started = performance.now();
    const timer = window.setTimeout(() => dispatch({ type: 'NEXT' }), clock.current.remaining);
    return () => {
      window.clearTimeout(timer);
      clock.current.remaining = Math.max(0, clock.current.remaining - (performance.now() - started));
    };
  }, [demo.phase, demo.replay, phase.duration, stopped]);

  const transition = { duration: reducedMotion ? 0 : .25 };
  const healthy = phase.active !== null;

  return <div ref={container} className={`failover-demo relative isolate w-full min-w-0 rounded-2xl bg-[#080A0F] text-slate-100 ${stopped ? 'is-paused' : ''}`} data-phase={demo.phase} role="group" aria-label="Simulated automatic cloud failover demo">
    <div className="flex h-7 items-center justify-between gap-2">
      <span className="failover-kicker flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Failover demo</span>
      <div className="flex gap-1">
        {reducedMotion ? <button className="failover-button" onClick={() => dispatch({ type: 'NEXT' })} aria-label="Next demo step"><SkipForward size={12} /><span>Next step</span></button>
          : <button className="failover-button" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-label={demo.paused ? 'Resume demo' : 'Pause demo'}>{demo.paused ? <Play size={12} /> : <Pause size={12} />}<span>{demo.paused ? 'Resume' : 'Pause'}</span></button>}
        <button className="failover-button" onClick={() => dispatch({ type: 'REPLAY' })} aria-label="Replay demo" title="Replay demo"><RotateCcw size={12} /></button>
      </div>
    </div>

    <motion.div className="failover-topology mx-auto mt-3 flex w-full flex-col items-center" initial={false} animate={{ opacity: demo.phase === 'RESET' && !reducedMotion ? .4 : 1 }} transition={transition}>
      <div className={`failover-router relative flex flex-col items-center rounded-xl border px-3 text-center tone-${phase.tone}`}>
        <div className="flex items-center gap-2"><span className="failover-brand-icon grid place-items-center rounded-lg"><Cloud size={20} fill="currentColor" /></span><div className="text-left"><strong className="block text-sm font-bold tracking-tight">DeployForge</strong><small className="text-[9px] text-slate-400">Multi-Cloud Router</small></div></div>
        <motion.div key={phase.router} initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 3 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="failover-router-status flex items-center justify-center gap-1.5">
          {phase.tone === 'danger' ? <AlertTriangle size={11} /> : phase.tone === 'success' ? <Check size={11} /> : <Activity size={11} />}{phase.router}
        </motion.div>
        <span className="failover-router-note">{phase.notice}</span>
      </div>

      <svg className="failover-wire" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
        {providers.map(({ id }, index) => {
          const state = providerState(demo.phase, id);
          return <Connection key={id} path={branches[index]} state={state} flow={state === 'primary' || state === 'starting' || state === 'healthy'} />;
        })}
      </svg>

      <div className="grid w-full grid-cols-3">
        {providers.map(({ id, name, icon: Logo }) => {
          const state = providerState(demo.phase, id);
          const [label, detail] = cloudLabels[state];
          const justFailed = (demo.phase === 'AWS_FAILURE' && id === 'aws') || (demo.phase === 'GCP_FAILURE' && id === 'gcp');
          return <motion.div key={id} data-cloud={id} data-status={state} className={`failover-provider relative min-w-0 rounded-xl border is-${state} ${justFailed ? 'outage-pulse' : ''}`} animate={{ borderColor: state === 'outage' ? '#a74451' : state === 'primary' ? '#427ff0' : state === 'starting' ? '#a67835' : state === 'healthy' ? '#40866d' : '#293247' }} transition={transition}>
            <div className="flex items-center justify-between"><Logo className={`failover-logo logo-${id}`} aria-hidden="true" /><span className="failover-cloud-dot" /></div>
            <strong className="failover-provider-name block font-semibold">{name}</strong>
            <motion.div key={label} initial={{ opacity: reducedMotion ? 1 : .3 }} animate={{ opacity: 1 }} transition={transition}>
              <span className="failover-cloud-status flex items-center gap-1">{state === 'outage' ? <AlertTriangle size={9} /> : state === 'primary' || state === 'healthy' ? <Check size={10} /> : <span className="h-1 w-1 rounded-full bg-current" />}{label}</span>
              <small className="failover-cloud-detail block">{detail}</small>
            </motion.div>
          </motion.div>;
        })}
      </div>

      <svg className="failover-wire" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
        {providers.map(({ id }, index) => <Connection key={id} path={returns[index]} state={providerState(demo.phase, id) === 'outage' ? 'outage' : phase.active === id ? 'primary' : 'standby'} flow={phase.active === id} />)}
      </svg>

      <div className="failover-app flex items-center gap-2.5 rounded-xl border px-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Server size={18} /></span>
        <div className="min-w-0"><strong className="block text-[11px] font-semibold">Application <span className="ml-1 text-[9px] font-normal text-emerald-300">● Running</span></strong><motion.small key={phase.application} initial={{ opacity: reducedMotion ? 1 : .3 }} animate={{ opacity: 1 }} transition={transition} className="block text-[9px] text-slate-400">{phase.application}</motion.small></div>
        <ShieldCheck size={16} className="ml-auto shrink-0 text-emerald-300" />
      </div>
    </motion.div>

    <div className={`failover-story mt-2 tone-${phase.tone}`}>
      <div className="failover-story-text flex items-center justify-center gap-1.5" role="status" aria-live={demo.paused || reducedMotion ? 'polite' : 'off'}>
        {healthy ? <Check size={12} /> : <Activity size={12} />}<span>{phase.message}</span>
      </div>
      <ol className="mt-1.5 grid grid-cols-4 gap-1" aria-label="Failover progress">
        {progressLabels.map((label, index) => <li key={label} className={`failover-step ${phase.step >= index ? 'is-complete' : ''} ${phase.step === index ? 'is-current' : ''}`} aria-current={phase.step === index ? 'step' : undefined}><span /><small>{label}</small></li>)}
      </ol>
    </div>
    <motion.div key={demo.phase === 'MONITORING_AZURE' ? 'resilient' : 'tagline'} initial={{ opacity: reducedMotion ? 1 : .5 }} animate={{ opacity: 1 }} transition={transition} className="failover-tagline text-center text-[10px] text-slate-400">{demo.phase === 'MONITORING_AZURE' ? 'Application remained available despite multiple cloud failures.' : <>Clouds can fail. <span className="text-slate-200">Your application stays available.</span></>}</motion.div>
  </div>;
}
