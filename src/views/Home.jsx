<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useState } from "react";
>>>>>>> Kunpeng/login
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import Tag from "../components/UI/Tag";
import Rating from "../components/UI/Rating";
import { ChevronRight } from "lucide-react";

export default function Home({
  searchTerm: propSearchTerm,
  setSearchTerm: propSetSearchTerm,
  onSearchClick,
  onViewGig
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm;
  const setSearchTerm = propSetSearchTerm || setLocalSearchTerm;

  const handleSearch = () => {
    if (onSearchClick) onSearchClick(searchTerm);
  };

  const categories = ["Plumbing", "Electrical", "HVAC", "Handyman", "Appliance Repair", "Painting"];

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: selected category filter
  const [selectedCategory, setSelectedCategory] = useState("");

  // 👉 Fetch all offerings from your API
  useEffect(() => {
    async function loadOfferings() {
      try {
        const res = await fetch("https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/service-offerings");
        const data = await res.json();
        setOfferings(data.offerings || []);
      } catch (err) {
        console.error("Failed to load offerings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOfferings();
  }, []);

  // ⭐ FILTER LOGIC (BEST PRACTICE)
  const filteredOfferings = offerings.filter((o) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.category?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      !selectedCategory ||
      o.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">

      {/* HERO */}
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
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          <img
            src="https://picsum.photos/seed/home/640/360"
            className="h-40 w-full rounded-2xl object-cover md:w-80"
          />
        </div>
      </Card>

      {/* POPULAR CATEGORIES */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Popular categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Tag
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={
                selectedCategory === c
                  ? "bg-black text-white"
                  : "cursor-pointer"
              }
            >
              {c}
            </Tag>
          ))}
          {/* Allow clearing category filter */}
          {selectedCategory && (
            <Tag
              onClick={() => setSelectedCategory("")}
              className="bg-red-500 text-white cursor-pointer"
            >
              Clear
            </Tag>
          )}
        </div>
      </div>

      {/* ALL OFFERINGS */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">All Service Offerings</h2>

        {loading ? (
          <p>Loading...</p>
        ) : filteredOfferings.length === 0 ? (
          <p>No offerings match your filter.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">

            {filteredOfferings.map((o) => (
              <Card key={o.offering_id} className="overflow-hidden cursor-pointer">
                <img
                  src={o.image_url || "https://via.placeholder.com/400x240?text=No+Image"}
                  alt={o.title}
                  className="h-40 w-full object-cover"
                />

                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{o.title}</h3>
                      <p className="text-sm text-neutral-500">
                        {o.city}, {o.state}
                      </p>
                    </div>

                    {/* <Rating value={o.rating || 4.5} count={10} /> */}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      From <span className="font-semibold">${o.price}</span>
                    </p>

<<<<<<< HEAD
                    <Button onClick={() => onViewGig(o)}>
                      View / Book <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
=======
                  <Button onClick={() => onViewGig && onViewGig(g)}>
                    View / Book <ChevronRight className="h-4 w-4" />
                  </Button>
>>>>>>> Kunpeng/login
                </div>
              </Card>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}
