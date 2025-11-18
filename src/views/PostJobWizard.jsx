import { useState } from "react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import GhostButton from "../components/UI/GhostButton";
import Input from "../components/UI/Input";
import TextArea from "../components/UI/TextArea";
import Tag from "../components/UI/Tag";
import { Image as ImgIcon, MapPin, Clock, ChevronRight } from "lucide-react";

const categories = ["Plumbing", "Electrical", "HVAC", "Handyman", "Appliance Repair", "Painting"];

export default function PostJobWizard({ onJobPosted }) {
  const [step, setStep] = useState(1);

  // Form states
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

    // Reset form
    setStep(1);
    setDescription("");
    setAddress("");
    setDate("");
    setTime("");
    setBudgetType("Fixed");
    setBudgetAmount("");

    alert("Job posted!");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Post a Job</h1>

      <Card className="p-6 space-y-4">

        {/* STEP NAV */}
        <div className="flex items-center gap-2 text-sm">
          {["Details", "Schedule", "Photos", "Budget", "Review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <Tag className={step === i + 1 ? "bg-black text-white" : ""}>
                {i + 1}. {s}
              </Tag>
              {i < 4 && <div className="h-px w-6 bg-neutral-300" />}
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        {step === 1 && (
          <div className="space-y-3">
            <select
              className="w-full rounded-xl border px-3 py-2"
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
              <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="text-sm text-neutral-600">Preferred time</label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" />
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
              className="rounded-xl border px-3 py-2"
              value={budgetType}
              onChange={(e) => setBudgetType(e.target.value)}
            >
              <option>Fixed</option>
              <option>Hourly</option>
            </select>

            <Input
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="Budget amount ($)"
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {address || "123 Main St, Toronto"}
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> {date || "Tomorrow"}, {time || "5:00 PM"}
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl">
              <div className="font-semibold">{category}</div>
              {description || "No description provided yet."}
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl">
              Budget:{" "}
              <span className="font-semibold">
                {budgetType} {budgetAmount ? `$${budgetAmount}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* STEP CONTROLS */}
        <div className="flex justify-between">
          <GhostButton onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</GhostButton>

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
