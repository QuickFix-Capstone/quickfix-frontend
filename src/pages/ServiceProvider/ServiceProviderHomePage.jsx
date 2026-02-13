import { useEffect, useState } from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Tag from "../../components/UI/Tag";
import {
  ChevronRight,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocation as useUserLocation } from "../../context/LocationContext";

const JOBS_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_available_jobs";

/**
 * 🔐 SINGLE SOURCE OF TRUTH
 */
const SERVICE_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "HANDYMAN",
  "LANDSCAPING",
  "HVAC",
  "PAINTING",
  "CARPENTRY",
  "ROOFING",
  "FLOORING",
  "SNOW_REMOVAL",
  "PEST_CONTROL",
  "APPLIANCE_INSTALLATION",
  "FURNITURE_ASSEMBLY",
  "TV_MOUNTING",
  "SMART_HOME_INSTALLATION",
  "MOVING_SERVICES",
  "JUNK_REMOVAL",
  "IT_SUPPORT",
  "OTHER",
];

const RADIUS_OPTIONS = [
  { label: "Any distance", value: null },
  { label: "Within 5 miles", value: 5 },
  { label: "Within 10 miles", value: 10 },
  { label: "Within 25 miles", value: 25 },
  { label: "Within 50 miles", value: 50 },
  { label: "Within 100 miles", value: 100 },
];

const normalizeCategory = (category) => {
  if (!category) return "OTHER";
  const upper = category.toUpperCase();
  return SERVICE_CATEGORIES.includes(upper) ? upper : "OTHER";
};

/**
 * 📍 FULL ADDRESS FORMATTER (Lambda-safe)
 */
const formatFullAddress = (location) => {
  if (!location) return "Location not provided";

  return [location.address, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(", ");
};

/**
 * 📐 Haversine distance (miles)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function ServiceProviderHome() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const {
    location: userLocation,
    getLocation,
    loading: locationLoading,
    error: locationError,
  } = useUserLocation();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(JOBS_API);
        if (!res.ok) throw new Error("Failed to load jobs");

        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (!userLocation) {
      getLocation();
    }
  }, [userLocation, getLocation]);

  const hasLocationData = userLocation?.latitude && userLocation?.longitude;

  const filteredJobs = jobs
    .map((job) => {
      let distance = null;

      if (
        hasLocationData &&
        job.location?.latitude &&
        job.location?.longitude
      ) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          job.location.latitude,
          job.location.longitude,
        );
      }

      return { ...job, distance };
    })
    .filter((job) => {
      const search = searchTerm.toLowerCase();
      const category = normalizeCategory(job.category);

      const matchesSearch =
        job.title?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        job.location?.city?.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search);

      const matchesCategory =
        !selectedCategory || category === selectedCategory;

      const matchesRadius =
        selectedRadius === null ||
        job.distance === null ||
        job.distance <= selectedRadius;

      return matchesSearch && matchesCategory && matchesRadius;
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null)
        return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* 🌟 HERO */}
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-2">
          Find jobs that match your skills
        </h1>
        <p className="text-neutral-600 mb-4">
          Browse live job requests from verified customers.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search by title, category, or city"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedRadius(null);
            }}
          >
            Clear
          </Button>
        </div>

        <div className="mt-3 text-sm">
          {hasLocationData ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <Navigation className="h-4 w-4" />
              Location enabled
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <Navigation className="h-4 w-4" />
              {locationLoading
                ? "Detecting your location…"
                : "Enable location to filter by distance"}
              <Button
                size="sm"
                variant="ghost"
                disabled={locationLoading}
                onClick={getLocation}
              >
                Enable
              </Button>
            </div>
          )}
          {locationError && (
            <p className="text-red-500 text-sm">{locationError}</p>
          )}
        </div>
      </Card>

      {/* 🏷️ CATEGORY FILTER */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Job categories</h2>
        <div className="flex flex-wrap gap-2">
          <Tag
            onClick={() => setSelectedCategory("")}
            className={!selectedCategory ? "bg-black text-white" : ""}
          >
            All
          </Tag>
          {SERVICE_CATEGORIES.map((c) => (
            <Tag
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={selectedCategory === c ? "bg-black text-white" : ""}
            >
              {c.replaceAll("_", " ")}
            </Tag>
          ))}
        </div>
      </section>

      {/* 📍 RADIUS FILTER */}
      {hasLocationData && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Distance from you</h2>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((o) => (
              <Tag
                key={o.label}
                onClick={() => setSelectedRadius(o.value)}
                className={
                  selectedRadius === o.value ? "bg-black text-white" : ""
                }
              >
                {o.label}
              </Tag>
            ))}
          </div>
        </section>
      )}

      {/* 🧰 JOB LIST */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Available jobs ({filteredJobs.length})
        </h2>

        {loading && <p className="text-neutral-500">Loading jobs…</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid gap-6 md:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.job_id} className="p-5 space-y-4">
              <h3 className="font-semibold text-lg">{job.title}</h3>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <p>{formatFullAddress(job.location)}</p>
                  <p className="text-xs text-neutral-400">
                    Distance unavailable
                  </p>
                </div>
              </div>

              <p className="text-sm text-neutral-600 line-clamp-3">
                {job.description}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-sm">
                  ${job.budget?.min} – ${job.budget?.max}
                </span>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/service-provider/job/${job.job_id}`)
                  }
                >
                  View job
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
