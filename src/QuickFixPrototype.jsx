import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  Search,
  Send,
  Paperclip,
  Image as ImgIcon,
  Star,
  CalendarDays,
  MessageSquare,
  HomeIcon,
  Briefcase,
  CreditCard,
  PlusCircle,
  Settings,
  User,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

/*
  QuickFix – Fiverr-style UI Prototype (with basic functionality)
  ---------------------------------------------------------------
  • Shared search between Home & Search
  • Book buttons → Checkout with selected gig
  • Post Job wizard saves jobs → Provider Upcoming Jobs
  • Messages view with live sending
  • Checkout uses booking data and confirms into Messages
*/

// ---------- UI PRIMITIVES ----------
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm hover:shadow transition active:scale-[.99] bg-black text-white ${className}`}
    {...props}
  >
    {children}
  </button>
);

const GhostButton = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 border border-neutral-300 hover:bg-neutral-50 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 ${className}`}
    {...props}
  />
);

const TextArea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 min-h-[120px] ${className}`}
    {...props}
  />
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const Tag = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm ${className}`}
  >
    {children}
  </span>
);

const Rating = ({ value = 4.9, count = 120 }) => (
  <div className="flex items-center gap-1 text-sm text-neutral-600">
    <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
    <span className="font-semibold">{value.toFixed(1)}</span>
    <span className="text-neutral-400">({count})</span>
  </div>
);

// ---------- MOCK DATA ----------
const categories = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Handyman",
  "Appliance Repair",
  "Painting",
];

const gigs = new Array(6).fill(0).map((_, i) => ({
  id: i + 1,
  title: [
    "Fix leaking faucet",
    "Install ceiling fan",
    "AC tune-up",
    "General handyman",
    "Washer repair",
    "Interior painting",
  ][i],
  price: [80, 120, 140, 70, 110, 300][i],
  rating: [4.9, 4.8, 5.0, 4.7, 4.9, 4.6][i],
  reviews: [120, 95, 34, 210, 64, 48][i],
  img: `https://picsum.photos/seed/gig${i}/640/360`,
  provider: ["Alex P.", "Sam E.", "Casey R.", "Jordan K.", "Taylor M.", "Riley S."][i],
}));

