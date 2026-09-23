export type Provider = 'aws' | 'gcp' | 'azure';
export type CloudState = 'primary' | 'standby' | 'outage' | 'starting' | 'healthy';

type Phase = {
  duration: number;
  next: PhaseName;
  router: string;
  notice: string;
  message: string;
  application: string;
  active: Provider | null;
  gcp: CloudState;
  azure: CloudState;
  awsFailed: boolean;
  step: number;
  tone: 'normal' | 'danger' | 'warning' | 'success';
};
export type PhaseName =
  | 'NORMAL_AWS' | 'AWS_FAILURE' | 'DETECTING_AWS_FAILURE'
  | 'FAILOVER_TO_GCP' | 'GCP_STARTING' | 'GCP_HEALTHY' | 'REDIRECTING_TO_GCP'
  | 'RUNNING_GCP' | 'MONITORING_GCP' | 'GCP_FAILURE' | 'DETECTING_GCP_FAILURE'
  | 'FAILOVER_TO_AZURE' | 'AZURE_SELECTED' | 'AZURE_STARTING' | 'AZURE_HEALTHY'
  | 'REDIRECTING_TO_AZURE' | 'RUNNING_AZURE' | 'MONITORING_AZURE' | 'RESET';

// Keep each replacement healthy before routing traffic to it.
// GCP serves for 3 seconds; Azure serves for 4 seconds before the loop resets.
export const phases: Record<PhaseName, Phase> = {
  NORMAL_AWS: { duration: 3000, next: 'AWS_FAILURE', router: 'Monitoring', notice: 'All systems operational', message: 'Application healthy · Running on AWS', application: 'Running on AWS', active: 'aws', gcp: 'standby', azure: 'standby', awsFailed: false, step: -1, tone: 'normal' },
  AWS_FAILURE: { duration: 350, next: 'DETECTING_AWS_FAILURE', router: 'AWS health check failed', notice: 'Primary cloud unavailable', message: 'AWS health check failed', application: 'Failover protection active', active: null, gcp: 'standby', azure: 'standby', awsFailed: true, step: 0, tone: 'danger' },
  DETECTING_AWS_FAILURE: { duration: 650, next: 'FAILOVER_TO_GCP', router: 'Outage detected', notice: 'Primary unavailable', message: 'AWS outage confirmed', application: 'Failover protection active', active: null, gcp: 'standby', azure: 'standby', awsFailed: true, step: 0, tone: 'danger' },
  FAILOVER_TO_GCP: { duration: 1000, next: 'GCP_STARTING', router: 'Failover initiated', notice: 'Selecting Google Cloud', message: 'Selecting healthy provider', application: 'Failover protection active', active: null, gcp: 'standby', azure: 'standby', awsFailed: true, step: 1, tone: 'warning' },
  GCP_STARTING: { duration: 1400, next: 'GCP_HEALTHY', router: 'Failover initiated', notice: 'Preparing the new deployment', message: 'Starting deployment on Google Cloud', application: 'Failover protection active', active: null, gcp: 'starting', azure: 'standby', awsFailed: true, step: 2, tone: 'warning' },
  GCP_HEALTHY: { duration: 700, next: 'REDIRECTING_TO_GCP', router: 'Health check passed', notice: 'Google Cloud is ready', message: 'New deployment is healthy', application: 'Failover protection active', active: null, gcp: 'healthy', azure: 'standby', awsFailed: true, step: 2, tone: 'warning' },
  REDIRECTING_TO_GCP: { duration: 900, next: 'RUNNING_GCP', router: 'Redirecting traffic', notice: 'Switching the application route', message: 'Redirecting traffic to Google Cloud', application: 'Connecting to Google Cloud', active: null, gcp: 'healthy', azure: 'standby', awsFailed: true, step: 3, tone: 'warning' },
  RUNNING_GCP: { duration: 2300, next: 'MONITORING_GCP', router: 'Failover complete', notice: 'Google Cloud is the new primary', message: 'Automatic failover completed', application: 'Running on Google Cloud', active: 'gcp', gcp: 'primary', azure: 'standby', awsFailed: true, step: 3, tone: 'success' },
  MONITORING_GCP: { duration: 700, next: 'GCP_FAILURE', router: 'Monitoring', notice: 'Google Cloud is the new primary', message: 'Application healthy · Running on Google Cloud', application: 'Running on Google Cloud', active: 'gcp', gcp: 'primary', azure: 'standby', awsFailed: true, step: 3, tone: 'success' },
  GCP_FAILURE: { duration: 650, next: 'DETECTING_GCP_FAILURE', router: 'Google Cloud health check failed', notice: 'Primary cloud unavailable', message: 'Google Cloud health check failed', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'standby', awsFailed: true, step: 0, tone: 'danger' },
  DETECTING_GCP_FAILURE: { duration: 650, next: 'FAILOVER_TO_AZURE', router: 'Primary unavailable', notice: 'Google Cloud outage confirmed', message: 'Second cloud outage detected', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'standby', awsFailed: true, step: 0, tone: 'danger' },
  FAILOVER_TO_AZURE: { duration: 900, next: 'AZURE_SELECTED', router: 'Failover initiated', notice: 'Checking providers...', message: 'Selecting healthy provider', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'standby', awsFailed: true, step: 1, tone: 'warning' },
  AZURE_SELECTED: { duration: 700, next: 'AZURE_STARTING', router: 'Azure selected', notice: 'Microsoft Azure is available', message: 'Azure selected', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'standby', awsFailed: true, step: 1, tone: 'warning' },
  AZURE_STARTING: { duration: 1400, next: 'AZURE_HEALTHY', router: 'Starting deployment', notice: 'Preparing Microsoft Azure', message: 'Starting deployment on Microsoft Azure', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'starting', awsFailed: true, step: 2, tone: 'warning' },
  AZURE_HEALTHY: { duration: 700, next: 'REDIRECTING_TO_AZURE', router: 'Health check passed', notice: 'Microsoft Azure is ready', message: 'Azure deployment is healthy', application: 'Failover protection active', active: null, gcp: 'outage', azure: 'healthy', awsFailed: true, step: 2, tone: 'warning' },
  REDIRECTING_TO_AZURE: { duration: 900, next: 'RUNNING_AZURE', router: 'Redirecting traffic', notice: 'Switching the application route', message: 'Redirecting traffic to Microsoft Azure', application: 'Connecting to Microsoft Azure', active: null, gcp: 'outage', azure: 'healthy', awsFailed: true, step: 3, tone: 'warning' },
  RUNNING_AZURE: { duration: 2000, next: 'MONITORING_AZURE', router: 'Failover complete', notice: 'Microsoft Azure is the new primary', message: 'Automatic failover completed', application: 'Running on Microsoft Azure', active: 'azure', gcp: 'outage', azure: 'primary', awsFailed: true, step: 3, tone: 'success' },
  MONITORING_AZURE: { duration: 2000, next: 'RESET', router: 'Monitoring', notice: 'Protected through two cloud outages', message: 'Application healthy · Running on Microsoft Azure', application: 'Running on Microsoft Azure', active: 'azure', gcp: 'outage', azure: 'primary', awsFailed: true, step: 3, tone: 'success' },
  RESET: { duration: 600, next: 'NORMAL_AWS', router: 'Demo restarting', notice: 'Replaying the failover scenario', message: 'Clouds can fail. Your application stays available.', application: 'Running on Microsoft Azure', active: 'azure', gcp: 'outage', azure: 'primary', awsFailed: true, step: 3, tone: 'normal' },
};

export const initialDemoState = { phase: 'NORMAL_AWS' as PhaseName, paused: false, replay: 0 };
export function demoReducer(state: typeof initialDemoState, action: { type: 'NEXT' | 'TOGGLE_PAUSE' | 'REPLAY' }): typeof initialDemoState {
  switch (action.type) {
    case 'NEXT': return { ...state, phase: phases[state.phase].next };
    case 'TOGGLE_PAUSE': return { ...state, paused: !state.paused };
    case 'REPLAY': return { ...initialDemoState, replay: state.replay + 1 };
  }
}

export function providerState(phase: PhaseName, provider: Provider): CloudState {
  if (provider === 'azure') return phases[phase].azure;
  if (provider === 'gcp') return phases[phase].gcp;
  return phases[phase].awsFailed ? 'outage' : 'primary';
}
