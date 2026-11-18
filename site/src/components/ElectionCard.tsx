import { ArrowIcon } from "./ArrowIcon";

type ElectionStat = {
  value: string;
  label: string;
};

type ElectionCta = {
  label: string;
  href: string;
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
  secondaryCta?: ElectionCta;
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
  secondaryCta,
  soon = false,
}: ElectionCardProps) {
  return (
    <article className={`ecard${soon ? " ecard--soon" : ""}`}>
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
      <div className="ecard-ctas">
        <a className="ecard-cta" href={href}>
          {cta}
          <ArrowIcon />
        </a>
        {secondaryCta ? (
          <a className="ecard-cta" href={secondaryCta.href}>
            {secondaryCta.label}
            <ArrowIcon />
          </a>
        ) : null}
      </div>
    </article>
  );
}
