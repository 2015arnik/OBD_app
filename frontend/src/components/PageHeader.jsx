export default function PageHeader({ actions, className = "", description, title }) {
  return (
    <div className={className ? `page-header ${className}` : "page-header"}>
      <div>
        <h2>{title}</h2>
        {description ? <p className="page-header-copy">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}
