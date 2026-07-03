import { giftStatusLabel } from "../lib/format";

export default function StatusBadge({ status }) {
  const className = `status-badge status-${String(status || "WANTED").toLowerCase()}`;

  return <span className={className}>{giftStatusLabel(status)}</span>;
}
