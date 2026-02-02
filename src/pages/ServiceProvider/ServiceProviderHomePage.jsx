// import { useEffect, useState } from "react";
// import Card from "../../components/UI/Card";
// import Button from "../../components/UI/Button";
// import Input from "../../components/UI/Input";
// import Tag from "../../components/UI/Tag";
// import { ChevronRight, MapPin, Clock, DollarSign } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const JOBS_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_available_jobs";

// /**
//  * 🔐 SINGLE SOURCE OF TRUTH
//  * Must match backend ServiceCategory enum exactly
//  */
// const SERVICE_CATEGORIES = [
//   "PLUMBING",
//   "ELECTRICAL",
//   "CLEANING",
//   "HANDYMAN",
//   "LANDSCAPING",
//   "HVAC",
//   "PAINTING",
//   "CARPENTRY",
//   "ROOFING",
//   "FLOORING",
//   "SNOW_REMOVAL",
//   "PEST_CONTROL",
//   "APPLIANCE_INSTALLATION",
//   "FURNITURE_ASSEMBLY",
//   "TV_MOUNTING",
//   "SMART_HOME_INSTALLATION",
//   "MOVING_SERVICES",
//   "JUNK_REMOVAL",
//   "IT_SUPPORT",
//   "OTHER",
// ];

// /**
//  * Normalize category coming from API
//  * - Handles lowercase / legacy values
//  * - Falls back safely to OTHER
//  */
// const normalizeCategory = (category) => {
//   if (!category) return "OTHER";

//   const upper = category.toUpperCase();

//   return SERVICE_CATEGORIES.includes(upper) ? upper : "OTHER";
// };

// export default function ServiceProviderHome() {
//   const [jobs, setJobs] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const res = await fetch(JOBS_API);
//         if (!res.ok) throw new Error("Failed to load jobs");

//         const data = await res.json();
//         setJobs(data.jobs || []);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchJobs();
//   }, []);

//   // ==============================
//   // 🔎 FILTER LOGIC (ENUM-SAFE)
//   // ==============================
//   const filteredJobs = jobs.filter((job) => {
//     const search = searchTerm.toLowerCase();
//     const category = normalizeCategory(job.category);

//     const matchesSearch =
//       job.title?.toLowerCase().includes(search) ||
//       job.description?.toLowerCase().includes(search) ||
//       job.location?.city?.toLowerCase().includes(search) ||
//       category.toLowerCase().includes(search);

//     const matchesCategory = !selectedCategory || category === selectedCategory;

//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="mx-auto max-w-7xl px-4 py-6">
//       {/* 🔥 HERO */}
//       <Card className="bg-gradient-to-br from-neutral-50 to-white p-6">
//         <div className="flex flex-col gap-4 md:flex-row md:items-center">
//           <div className="flex-1">
//             <h1 className="text-2xl font-bold">
//               Find jobs that match your skills
//             </h1>
//             <p className="text-neutral-600">
//               Live job postings • Verified customers • Flexible scheduling
//             </p>

//             {/* 🔎 SEARCH */}
//             <div className="mt-4 flex gap-2">
//               <Input
//                 placeholder="Search by title, category, or city"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <Button
//                 variant="ghost"
//                 onClick={() => {
//                   setSearchTerm("");
//                   setSelectedCategory("");
//                 }}
//               >
//                 Clear
//               </Button>
//             </div>
//           </div>

//           <img
//             src="https://picsum.photos/seed/jobs/640/360"
//             className="h-40 w-full rounded-2xl object-cover md:w-80"
//             alt="Jobs"
//           />
//         </div>
//       </Card>

//       {/* 🏷️ CATEGORY FILTER */}
//       <div className="mt-8">
//         <h2 className="mb-3 text-lg font-semibold">Job types</h2>
//         <div className="flex flex-wrap gap-2">
//           <Tag
//             onClick={() => setSelectedCategory("")}
//             className={!selectedCategory ? "bg-black text-white" : ""}
//           >
//             All
//           </Tag>

//           {SERVICE_CATEGORIES.map((c) => (
//             <Tag
//               key={c}
//               onClick={() => setSelectedCategory(c)}
//               className={selectedCategory === c ? "bg-black text-white" : ""}
//             >
//               {c.replaceAll("_", " ")}
//             </Tag>
//           ))}
//         </div>
//       </div>

//       {/* 🧰 JOB LIST */}
//       <div className="mt-8">
//         <h2 className="mb-3 text-lg font-semibold">Available jobs</h2>

//         {loading && <p className="text-neutral-500">Loading jobs...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         {!loading && filteredJobs.length === 0 && (
//           <p className="text-neutral-500">No jobs found.</p>
//         )}

//         <div className="grid gap-4 md:grid-cols-3">
//           {filteredJobs.map((job) => {
//             const category = normalizeCategory(job.category);

