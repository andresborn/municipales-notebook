import { ArrowIcon } from "./ArrowIcon";

type ElectionStat = {
  value: string;
  label: string;
};

type ElectionCardProps = {
  category: string;
  status: string;
  year: string;
  title: string;
  description: string;
  stats: ElectionStat[];
  href: string;
  cta: string;
  soon?: boolean;
};

export function ElectionCard({
  category,
  status,
  year,
  title,
  description,
  stats,
  href,
  cta,
  soon = false,
}: ElectionCardProps) {
  return (
    <a className={`ecard${soon ? " ecard--soon" : ""}`} href={href}>
      <div className="ecard-top">
        <span>{category}</span>
        <span className="status">{status}</span>
      </div>
      <p className="ecard-year">{year}</p>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="ecard-stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
      <span className="ecard-cta">
        {cta}
        <ArrowIcon />
      </span>
    </a>
  );
}
