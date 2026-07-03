export default function EmptyState({ action, description, title }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Пока пусто</p>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
