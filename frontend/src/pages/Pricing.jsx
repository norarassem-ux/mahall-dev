import { Link } from "react-router-dom";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "0",
    blurb: "Get your venue discovered. No commitment needed.",
    features: [
      ["Listing page on Mahal", true],
      ["Up to 6 photos", true],
      ["Standard search placement", true],
      ["Inquiry form enabled", true],
      ["Priority placement", false],
      ["Video + 3D tour", false],
      ["Analytics dashboard", false],
      ["AI-assisted reply drafting", false],
      ["Deposit collection", false],
    ],
    cta: "List for free",
  },
  {
    key: "featured",
    name: "Featured",
    price: "499",
    popular: true,
    blurb: "Priority placement and everything you need to convert inquiries.",
    features: [
      ["Everything in Free", true],
      ["Priority placement in search", true],
      ["Unlimited photos, video & 3D tour", true],
      ["Lead analytics dashboard", true],
      ["AI-assisted reply drafting", true],
      ["WhatsApp inquiry notifications", true],
      ["Availability calendar", true],
      ["Deposit collection (20% of event price)", true],
      ["Homepage rotation", false],
      ["Dedicated account manager", false],
    ],
    cta: "Get Featured",
  },
  {
    key: "premium",
    name: "Premium",
    price: "1,200",
    blurb: "Maximum visibility, homepage rotation, and hands-on support.",
    features: [
      ["Everything in Featured", true],
      ["Homepage featured rotation", true],
      ["Editorial picks eligibility", true],
      ["Dedicated account manager", true],
      ["Priority moderation (24h approval)", true],
      ["Custom analytics reports", true],
      ["Co-marketing opportunities", true],
      ["Deposit collection", true],
      ["Stripe Connect direct payouts", true],
    ],
    cta: "Get Premium",
  },
];

export default function Pricing() {
  return (
    <section className="page-section">
      <div className="eyebrow">Simple, transparent pricing</div>
      <h2>The right plan for every venue</h2>
      <p style={{ marginTop: 8, maxWidth: "60ch" }}>
        Start for free. Upgrade when you're ready to grow. No setup fees, no contracts.
      </p>

      <div className="plan-grid">
        {PLANS.map((plan) => (
          <div className={`plan-card ${plan.popular ? "popular" : ""}`} key={plan.key}>
            {plan.popular && <div className="plan-badge">✦ Most popular</div>}
            <div className="eyebrow">{plan.name.toUpperCase()}</div>
            <div className="plan-price">
              {plan.price} <span>MAD / month</span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", minHeight: 40 }}>{plan.blurb}</p>
            <ul className="plan-features">
              {plan.features.map(([label, included]) => (
                <li key={label} className={included ? "" : "muted"}>
                  <span>{included ? "✓" : "—"}</span> {label}
                </li>
              ))}
            </ul>
            <Link
              to="/list-your-venue"
              className={`btn ${plan.popular ? "btn-solid" : ""}`}
              style={{ width: "100%", marginTop: 12 }}
            >
              {plan.cta} ➤
            </Link>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 32, fontSize: 13, color: "var(--ink-faint)", maxWidth: "70ch" }}>
        Note: this page is informational for now — plan selection, deposit collection, WhatsApp
        notifications, and Stripe Connect payouts described above aren't wired up yet in this
        build. Every "get started" button currently goes to the (free) listing form.
      </p>
    </section>
  );
}
