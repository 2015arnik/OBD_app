export default function PageHeader({ actions, description, title }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">OBD workspace</p>
        <h2>{title}</h2>
        {description ? <p className="page-header-copy">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}
