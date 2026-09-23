import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { FiActivity, FiArrowLeft, FiCheckCircle, FiClock, FiCloud, FiGrid, FiPower, FiRefreshCw, FiShield } from 'react-icons/fi';
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

const brands = {
  AWS: { name: 'Amazon Web Services', icon: FaAws, color: '#ffb454' },
  GCP: { name: 'Google Cloud Platform', icon: FaGoogle, color: '#7baaff' },
  AZURE: { name: 'Microsoft Azure', icon: FaMicrosoft, color: '#62d5ed' },
};

function timestamp(value: string | number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

function errorMessage(error: unknown) {
  if (isAxiosError(error)) return error.response?.data?.Sendmessage || error.message;
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function AdminDashboard() {
  const { axiosInstance } = UseStateContext()!;
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; error: boolean }>>({});
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
      setMessages(previous => ({ ...previous, [provider.id]: { text: `${provider.provider_name} ${enabled ? 'started' : 'stopped'} successfully.`, error: false } }));
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
          const brand = brands[provider.provider_name.toUpperCase() as keyof typeof brands];
          const Icon = brand?.icon || FiCloud;
          const busy = pending[provider.id];
          const message = messages[provider.id];
          return <article key={provider.id} className={`admin-provider ${provider.is_enabled ? 'is-running' : 'is-stopped'}`}>
            <div className="admin-provider-top"><span className="admin-cloud-icon" style={{ color: brand?.color }}><Icon /></span><span className="admin-status"><i />{provider.is_enabled ? 'Running' : 'Stopped'}</span></div>
            <h3>{provider.provider_name}</h3><p className="admin-provider-name">{brand?.name || provider.provider_name}</p>
            <div className="admin-signal" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 0.06}s` }} />)}</div>
            <div className="admin-availability"><span><FiActivity />Provider availability</span><strong>{provider.is_enabled ? 'Enabled' : 'Disabled'}</strong></div>
            <dl><div><dt>Last updated</dt><dd><time dateTime={provider.updated_at}>{timestamp(provider.updated_at)}</time></dd></div><div><dt>Added</dt><dd><time dateTime={provider.created_at}>{timestamp(provider.created_at)}</time></dd></div></dl>
            <button className={`admin-toggle ${provider.is_enabled ? 'stop' : 'start'}`} disabled={busy || providers.isError} onClick={() => void toggleProvider(provider)} aria-label={`${provider.is_enabled ? 'Stop' : 'Start'} ${provider.provider_name}`} aria-busy={busy}>{busy ? <FiRefreshCw className="admin-spin" /> : <FiPower />}{busy ? 'Updating provider…' : `${provider.is_enabled ? 'Stop' : 'Start'} provider`}</button>
            {message?.text && <p className={`admin-feedback ${message.error ? 'has-error' : ''}`} role={message.error ? 'alert' : 'status'}>{!message.error && <FiCheckCircle />}{message.text}</p>}
          </article>;
        })}</div>
      </section>
      <footer className="admin-note"><FiShield /><p>Status reflects each provider’s enabled setting, not a live cloud health check. Times are shown in your local timezone.</p></footer>
    </main>
  </div>;
}
