const FAQS = [
  {
    q: "How do I book a venue?",
    a: "Browse venues, open a listing, and send an inquiry with your event details. The host replies directly by email.",
  },
  {
    q: "Is there a booking fee?",
    a: "Mahal doesn't charge planners a booking fee. Venues set their own pricing and deposit terms.",
  },
  {
    q: "How do I list my venue?",
    a: "Register as an owner from the Register page, then create your listing — full self-serve onboarding is coming in a future release.",
  },
  {
    q: "Which cities are covered?",
    a: "Marrakech, Casablanca, Fes, Rabat, Tangier, Essaouira, Agadir, Ouarzazate and the Ourika Valley, with more being added.",
  },
  {
    q: "Can I compare multiple venues at once?",
    a: "Side-by-side comparison is part of the Mahal v1 roadmap — for now, open venues in separate tabs.",
  },
];

export default function Faq() {
  return (
    <section className="page-section">
      <div className="eyebrow">Support</div>
      <h2>Frequently asked questions</h2>
      <div style={{ marginTop: 16 }}>
        {FAQS.map((item) => (
          <div className="faq-item" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