// ---------- LAYOUT ----------
function TopNav({ view, setView }) {
  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold">QuickFix</span>
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-2 md:flex">
          <GhostButton
            onClick={() => setView("home")}
            className={view === "home" ? "bg-neutral-100" : ""}
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>
          <GhostButton
            onClick={() => setView("search")}
            className={view === "search" ? "bg-neutral-100" : ""}
          >
            <Search className="h-4 w-4" /> Search
          </GhostButton>
          <GhostButton
            onClick={() => setView("postJob")}
            className={view === "postJob" ? "bg-neutral-100" : ""}
          >
            <PlusCircle className="h-4 w-4" /> Post Job
          </GhostButton>
          <GhostButton
            onClick={() => setView("messages")}
            className={view === "messages" ? "bg-neutral-100" : ""}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </GhostButton>
          <GhostButton
            onClick={() => setView("checkout")}
            className={view === "checkout" ? "bg-neutral-100" : ""}
          >
            <CreditCard className="h-4 w-4" /> Checkout
          </GhostButton>
          <GhostButton
            onClick={() => setView("provider")}
            className={view === "provider" ? "bg-neutral-100" : ""}
          >
            <Briefcase className="h-4 w-4" /> Provider
          </GhostButton>
          <GhostButton
            onClick={() => setView("admin")}
            className={view === "admin" ? "bg-neutral-100" : ""}
          >
            <Settings className="h-4 w-4" /> Admin
          </GhostButton>
          <div className="ml-2 h-8 w-px bg-neutral-200" />
          <GhostButton>
            <User className="h-4 w-4" /> Profile
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

// ---------- VIEWS (CUSTOMER) ----------
function Home({ searchTerm, setSearchTerm, onSearchClick, onViewGig }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Card className="bg-gradient-to-br from-neutral-50 to-white p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Book trusted pros, on your schedule</h1>
            <p className="text-neutral-600">
              Real-time bookings • Verified providers • Secure payments
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="What do you need? e.g., install faucet"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={onSearchClick}>
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
          </div>
          <img
            src="https://picsum.photos/seed/hero/640/360"
            alt="hero"
            className="h-40 w-full rounded-2xl object-cover md:w-80"
          />
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Popular categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Featured gigs</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {gigs.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <img src={g.img} alt="gig" className="h-40 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{g.title}</h3>
                    <div className="text-sm text-neutral-500">by {g.provider}</div>
                  </div>
                  <Rating value={g.rating} count={g.reviews} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    From <span className="font-semibold">${g.price}</span>
                  </div>
                  <GhostButton onClick={() => onViewGig(g)}>
                    View / Book <ChevronRight className="h-4 w-4" />
                  </GhostButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchView({ searchTerm, setSearchTerm, onBookGig }) {
  const filteredGigs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return gigs;
    return gigs.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.provider.toLowerCase().includes(q) ||
        categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [searchTerm]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search services (e.g., ceiling fan install)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button>
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Filters</h3>
          <Input placeholder="Location" />
          <Input placeholder="Budget max ($)" />
          <Input placeholder="Date" />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
          <GhostButton className="w-full">Apply</GhostButton>
        </Card>
        <div className="grid gap-4">
          {filteredGigs.length === 0 && (
            <Card className="p-4 text-sm text-neutral-500">
              No results found. Try a different search term.
            </Card>
          )}
          {filteredGigs.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                <img src={g.img} alt="gig" className="h-full w-full object-cover" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">{g.title}</h3>
                      <div className="text-sm text-neutral-500">by {g.provider}</div>
                    </div>
                    <Rating value={g.rating} count={g.reviews} />
                  </div>
                  <p className="line-clamp-2 text-sm text-neutral-600">
                    I will professionally handle your request with quality tools and guaranteed
                    results. Same-day available.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      From <span className="font-semibold">${g.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <GhostButton>Message</GhostButton>
                      <Button onClick={() => onBookGig(g)}>Book</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostJobWizard({ onJobPosted = () => {} }) {
  const [step, setStep] = useState(1);

  // form state
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budgetType, setBudgetType] = useState("Fixed");
  const [budgetAmount, setBudgetAmount] = useState("");

  const handlePost = () => {
    const job = {
      id: Date.now(),
      title: description || `${category} job`,
      category,
      address: address || "123 Main St, Toronto",
      date: date || "Tomorrow",
      time: time || "5:00 PM",
      budgetType,
      budgetAmount: Number(budgetAmount) || 0,
    };
    onJobPosted(job);
    // simple reset
    setStep(1);
    setDescription("");
    setAddress("");
    setDate("");
    setTime("");
    setBudgetType("Fixed");
    setBudgetAmount("");
    alert("Job posted! It will appear in your Provider dashboard.");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Post a Job</h1>
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-sm">
          {["Details", "Schedule", "Photos", "Budget", "Review"].map((s, i) => (
            <React.Fragment key={s}>
              <Tag className={step === i + 1 ? "bg-black text-white" : ""}>
                {i + 1}. {s}
              </Tag>
              {i < 4 && <div className="h-px w-6 bg-neutral-200" />}
            </React.Fragment>
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-3">
            <select
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <TextArea
              placeholder="Describe the problem…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm text-neutral-600">Preferred date</label>
              <Input
                placeholder="YYYY-MM-DD"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-600">Preferred time</label>
              <Input
                placeholder="HH:MM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <GhostButton>
              <ImgIcon className="h-4 w-4" /> Upload photos
            </GhostButton>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-neutral-100" />
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              value={budgetType}
              onChange={(e) => setBudgetType(e.target.value)}
            >
              <option>Fixed</option>
              <option>Hourly</option>
            </select>
            <Input
              placeholder="Budget amount ($)"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
          </div>
        )}
        {step === 5 && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {address || "123 Main St, Toronto"}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />{" "}
              {date || "Tomorrow"}, {time || "5:00 PM"}
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <div className="font-semibold mb-1">{category} job</div>
              {description || "No description provided yet."}
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <div>
                Budget:{" "}
                <span className="font-semibold">
                  {budgetType} {budgetAmount ? `$${budgetAmount}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <GhostButton onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Back
          </GhostButton>
          {step < 5 ? (
            <Button onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePost}>Post Job</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Messages({ messages, onSendMessage }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Inbox</h3>
          {gigs.slice(0, 4).map((g) => (
            <Card key={g.id} className="cursor-pointer p-3 hover:bg-neutral-50">
              <div className="font-medium">{g.provider}</div>
              <div className="text-xs text-neutral-500">{g.title}</div>
            </Card>
          ))}
        </Card>
        <Card className="grid grid-rows-[auto_1fr_auto]">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4">
            <div>
              <div className="font-semibold">
                Alex P. <span className="ml-2 text-xs text-green-600">● online</span>
              </div>
              <div className="text-xs text-neutral-500">Job: Install faucet • #12345</div>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`w-fit max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "me"
                    ? "ml-auto bg-black text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.text}
              </div>
            ))}
            {/* Static example offer card */}
            <Card className="w-fit max-w-[80%] p-3">
              <div className="text-sm font-semibold">Offer • $120 • 2h • Tomorrow 5pm</div>
              <div className="text-xs text-neutral-500">Includes parts and cleanup</div>
              <div className="mt-2 flex gap-2">
                <Button>Accept</Button>
                <GhostButton>Counter</GhostButton>
              </div>
            </Card>
          </div>
          <div className="flex items-center gap-2 border-t border-neutral-200 p-3">
            <GhostButton>
              <Paperclip className="h-4 w-4" />
            </GhostButton>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button disabled={!text.trim()} onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Checkout({ booking, onConfirm }) {
  const gig = booking?.gig || gigs[0];
  const address = booking?.address || "123 Main St, Toronto";
  const dateTime = booking?.dateTime || "Tomorrow 5pm";
  const price = booking?.price ?? gig.price;
  const serviceFee = Math.round(price * 0.06 * 100) / 100; // ~6%
  const total = (price + serviceFee).toFixed(2);

  const handleConfirm = () => {
    onConfirm?.();
    alert("Booking confirmed! Your provider will be notified.");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Confirm Booking</h1>
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="font-semibold">Job summary</div>
            <div className="text-sm text-neutral-600">
              {gig.title} • {dateTime} • {address}
            </div>
            <div className="rounded-xl bg-neutral-50 p-3 text-sm">
              Provider: {gig.provider} • ★{gig.rating.toFixed(1)} ({gig.reviews})
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Payment</div>
            <Input placeholder="Card number" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVC" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>${price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-500">
            <span>Service fee</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          <div className="mt-2 h-px bg-neutral-200" />
          <div className="mt-2 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
        <Button className="w-full" onClick={handleConfirm}>
          Place Order • Hold Payment
        </Button>
      </Card>
    </div>
  );
}

// ---------- VIEWS (PROVIDER) ----------
function ProviderDashboard({ jobs }) {
  const bookings = jobs.length;
  const earnings = jobs.reduce((sum, j) => sum + (j.budgetAmount || 0), 0);

  const metrics = [
    { label: "Impressions", value: 3200 },
    { label: "Clicks", value: 640 },
    { label: "Bookings", value: bookings },
    { label: "Earnings", value: `$${earnings.toFixed(2)}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Provider Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-sm text-neutral-500">{m.label}</div>
            <div className="mt-1 text-2xl font-bold">{m.value}</div>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">My Gigs</div>
            <GhostButton>
              <PlusCircle className="h-4 w-4" /> New Gig
            </GhostButton>
          </div>
          <div className="grid gap-3">
            {gigs.slice(0, 3).map((g) => (
              <Card
                key={g.id}
                className="grid grid-cols-[80px_1fr_auto] items-center gap-3 p-3"
              >
                <img
                  src={g.img}
                  className="h-16 w-20 rounded-lg object-cover"
                  alt={g.title}
                />
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-neutral-500">
                    Live • From ${g.price}
                  </div>
                </div>
                <GhostButton>Edit</GhostButton>
              </Card>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 font-semibold">Upcoming Jobs</div>
          <div className="space-y-2 text-sm">
            {jobs.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 p-3 text-neutral-500">
                No upcoming jobs yet. Post a job or accept a booking to see it here.
              </div>
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 p-3"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {job.date}, {job.time}
                </div>
                <div className="text-neutral-500">
                  {job.title} • {job.address}
                </div>
                <GhostButton>Details</GhostButton>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProviderCreateGig() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Create a Gig</h1>
      <Card className="space-y-4 p-6">
        <Input placeholder="Gig title (e.g., Install kitchen faucet)" />
        <div className="grid gap-3 md:grid-cols-2">
          <select className="w-full rounded-xl border border-neutral-300 px-3 py-2">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Input placeholder="Base price ($)" />
        </div>
        <TextArea placeholder="Describe your service, tools, guarantees, and scope…" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Service area (e.g., 15km radius)" />
          <Input placeholder="Availability (e.g., Mon–Fri 9–5)" />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Media</div>
          <div className="flex items-center gap-2">
            <GhostButton>
              <ImgIcon className="h-4 w-4" /> Add photo
            </GhostButton>
            <GhostButton>
              <Paperclip className="h-4 w-4" /> Add certification
            </GhostButton>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <GhostButton>Save Draft</GhostButton>
          <Button>Submit for Review</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- ADMIN ----------
function AdminConsole() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Admin Console</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {["Gigs Pending Review", "Jobs Flagged", "Open Disputes"].map((k, i) => (
          <Card key={k} className="p-4">
            <div className="text-sm text-neutral-500">{k}</div>
            <div className="mt-1 text-2xl font-bold">{[3, 1, 2][i]}</div>
          </Card>
        ))}
      </div>
      <Card className="mt-4 overflow-hidden">
        <div className="grid grid-cols-5 bg-neutral-50 p-3 text-sm font-medium">
          <div>ID</div>
          <div>Type</div>
          <div>User</div>
          <div>Reason</div>
          <div>Actions</div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="grid grid-cols-5 items-center border-t border-neutral-200 p-3 text-sm"
          >
            <div>#{1000 + i}</div>
            <div>{i === 1 ? "Gig" : "Job"}</div>
            <div>{i === 1 ? "Alex P." : "Jamie L."}</div>
            <div>{i === 1 ? "Photo requires review" : "Possible duplicate"}</div>
            <div className="flex gap-2">
              <GhostButton>Approve</GhostButton>
              <GhostButton className="border-red-300 text-red-600">Reject</GhostButton>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- ROOT ----------
const initialMessages = [
  { id: 1, from: "them", text: "Can you come tomorrow?" },
  { id: 2, from: "me", text: "Sure, 5pm works. 10:22 ✓✓" },
];

export default function QuickFixPrototype() {
  const [view, setView] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [booking, setBooking] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState(initialMessages);

  const handleBookGig = (gig) => {
    const newBooking = {
      gig,
      address: "123 Main St, Toronto",
      dateTime: "Tomorrow 5pm",
      price: gig.price,
    };
    setBooking(newBooking);
    setView("checkout");
  };

  const handleJobPosted = (job) => {
    setJobs((prev) => [...prev, job]);
    setView("provider");
  };

  const handleConfirmBooking = () => {
    // In a real app, you'd persist booking here
    setView("messages");
  };

  const handleSendMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "me", text },
    ]);
  };

  const renderView = () => {
    switch (view) {
      case "home":
        return (
          <Home
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearchClick={() => setView("search")}
            onViewGig={handleBookGig}
          />
        );
      case "search":
        return (
          <SearchView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onBookGig={handleBookGig}
          />
        );
      case "postJob":
        return <PostJobWizard onJobPosted={handleJobPosted} />;
      case "messages":
        return (
          <Messages
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        );
      case "checkout":
        return (
          <Checkout
            booking={booking}
            onConfirm={handleConfirmBooking}
          />
        );
      case "provider":
        return (
          <div>
            <ProviderDashboard jobs={jobs} />
            <ProviderCreateGig />
          </div>
        );
      case "admin":
        return <AdminConsole />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <TopNav view={view} setView={setView} />
      {renderView()}
      <footer className="mx-auto mt-10 max-w-7xl px-4 pb-16 text-center text-sm text-neutral-500">
        Built for QuickFix Capstone • Fiverr-style UX skeleton • React + Tailwind
      </footer>
    </div>
  );
}
