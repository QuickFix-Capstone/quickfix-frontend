import { useEffect, useState } from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Tag from "../../components/UI/Tag";
import { ChevronRight, MapPin, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JOBS_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_available_jobs";

export default function ServiceProviderHome({ onViewJob }) {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const categories = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Handyman",
    "Appliance Repair",
    "Painting",
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch(JOBS_API);

        if (!res.ok) {
          throw new Error("Failed to load jobs");
        }

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

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 🔥 HERO */}
      <Card className="bg-gradient-to-br from-neutral-50 to-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Find jobs that match your skills
            </h1>
            <p className="text-neutral-600">
              Live job postings • Verified customers • Flexible scheduling
            </p>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Search jobs (e.g. plumbing, repair)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button>Search</Button>
            </div>
          </div>

          <img
            src="https://picsum.photos/seed/jobs/640/360"
            className="h-40 w-full rounded-2xl object-cover md:w-80"
            alt="Jobs"
          />
        </div>
      </Card>

      {/* 🏷️ CATEGORIES */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Popular categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </div>
      </div>

      {/* 🧰 JOB FEED */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Available jobs</h2>

        {loading && <p className="text-neutral-500">Loading jobs...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && filteredJobs.length === 0 && (
          <p className="text-neutral-500">No jobs found.</p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.job_id} className="cursor-pointer">
              <div className="p-4 space-y-3">
                {/* TITLE + CATEGORY */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <Tag className="mt-1">{job.category}</Tag>
                  </div>
                  <Tag variant="success">OPEN</Tag>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-neutral-600 line-clamp-3">
                  {job.description}
                </p>

                {/* LOCATION */}
                <div className="flex items-center text-sm text-neutral-500 gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location.city}, {job.location.state}
                </div>

                {/* BUDGET */}
                <div className="flex items-center text-sm text-neutral-600 gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.budget.min && job.budget.max
                    ? `$${job.budget.min} – $${job.budget.max}`
                    : "Budget not specified"}
                </div>

                {/* DATE / TIME */}
                {(job.preferred_date || job.preferred_time) && (
                  <div className="flex items-center text-sm text-neutral-500 gap-1">
                    <Clock className="h-4 w-4" />
                    {job.preferred_date} {job.preferred_time || ""}
                  </div>
                )}

                {/* CTA */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() =>
                      navigate(`/service-provider/job/${job.job_id}`)
                    }
                  >
                    View Job <ChevronRight className="h-4 w-4" />
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