//             return (
//               <Card key={job.job_id}>
//                 <div className="p-4 space-y-3">
//                   {/* TITLE */}
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h3 className="font-semibold">{job.title}</h3>
//                       <Tag className="mt-1">
//                         {category.replaceAll("_", " ")}
//                       </Tag>
//                     </div>
//                     <Tag variant="success">OPEN</Tag>
//                   </div>

//                   {/* DESCRIPTION */}
//                   <p className="text-sm text-neutral-600 line-clamp-3">
//                     {job.description}
//                   </p>

//                   {/* LOCATION */}
//                   <div className="flex items-center text-sm text-neutral-500 gap-1">
//                     <MapPin className="h-4 w-4" />
//                     {job.location?.city}, {job.location?.state}
//                   </div>

//                   {/* BUDGET (DISPLAY ONLY) */}
//                   <div className="flex items-center text-sm text-neutral-600 gap-1">
//                     <DollarSign className="h-4 w-4" />${job.budget?.min} – $
//                     {job.budget?.max}
//                   </div>

//                   {/* DATE / TIME */}
//                   {(job.preferred_date || job.preferred_time) && (
//                     <div className="flex items-center text-sm text-neutral-500 gap-1">
//                       <Clock className="h-4 w-4" />
//                       {job.preferred_date} {job.preferred_time || ""}
//                     </div>
//                   )}

//                   {/* CTA */}
//                   <div className="flex justify-end pt-2">
//                     <Button
//                       onClick={() =>
//                         navigate(`/service-provider/job/${job.job_id}`)
//                       }
//                     >
//                       View Job <ChevronRight className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Tag from "../../components/UI/Tag";
import { ChevronRight, MapPin, Clock, DollarSign, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const normalizeCategory = (category) => {
  if (!category) return "OTHER";
  const upper = category.toUpperCase();
  return SERVICE_CATEGORIES.includes(upper) ? upper : "OTHER";
};

export default function ServiceProviderHome() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();
    const category = normalizeCategory(job.category);

    const matchesSearch =
      job.title?.toLowerCase().includes(search) ||
      job.description?.toLowerCase().includes(search) ||
      job.location?.city?.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search);

    const matchesCategory = !selectedCategory || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 lg:space-y-10">
      {/* 🌟 HERO */}
      <Card className="relative overflow-hidden border bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 items-center">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Find jobs that match your skills
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 max-w-md">
              Browse live job requests from verified customers. Apply on your
              schedule.
            </p>

            {/* 🔎 SEARCH */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  className="pl-9 h-10 sm:h-11"
                  placeholder="Search by title, category, or city"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <img
            src="https://picsum.photos/seed/jobs/640/360"
            className="rounded-xl sm:rounded-2xl object-cover shadow-sm w-full h-48 sm:h-auto"
            alt="Jobs"
          />
        </div>
      </Card>

      {/* 🏷️ CATEGORY FILTER */}
      <section>
        <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">Job categories</h2>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Tag
            onClick={() => setSelectedCategory("")}
            className={`cursor-pointer transition ${
              !selectedCategory ? "bg-black text-white" : "hover:bg-neutral-100"
            }`}
          >
            All
          </Tag>

          {SERVICE_CATEGORIES.map((c) => (
            <Tag
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`cursor-pointer transition ${
                selectedCategory === c
                  ? "bg-black text-white"
                  : "hover:bg-neutral-100"
              }`}
            >
              {c.replaceAll("_", " ")}
            </Tag>
          ))}
        </div>
      </section>

      {/* 🧰 JOB LIST */}
      <section>
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">
          Available jobs ({filteredJobs.length})
        </h2>

        {loading && <p className="text-sm sm:text-base text-neutral-500">Loading jobs…</p>}
        {error && <p className="text-sm sm:text-base text-red-500">{error}</p>}
        {!loading && filteredJobs.length === 0 && (
          <p className="text-sm sm:text-base text-neutral-500">No jobs found.</p>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => {
            const category = normalizeCategory(job.category);

            return (
              <Card
                key={job.job_id}
                className="group transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                  {/* HEADER */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
                        {job.title}
                      </h3>
                      <Tag>{category.replaceAll("_", " ")}</Tag>
                    </div>
                    <Tag variant="success" className="shrink-0">OPEN</Tag>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-sm text-neutral-600 line-clamp-3">
                    {job.description}
                  </p>

                  {/* META */}
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-neutral-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{job.location?.city}, {job.location?.state}</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-700">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />${job.budget?.min} – $
                      {job.budget?.max}
                    </div>

                    {(job.preferred_date || job.preferred_time) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        {job.preferred_date} {job.preferred_time || ""}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      className="gap-1 w-full sm:w-auto"
                      onClick={() =>
                        navigate(`/service-provider/job/${job.job_id}`)
                      }
                    >
                      View job
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
