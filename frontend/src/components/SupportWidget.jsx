import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// A free, rule-based FAQ bot — no external API, no cost, no API key.
// Matches the user's message against keyword sets and returns a canned
// answer. Kept in sync by hand with Faq.jsx / Pricing.jsx content.
const ENTRIES = [
  {
    keywords: ["book", "booking", "reserve", "inquiry", "inquire"],
    answer:
      "Browse venues, open a listing, and send an inquiry with your event details. The host replies directly by email — no booking fee from Mahal.",
  },
  {
    keywords: ["fee", "cost", "charge", "commission"],
    answer:
      "Mahal doesn't charge event planners a booking fee. Venues set their own pricing and deposit terms.",
  },
  {
    keywords: ["list my venue", "list a venue", "become an owner", "owner account", "listing a venue", "list venue"],
    answer:
      'Register an "owner" account, then use "List your venue" to publish — it goes live immediately in this build, no approval queue yet.',
  },
  {
    keywords: ["city", "cities", "where", "location", "cover"],
    answer:
      "Marrakech, Casablanca, Fes, Rabat, Tangier, Essaouira, Agadir, Ouarzazate, Merzouga, and El Jadida — with more being added.",
  },
  {
    keywords: ["compare", "comparison"],
    answer:
      "Side-by-side comparison isn't built yet — for now, open venues in separate tabs to compare them.",
  },
  {
    keywords: ["price", "pricing", "plan", "featured", "premium", "how much"],
    answer:
      "Free (0 MAD/month), Featured (499 MAD/month — priority placement, analytics, deposit collection), and Premium (1,200 MAD/month — homepage rotation, dedicated account manager). Full breakdown on the Pricing page.",
  },
  {
    keywords: ["dashboard", "lead", "leads"],
    answer:
      "Owner accounts get a dashboard showing your listings and any inquiries ('leads') for them — leads are scoped to whichever account owns the venue.",
  },
  {
    keywords: ["category", "categories", "type of venue"],
    answer:
      "Eight categories: Heritage & cultural, Hospitality & resort, Private & exclusive, Nature & adventure, Coastal & leisure, Urban & lifestyle, Corporate & MICE, and Entertainment & production.",
  },
  {
    keywords: ["what is mahal", "about mahal", "what is this"],
    answer:
      "Mahal is a marketplace connecting event planners, brands, and travellers with distinctive venues across Morocco.",
  },
  {
    keywords: ["human", "person", "contact", "email", "phone", "talk to someone"],
    answer: "Use the Contact page for anything I can't answer — a real message goes straight to the team.",
  },
];

const FALLBACK =
  "I don't have an answer for that yet. Try the FAQ page, or send a message on the Contact page.";

function findAnswer(message) {
  const text = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of ENTRIES) {
    const score = entry.keywords.filter((k) => text.includes(k)).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best ? best.answer : FALLBACK;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me about pricing, listing a venue, booking, or coverage." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const reply = findAnswer(text);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: reply }]);
    setInput("");
  }

  return (
    <div className="support-root">
      {open && (
        <div className="support-panel">
          <div className="support-header">
            <span>Mahal support</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="support-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`support-msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            <div className="support-msg assistant" style={{ fontSize: 11.5, opacity: 0.7 }}>
              Not finding it? See the <Link to="/faq">FAQ</Link> or{" "}
              <Link to="/contact">contact us</Link>.
            </div>
          </div>
          <form className="support-input" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
            />
            <button type="submit" className="btn btn-solid" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      <button className="support-fab" onClick={() => setOpen((v) => !v)} aria-label="Open support chat">
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
