import { FiActivity, FiClock, FiCloud } from "react-icons/fi";
import { useCloudProviders } from "../../React-Query/GetCloudProviders";
import { cloudBrand } from "../deployment.utils";
import { formatTimestamp } from "../workspace.utils";
import "./CloudProviderStatus.css";

export default function CloudProviderStatus() {
  const providers = useCloudProviders();
  const items = providers.data || [];
  const live = items.filter(provider => provider.is_enabled).length;
  const known = providers.isSuccess;
  return <section className="cloud-heartbeat" aria-labelledby="cloud-heartbeat-title">
    <div className="cloud-heartbeat-heading">
      <div><h2 id="cloud-heartbeat-title"><FiActivity aria-hidden="true" />Cloud heartbeat</h2><p>Your cloud providers, at a glance.</p></div>
      <span className="cloud-heartbeat-summary" role="status">{known && items.length ? `${live} of ${items.length} providers live` : providers.isError ? "Status unavailable" : providers.isPending ? "Checking providers…" : "No providers"}</span>
    </div>
    {providers.isPending && <div className="cloud-heartbeat-loading" role="status">Loading cloud provider status…</div>}
    {providers.isError && <p className="cloud-heartbeat-error" role="alert">Could not refresh provider status. Retrying automatically; availability is currently unknown.</p>}
    {known && !items.length && <div className="cloud-heartbeat-empty"><FiCloud aria-hidden="true" /><p>No cloud providers configured yet.</p></div>}
    {!!items.length && <div className="cloud-heartbeat-grid">{items.map(provider => {
      const brand = cloudBrand(provider.provider_name);
      const state = !known ? "unknown" : provider.is_enabled ? "live" : "outage";
      return <article key={provider.id} className={`cloud-heartbeat-card is-${state}`} data-provider={provider.provider_name}>
        <div className="cloud-heartbeat-card-top"><span className={`cloud-heartbeat-logo brand-${brand.tone}`}><brand.icon aria-hidden="true" /></span><span className="cloud-heartbeat-badge"><i aria-hidden="true" />{state === "live" ? "Live" : state === "outage" ? "Outage" : "Unknown"}</span></div>
        <h3>{brand.name}</h3><p>{state === "live" ? "Enabled for deployment" : state === "outage" ? "Disabled for deployment" : "Waiting for updated status"}</p>
        <svg className="cloud-heartbeat-signal" viewBox="0 0 300 36" preserveAspectRatio="none" aria-hidden="true"><path className="cloud-heartbeat-baseline" d="M0 18 H300" /><path d={state === "live" ? "M0 18 H86 L96 11 L107 25 L120 4 L134 32 L145 18 H300" : "M0 18 H300"} /></svg>
        <div className="cloud-heartbeat-updated"><FiClock aria-hidden="true" /><span>Setting updated {formatTimestamp(provider.updated_at)}</span></div>
      </article>;
    })}</div>}
    <div className="cloud-heartbeat-footer"><span>Live = enabled · Outage = disabled. Based on provider settings.</span><span>{known && providers.dataUpdatedAt ? `Synced ${new Date(providers.dataUpdatedAt).toLocaleTimeString()}` : "Awaiting sync"} · Auto-refresh 15s</span></div>
  </section>;
}
