import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import Tag from "../components/UI/Tag";
import Rating from "../components/UI/Rating";
import gigs from "./gigs-data";

export default function SearchView({ searchTerm, setSearchTerm, onBookGig }) {
  const categories = ["Plumbing", "Electrical", "HVAC", "Handyman", "Appliance Repair", "Painting"];

  const filtered = gigs.filter((g) =>
    g.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">

      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button>Search</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Filters</h3>
          <Input placeholder="Location" />
          <Input placeholder="Budget max" />
          <Input placeholder="Date" />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        </Card>

        <div className="grid gap-4">
          {filtered.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div className="grid md:grid-cols-[200px_1fr] gap-4">
                <img src={g.img} className="w-full h-full object-cover" />

                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{g.title}</h3>
                      <p className="text-sm text-neutral-500">by {g.provider}</p>
                    </div>
                    <Rating value={g.rating} count={g.reviews} />
                  </div>

                  <div className="text-sm text-neutral-600">
                    Same-day service available. Guaranteed quality.
                  </div>

                  <div className="flex justify-between">
                    <p className="font-semibold">${g.price}</p>
                    <Button onClick={() => onBookGig(g)}>Book</Button>
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
