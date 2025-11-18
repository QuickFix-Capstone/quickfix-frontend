import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import Tag from "../components/UI/Tag";
import Rating from "../components/UI/Rating";
import { ChevronRight } from "lucide-react";
import gigs from "./gigs-data";

export default function Home({ searchTerm, setSearchTerm, onSearchClick, onViewGig }) {
  const categories = ["Plumbing", "Electrical", "HVAC", "Handyman", "Appliance Repair", "Painting"];

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
              <Button onClick={onSearchClick}>Search</Button>
            </div>
          </div>

          <img
            src="https://picsum.photos/seed/home/640/360"
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
            <Card key={g.id} className="overflow-hidden cursor-pointer">
              <img src={g.img} className="h-40 w-full object-cover" />

              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-sm text-neutral-500">by {g.provider}</p>
                  </div>
                  <Rating value={g.rating} count={g.reviews} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    From <span className="font-semibold">${g.price}</span>
                  </p>

                  <Button onClick={() => onViewGig(g)}>
                    View / Book <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
