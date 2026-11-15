import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCloud,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiPower,
  FiRefreshCw,
  FiShield
} from 'react-icons/fi';
import { FaAws, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { UseStateContext } from '../context/AuthContext';
import './AdminDashboard.css';

interface Provider {
  id: string;
  provider_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CloudLbPreset {
  name: string;
  provider: 'AWS' | 'GCP' | 'AZURE';
  target: string;
  badge: string;
  color: string;
  isDummy: boolean;
}

const brands = {
  AWS: { name: 'Amazon Web Services', icon: FaAws, color: '#ffb454' },
  GCP: { name: 'Google Cloud Platform', icon: FaGoogle, color: '#7baaff' },
  AZURE: { name: 'Microsoft Azure', icon: FaMicrosoft, color: '#62d5ed' },
};

export const CLOUD_LB_PRESETS: Record<string, CloudLbPreset> = {
  AWS: {
    name: 'Amazon Web Services (AWS ALB)',
    provider: 'AWS',
    target: 'deployforge-alb-445677273.ap-south-1.elb.amazonaws.com',
    badge: 'Production CNAME',
    color: '#ffb454',
    isDummy: false,
  },
  GCP: {
    name: 'Google Cloud Platform (GCP Static IP)',
    provider: 'GCP',
    target: '8.233.220.52',
    badge: 'Global Static IP (A Record)',
    color: '#7baaff',
    isDummy: false,
  },
  AZURE: {
    name: 'Microsoft Azure (App Gateway)',
    provider: 'AZURE',
    target: 'azure-appgateway-dummy.deployforge.online',
    badge: 'Dummy URI (Ready to update)',
    color: '#62d5ed',
    isDummy: true,
  },
};

function timestamp(value: string | number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

function errorMessage(error: unknown) {
  if (isAxiosError(error)) return error.response?.data?.message || error.response?.data?.Sendmessage || error.message;
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function AdminDashboard() {
  const { axiosInstance } = UseStateContext()!;
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; error: boolean }>>({});

  // DNS & Failover State
  const [selectedHostname, setSelectedHostname] = useState<string>('*.deployforge.online');
  const [customTarget, setCustomTarget] = useState<string>(CLOUD_LB_PRESETS.AWS.target);
  const [selectedCloud, setSelectedCloud] = useState<string>('AWS');
  const [isDnsUpdating, setIsDnsUpdating] = useState<boolean>(false);
  const [dnsSwitchingProvider, setDnsSwitchingProvider] = useState<string | null>(null);
  const [autoSwitchOnStop, setAutoSwitchOnStop] = useState<boolean>(true);
  const [dnsFeedback, setDnsFeedback] = useState<{ text: string; error: boolean } | null>(null);

  // The shared client normally includes /api in its base URL.
  const base = (axiosInstance.defaults.baseURL || '').replace(/\/+$/, '');
  const adminPath = `${base.endsWith('/api') ? '' : '/api'}/admin`;

  const providers = useQuery<Provider[]>({
    queryKey: ['admin-cloud-providers'],
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get(`${adminPath}/get_all_provider`, { signal, timeout: 15000 });
      if (!data.Status || !Array.isArray(data.responseData)) throw new Error(data.Sendmessage || 'Could not load cloud providers.');
      if (!data.responseData.every((item: Provider) => item && item.id != null && typeof item.provider_name === 'string' && typeof item.is_enabled === 'boolean')) {
        throw new Error('The server returned an invalid provider status.');
      }
      return data.responseData;
    },
    refetchInterval: 15000,
    retry: 1,
  });

  // Query live DNS record for selected hostname
  const liveDns = useQuery({
    queryKey: ['admin-cloudflare-dns', selectedHostname],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await axiosInstance.get(`${adminPath}/get_dns_record`, {
          signal,
          params: { hostname: selectedHostname },
          timeout: 15000,
        });
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          const clean = selectedHostname.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
          const match = data.data.find((r: any) => r.name === clean && (r.type === 'CNAME' || r.type === 'A')) ||
            data.data.find((r: any) => r.type === 'CNAME' || r.type === 'A') || data.data[0];
          return match;
        }
        return null;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Switch Cloudflare DNS to target ALB/LB URI
  async function changeDnsRecord(targetOverride?: string, cloudName?: string) {
    const targetToUse = (targetOverride || customTarget).trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const hostnameToUse = selectedHostname.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const isIpv4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(targetToUse);
    const providerToUse = (cloudName || selectedCloud || (isIpv4 ? 'GCP' : 'AWS')).toUpperCase();

    if (!hostnameToUse || !targetToUse) {
      setDnsFeedback({ text: 'Hostname and target load balancer URI/IP are required.', error: true });
      return;
    }

    setIsDnsUpdating(true);
    if (cloudName) setDnsSwitchingProvider(cloudName);
    setDnsFeedback(null);

    try {
      const { data } = await axiosInstance.post(
        `${adminPath}/Change-DNS-Record-To-Other-ALB`,
        {
          hostname: hostnameToUse,
          target: targetToUse,
          cloud_provider: providerToUse,
        },
        { timeout: 20000 }
      );

      if (!data.success) {
        throw new Error(data.message || 'Cloudflare DNS update failed.');
      }

      if (cloudName) {
        setSelectedCloud(cloudName);
      }
      setCustomTarget(targetToUse);
      const recType = data.data?.recordType || (isIpv4 ? 'A' : 'CNAME');
      setDnsFeedback({
        text: `${providerToUse} DNS updated successfully! [${recType}] ${hostnameToUse} → ${targetToUse}`,
        error: false,
      });
      void liveDns.refetch();
    } catch (error) {
      setDnsFeedback({ text: errorMessage(error), error: true });
    } finally {
      setIsDnsUpdating(false);
      setDnsSwitchingProvider(null);
    }
  }

  async function toggleProvider(provider: Provider) {
    if (pending[provider.id]) return;
    const enabled = !provider.is_enabled;
    setPending(previous => ({ ...previous, [provider.id]: true }));
    setMessages(previous => ({ ...previous, [provider.id]: { text: '', error: false } }));
    try {
      const { data } = await axiosInstance.post(`${adminPath}/is_stop_start_Provider`, { id: provider.id, isenable: enabled }, { timeout: 15000 });
      if (!data.Status) throw new Error(data.Sendmessage || 'The provider could not be updated.');
      const refreshed = await providers.refetch({ cancelRefetch: true });
      if (refreshed.error) throw new Error('Update sent, but the latest status could not be verified. Refresh before trying again.');
      const updated = refreshed.data?.find(item => item.id === provider.id);
      if (updated?.is_enabled !== enabled) throw new Error('The server has not confirmed this change. The last reported status is shown.');

      let autoDnsNote = '';
      // When stopping a provider, if auto-switch is enabled, route to another running cloud (or next preset)
      if (!enabled && autoSwitchOnStop) {
        const otherRunning = refreshed.data?.find(p => p.id !== provider.id && p.is_enabled);
        const nextCloudName = otherRunning?.provider_name.toUpperCase() || (provider.provider_name.toUpperCase() === 'AWS' ? 'GCP' : 'AWS');
        const nextPreset = CLOUD_LB_PRESETS[nextCloudName];
        if (nextPreset) {
          try {
            await changeDnsRecord(nextPreset.target, nextCloudName);
            autoDnsNote = ` • Auto-switched DNS to ${nextCloudName} load balancer (${nextPreset.target})`;
          } catch {
            autoDnsNote = ` • Note: Automatic DNS reroute to ${nextCloudName} could not complete.`;
          }
        }
      }

      setMessages(previous => ({
        ...previous,
        [provider.id]: {
          text: `${provider.provider_name} ${enabled ? 'started' : 'stopped'} successfully.${autoDnsNote}`,
          error: false
        }
      }));
    } catch (error) {
      setMessages(previous => ({ ...previous, [provider.id]: { text: errorMessage(error), error: true } }));
      void providers.refetch();
    } finally {
      setPending(previous => ({ ...previous, [provider.id]: false }));
    }
  }

  const running = providers.data?.filter(provider => provider.is_enabled).length ?? 0;
  const stopped = (providers.data?.length ?? 0) - running;
  const known = providers.data !== undefined;

  // Determine which cloud current live DNS matches
  const currentDnsContent = liveDns.data?.content || customTarget;
  const matchedCloud = Object.values(CLOUD_LB_PRESETS).find(p => p.target.toLowerCase() === (currentDnsContent || '').toLowerCase());

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link to="/" className="admin-brand"><FiCloud /><span>Deploy<span>Forge</span></span></Link>
      <div className="admin-console-label">ADMIN CONSOLE</div>
      <nav aria-label="Admin navigation"><Link to="/admin/dashbord" aria-current="page"><FiGrid />Cloud overview</Link></nav>
      <div className="admin-sidebar-foot"><FiShield /><div><strong>Provider controls</strong><small>Cloud administration</small></div></div>
      <Link className="admin-back" to="/dashboard"><FiArrowLeft />Back to workspace</Link>
    </aside>

    <main className="admin-main">
      <div className="admin-topbar"><span><FiShield /> Administration <span>/</span> Cloud providers</span><span className="admin-sync"><i />Auto-refresh · 15s</span></div>
      <header className="admin-heading"><div><p className="admin-eyebrow">INFRASTRUCTURE OVERVIEW</p><h1>Your clouds. One control center.</h1><p>Monitor provider availability and manage which clouds are enabled.</p></div><button className="admin-refresh" onClick={() => void providers.refetch()} disabled={providers.isFetching}><FiRefreshCw className={providers.isFetching ? 'admin-spin' : ''} />{providers.isFetching ? 'Refreshing…' : 'Refresh status'}</button></header>

      <section className="admin-stats" aria-label="Provider summary">
        <article><span><FiCloud />Total providers</span><strong>{known ? providers.data.length.toString().padStart(2, '0') : '—'}</strong><small>Connected cloud platforms</small></article>
        <article className="admin-stat-running"><span><FiActivity />Running</span><strong>{known ? running.toString().padStart(2, '0') : '—'}</strong><small>Enabled for use</small></article>
        <article className="admin-stat-stopped"><span><FiPower />Stopped</span><strong>{known ? stopped.toString().padStart(2, '0') : '—'}</strong><small>Currently disabled</small></article>
      </section>

      <section aria-labelledby="admin-providers-title">
        <div className="admin-section-heading"><div><h2 id="admin-providers-title">Cloud providers</h2><p>Individual controls for your cloud infrastructure.</p></div><span><FiClock />{providers.dataUpdatedAt ? `Last synced ${timestamp(providers.dataUpdatedAt)}` : 'Awaiting first sync'}</span></div>
        {providers.isError && <div className="admin-error" role="alert">{known ? 'Status may be outdated. ' : ''}{errorMessage(providers.error)} <button onClick={() => void providers.refetch()} disabled={providers.isFetching}>Try again</button></div>}
        {providers.isPending && <div className="admin-provider-grid" role="status" aria-label="Loading cloud providers">{[1, 2, 3].map(id => <div className="admin-skeleton" key={id}><div /><div /><div /></div>)}</div>}
        {known && providers.data.length === 0 && <div className="admin-empty"><FiCloud /><h3>No cloud providers yet</h3><p>Providers will appear here when they are available from the server.</p></div>}
        <div className="admin-provider-grid">{providers.data?.map(provider => {
          const brandKey = provider.provider_name.toUpperCase();
          const brand = brands[brandKey as keyof typeof brands];
          const preset = CLOUD_LB_PRESETS[brandKey];
          const Icon = brand?.icon || FiCloud;
          const busy = pending[provider.id];
          const message = messages[provider.id];
          const isRoutingThis = dnsSwitchingProvider === brandKey;
          const isCurrentActiveDns = matchedCloud?.provider === brandKey;

          return <article key={provider.id} className={`admin-provider ${provider.is_enabled ? 'is-running' : 'is-stopped'}`}>
            <div className="admin-provider-top">
              <span className="admin-cloud-icon" style={{ color: brand?.color }}><Icon /></span>
              <span className="admin-status"><i />{provider.is_enabled ? 'Running' : 'Stopped'}</span>
            </div>
            <h3>{provider.provider_name}</h3>
            <p className="admin-provider-name">{brand?.name || provider.provider_name}</p>
            <div className="admin-signal" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 0.06}s` }} />)}</div>
            <div className="admin-availability">
              <span><FiActivity />Provider availability</span>
              <strong>{provider.is_enabled ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <dl>
              <div><dt>Last updated</dt><dd><time dateTime={provider.updated_at}>{timestamp(provider.updated_at)}</time></dd></div>
              <div><dt>Added</dt><dd><time dateTime={provider.created_at}>{timestamp(provider.created_at)}</time></dd></div>
            </dl>

            <button
              className={`admin-toggle ${provider.is_enabled ? 'stop' : 'start'}`}
              disabled={busy || providers.isError}
              onClick={() => void toggleProvider(provider)}
              aria-label={`${provider.is_enabled ? 'Stop' : 'Start'} ${provider.provider_name}`}
              aria-busy={busy}
            >
              {busy ? <FiRefreshCw className="admin-spin" /> : <FiPower />}
              {busy ? 'Updating provider…' : `${provider.is_enabled ? 'Stop' : 'Start'} provider`}
            </button>

            {preset && (
              <button
                type="button"
                className="admin-card-dns-btn"
                disabled={isDnsUpdating}
                onClick={() => void changeDnsRecord(preset.target, brandKey)}
                title={`Switch Cloudflare DNS to ${preset.name}`}
              >
                {isRoutingThis ? <FiRefreshCw className="admin-spin" /> : <FiGlobe />}
                {isCurrentActiveDns ? `Active DNS Route (${brandKey})` : `Route DNS to ${brandKey}`}
              </button>
            )}

            {message?.text && (
              <p className={`admin-feedback ${message.error ? 'has-error' : ''}`} role={message.error ? 'alert' : 'status'}>
                {!message.error && <FiCheckCircle />}
                {message.text}
              </p>
            )}
          </article>;
        })}</div>
      </section>

      {/* MULTI-CLOUD DNS FAILOVER & ALB ROUTING SECTION */}
      <section className="admin-dns-section" aria-labelledby="admin-dns-title">
        <div className="admin-dns-header">
          <div className="admin-dns-header-left">
            <span className="admin-dns-icon"><FiGlobe /></span>
            <div>
              <h2 id="admin-dns-title">Multi-Cloud DNS Failover & ALB Routing</h2>
              <p>Reroute global Cloudflare DNS traffic across cloud load balancers (AWS ALB, GCP, Azure).</p>
            </div>
          </div>
          <div className="admin-dns-header-right">
            <span className="admin-dns-status-pill">
              <i /> Cloudflare DNS Active
            </span>
            <button
              className="admin-refresh"
              onClick={() => void liveDns.refetch()}
              disabled={liveDns.isFetching}
              title="Refresh Cloudflare DNS status"
            >
              <FiRefreshCw className={liveDns.isFetching ? 'admin-spin' : ''} />
              {liveDns.isFetching ? 'Checking…' : 'Sync DNS'}
            </button>
          </div>
        </div>

        {/* Live Active Target Card */}
        <div className="admin-dns-live-card">
          <div className="admin-dns-live-left">
            <span className="admin-dns-live-label">Current Active Route</span>
            <span className="admin-dns-live-target">
              {liveDns.data?.type ? `[${liveDns.data.type}] ` : ''}
              {liveDns.data?.name || selectedHostname} → {liveDns.data?.content || customTarget}
            </span>
          </div>
          <div className="admin-dns-live-badge">
            {matchedCloud ? `${matchedCloud.provider} Load Balancer` : 'Custom Cloud Target'}
          </div>
        </div>

        {/* Cloud Load Balancer Presets Grid */}
        <div className="admin-dns-presets">
          {Object.entries(CLOUD_LB_PRESETS).map(([key, preset]) => {
            const Icon = brands[preset.provider]?.icon || FiLayers;
            const isSelected = selectedCloud === key;
            const isLive = matchedCloud?.provider === key;

            return (
              <div key={key} className={`admin-dns-preset-card ${isSelected || isLive ? 'is-active' : ''}`}>
                <div>
                  <div className="admin-dns-preset-top">
                    <span className="admin-dns-preset-icon" style={{ color: preset.color }}>
                      <Icon />
                    </span>
                    <span
                      className="admin-dns-preset-tag"
                      style={{
                        background: preset.isDummy ? '#2c2219' : '#173029',
                        color: preset.isDummy ? '#f5b189' : '#7ae2b7',
                        border: `1px solid ${preset.isDummy ? '#593a29' : '#2b5240'}`,
                      }}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <h4>{preset.name}</h4>
                  <div className="admin-dns-preset-uri" title={preset.target}>
                    {preset.target}
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-dns-route-btn"
                  disabled={isDnsUpdating}
                  onClick={() => {
                    setSelectedCloud(key);
                    setCustomTarget(preset.target);
                    void changeDnsRecord(preset.target, key);
                  }}
                >
                  {isDnsUpdating && dnsSwitchingProvider === key ? (
                    <FiRefreshCw className="admin-spin" />
                  ) : isLive ? (
                    <FiCheck />
                  ) : (
                    <FiArrowRight />
                  )}
                  {isLive ? `Currently Serving Traffic` : `Route Traffic to ${key}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Manual DNS Input & Auto-Failover Toggle */}
        <div className="admin-dns-form">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void changeDnsRecord();
            }}
          >
            <div className="admin-dns-form-grid">
              <div className="admin-dns-input-group">
                <label htmlFor="admin-dns-hostname">Hostname / CNAME Record</label>
                <input
                  id="admin-dns-hostname"
                  type="text"
                  value={selectedHostname}
                  onChange={(e) => setSelectedHostname(e.target.value)}
                  placeholder="*.deployforge.online"
                  required
                />
              </div>

              <div className="admin-dns-input-group">
                <label htmlFor="admin-dns-target">Target Load Balancer URI</label>
                <input
                  id="admin-dns-target"
                  type="text"
                  value={customTarget}
                  onChange={(e) => {
                    setCustomTarget(e.target.value);
                    setSelectedCloud('');
                  }}
                  placeholder="e.g. your-alb.elb.amazonaws.com or gcp-lb.deployforge.online"
                  required
                />
              </div>

              <button
                type="submit"
                className="admin-dns-submit-btn"
                disabled={isDnsUpdating}
              >
                {isDnsUpdating ? <FiRefreshCw className="admin-spin" /> : <FiGlobe />}
                {isDnsUpdating ? 'Updating Cloudflare...' : 'Switch DNS Record'}
              </button>
            </div>

            <label className="admin-dns-auto-toggle">
              <input
                type="checkbox"
                checked={autoSwitchOnStop}
                onChange={(e) => setAutoSwitchOnStop(e.target.checked)}
              />
              <span>Automatically reroute DNS to the next healthy cloud when stopping a provider</span>
            </label>
          </form>

          {dnsFeedback && (
            <div className={`admin-dns-feedback ${dnsFeedback.error ? 'is-error' : 'is-success'}`} role="status">
              {dnsFeedback.error ? <FiAlertCircle /> : <FiCheckCircle />}
              <span>{dnsFeedback.text}</span>
            </div>
          )}
        </div>
      </section>

      <footer className="admin-note"><FiShield /><p>Status reflects each provider’s enabled setting, not a live cloud health check. Times are shown in your local timezone.</p></footer>
    </main>
  </div>;
}
