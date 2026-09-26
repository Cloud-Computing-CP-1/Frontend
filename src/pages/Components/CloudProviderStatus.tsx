import { FiActivity, FiCloud } from "react-icons/fi";
import { useCloudProviders } from "../../React-Query/GetCloudProviders";
import { cloudBrand } from "../deployment.utils";
import { formatTimestamp } from "../workspace.utils";
import "./CloudProviderStatus.css";

export default function CloudProviderStatus() {
  const providers = useCloudProviders();
  const items = providers.data || [];
  const live = items.filter(provider => provider.is_enabled).length;
  const known = providers.isSuccess;
  return <section className="cloud-heartbeat" aria-labelledby="cloud-heartbeat-title" aria-describedby="cloud-heartbeat-note">
    <div className="cloud-heartbeat-heading">
      <h2 id="cloud-heartbeat-title"><FiActivity aria-hidden="true" />Cloud heartbeat</h2>
      <span className="cloud-heartbeat-summary" role="status">{known && items.length ? `${live} of ${items.length} live` : providers.isError ? "Status unavailable" : providers.isPending ? "Checking…" : "No providers"}<span> · 15s refresh</span></span>
    </div>
    {providers.isPending && <div className="cloud-heartbeat-loading" role="status">Loading cloud provider status…</div>}
    {providers.isError && <p className="cloud-heartbeat-error" role="alert">Could not refresh provider status. Retrying automatically; availability is currently unknown.</p>}
    {known && !items.length && <div className="cloud-heartbeat-empty"><FiCloud aria-hidden="true" /><p>No cloud providers configured yet.</p></div>}
    {!!items.length && <div className="cloud-heartbeat-grid">{items.map(provider => {
      const brand = cloudBrand(provider.provider_name);
      const state = !known ? "unknown" : provider.is_enabled ? "live" : "outage";
      return <article key={provider.id} className={`cloud-heartbeat-card is-${state}`} data-provider={provider.provider_name} title={`${brand.name} · ${state === "live" ? "Enabled" : state === "outage" ? "Disabled" : "Unknown"} · Setting updated ${formatTimestamp(provider.updated_at)}`}>
        <span className={`cloud-heartbeat-logo brand-${brand.tone}`}><brand.icon aria-hidden="true" /></span>
        <h3>{provider.provider_name.toUpperCase()}</h3>
        <span className="cloud-heartbeat-badge"><i aria-hidden="true" />{state === "live" ? "Live" : state === "outage" ? "Outage" : "Unknown"}</span>
      </article>;
    })}</div>}
    <p id="cloud-heartbeat-note" className="sr-only">Live = enabled. Outage = disabled. Based on provider settings. Status refreshes every 15 seconds.</p>
  </section>;
}
