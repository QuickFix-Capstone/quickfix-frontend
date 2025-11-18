import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import TextArea from "../components/UI/TextArea";
import GhostButton from "../components/UI/GhostButton";
import Button from "../components/UI/Button";
import { Image as ImgIcon, Paperclip, PlusCircle } from "lucide-react";

const categories = ["Plumbing", "Electrical", "HVAC", "Handyman", "Appliance Repair", "Painting"];

export default function ProviderCreateGig() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Create a Gig</h1>

      <Card className="p-6 space-y-4">

        <Input placeholder="Gig title (e.g., Install kitchen faucet)" />

        <div className="grid md:grid-cols-2 gap-3">
          <select className="w-full rounded-xl border px-3 py-2">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <Input placeholder="Base price ($)" />
        </div>

        <TextArea placeholder="Describe your service…" />

        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Service area (e.g., 15km radius)" />
          <Input placeholder="Availability (e.g., Mon-Fri 9-5)" />
        </div>

        {/* MEDIA */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Media</div>

          <div className="flex gap-2">
            <GhostButton>
              <ImgIcon className="h-4 w-4" /> Add photo
            </GhostButton>

            <GhostButton>
              <Paperclip className="h-4 w-4" /> Add certification
            </GhostButton>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="h-24 bg-neutral-100 rounded-xl" />
            <div className="h-24 bg-neutral-100 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-between">
          <GhostButton>Save Draft</GhostButton>
          <Button>Submit for Review</Button>
        </div>

      </Card>
    </div>
  );
}
