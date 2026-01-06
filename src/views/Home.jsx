// import React, { useEffect, useState } from "react";
// import { useAuth } from "react-oidc-context";
// import { useNavigate } from "react-router-dom";
// import { Star, ArrowLeft, Search, Filter, Upload } from "lucide-react";
// import Card from "../components/UI/Card";
// import Button from "../components/UI/Button";

// export default function ServiceList() {
//   const auth = useAuth();
//   const navigate = useNavigate();

//   const [services, setServices] = useState([]);
//   const [filteredServices, setFilteredServices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("ALL");

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const servicesPerPage = 9;

//   const categories = [
//     { value: "ALL", label: "All Services" },
//     { value: "PLUMBING", label: "Plumbing" },
//     { value: "ELECTRICAL", label: "Electrical" },
//     { value: "HVAC", label: "HVAC" },
//     { value: "CLEANING", label: "Cleaning" },
//     { value: "HANDYMAN", label: "Handyman" },
//     { value: "PEST_CONTROL", label: "Pest Control" },
//   ];

//   const categoryColors = {
//     PLUMBING: "bg-blue-100 text-blue-800",
//     ELECTRICAL: "bg-yellow-100 text-yellow-800",
//     HVAC: "bg-purple-100 text-purple-800",
//     CLEANING: "bg-green-100 text-green-800",
//     HANDYMAN: "bg-orange-100 text-orange-800",
//     PEST_CONTROL: "bg-red-100 text-red-800",
//   };

//   /* ================= AUTH + LOAD ================= */
//   useEffect(() => {
//     if (!auth.isAuthenticated) {
//       navigate("/customer/login");
//       return;
//     }
//     fetchServices();
//   }, [auth.isAuthenticated, navigate]);

//   const fetchServices = async () => {
//     try {
//       const res = await fetch(
//         "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_all_service_offering"
//       );
//       if (res.ok) {
//         const data = await res.json();
//         setServices(data.items || []);
//       }
//     } catch (err) {
//       console.error("Error fetching services:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= FILTER ================= */
//   useEffect(() => {
//     let filtered = services;

//     if (selectedCategory !== "ALL") {
//       filtered = filtered.filter((s) => s.category === selectedCategory);
//     }

//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       filtered = filtered.filter(
//         (s) =>
//           s.title.toLowerCase().includes(q) ||
//           s.description.toLowerCase().includes(q)
//       );
//     }

//     setFilteredServices(filtered);
//     setCurrentPage(1);
//   }, [services, searchQuery, selectedCategory]);

//   /* ================= HELPERS ================= */
//   const formatPrice = (price = 0, pricingType) =>
//     `$${Number(price).toFixed(2)}${pricingType === "HOURLY" ? " / hr" : ""}`;

//   const renderStars = (rating = 0) => (
//     <div className="flex items-center gap-1">
//       <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
//       <span className="text-sm font-medium text-neutral-700">
//         {Number(rating).toFixed(1)}
//       </span>
//     </div>
//   );

//   /* ================= PAGINATION ================= */
//   const indexOfLast = currentPage * servicesPerPage;
//   const indexOfFirst = indexOfLast - servicesPerPage;
//   const currentServices = filteredServices.slice(indexOfFirst, indexOfLast);
//   const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-neutral-50">
//         <span className="text-neutral-500">Loading services...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
//       <div className="mx-auto max-w-7xl">
//         {/* Header */}
//         <h1 className="text-3xl font-bold text-neutral-900">
//           Available Services
//         </h1>
//         <p className="mb-6 text-neutral-600">
//           Browse and book professional services
//         </p>

//         {/* Search */}
//         <div className="relative mb-4">
//           <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
//           <input
//             type="text"
//             placeholder="Search services..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full rounded-lg border border-neutral-300 bg-white py-3 pl-10 pr-4 focus:ring-1 focus:ring-neutral-900"
//           />
//         </div>

//         {/* Categories */}
//         <div className="mb-6 flex gap-2 overflow-x-auto">
//           <Filter className="h-5 w-5 text-neutral-500 mt-2" />
//           {categories.map((c) => (
//             <button
//               key={c.value}
//               onClick={() => setSelectedCategory(c.value)}
//               className={`rounded-full px-4 py-2 text-sm font-medium ${
//                 selectedCategory === c.value
//                   ? "bg-neutral-900 text-white"
//                   : "bg-white border hover:bg-neutral-100"
//               }`}
//             >
//               {c.label}
//             </button>
//           ))}
//         </div>

//         {/* Grid */}
//         {filteredServices.length === 0 ? (
//           <Card className="p-12 text-center">
//             <p className="text-neutral-500">No services found.</p>
//             <Button
//               className="mt-4"
//               onClick={() => {
//                 setSearchQuery("");
//                 setSelectedCategory("ALL");
//               }}
//             >
//               Clear Filters
//             </Button>
//           </Card>
//         ) : (
//           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {currentServices.map((service) => (
//               <Card
//                 key={service.service_offering_id}
//                 className="overflow-hidden"
//               >
//                 {/* Image */}
//                 <div className="h-48 bg-neutral-200 flex items-center justify-center">
//                   {service.main_image_url ? (
//                     <img
//                       src={service.main_image_url}
//                       alt={service.title}
//                       className="h-full w-full object-cover"
//                       onError={(e) => (e.target.style.display = "none")}
//                     />
//                   ) : (
//                     <div className="flex flex-col items-center text-neutral-400">
//                       <Upload className="h-6 w-6" />
//                       <span className="text-sm">No image</span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Details */}
//                 <div className="p-4">
//                   <h3 className="text-lg font-semibold">{service.title}</h3>

//                   <div className="mt-2 flex justify-between">
//                     {renderStars(service.rating)}
//                     <span
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         categoryColors[service.category]
//                       }`}
//                     >
//                       {service.category.split("_").join(" ")}
//                     </span>
//                   </div>

//                   <p className="mt-3 line-clamp-2 text-sm text-neutral-600">
//                     {service.description}
//                   </p>

//                   <div className="mt-4 text-xl font-bold">
//                     {formatPrice(service.price, service.pricing_type)}
//                   </div>

//                   <Button
//                     className="mt-4 w-full"
//                     onClick={() =>
//                       navigate("/customer/book", { state: { service } })
//                     }
//                   >
//                     Book Now
//                   </Button>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="mt-8 flex justify-center gap-2">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//               <button
//                 key={p}
//                 onClick={() => setCurrentPage(p)}
//                 className={`px-4 py-2 rounded-lg ${
//                   p === currentPage
//                     ? "bg-neutral-900 text-white"
//                     : "bg-white border"
//                 }`}
//               >
//                 {p}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { Star, Search, Filter, Upload } from "lucide-react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";

export default function ServiceList() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 9;

  const categories = [
    { value: "ALL", label: "All Services" },
    { value: "PLUMBING", label: "Plumbing" },
    { value: "ELECTRICAL", label: "Electrical" },
    { value: "HVAC", label: "HVAC" },
    { value: "CLEANING", label: "Cleaning" },
    { value: "HANDYMAN", label: "Handyman" },
    { value: "PEST_CONTROL", label: "Pest Control" },
  ];

  const categoryColors = {
    PLUMBING: "bg-blue-100 text-blue-800",
    ELECTRICAL: "bg-yellow-100 text-yellow-800",
    HVAC: "bg-purple-100 text-purple-800",
    CLEANING: "bg-green-100 text-green-800",
    HANDYMAN: "bg-orange-100 text-orange-800",
    PEST_CONTROL: "bg-red-100 text-red-800",
  };

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/customer/login");
      return;
    }
    fetchServices();
  }, [auth.isAuthenticated, navigate]);

  const fetchServices = async () => {
    try {
      const res = await fetch(
        "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_all_service_offering"
      );
      if (res.ok) {
        const data = await res.json();
        setServices(data.items || []);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */
  useEffect(() => {
    let filtered = services;

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

    setFilteredServices(filtered);
    setCurrentPage(1);
  }, [services, searchQuery, selectedCategory]);

  /* ================= HELPERS ================= */
  const formatPrice = (price = 0, pricingType) =>
    `$${Number(price).toFixed(2)}${pricingType === "HOURLY" ? " / hr" : ""}`;

  const renderStars = (rating = 0) => (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-neutral-700">
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * servicesPerPage;
  const indexOfFirst = indexOfLast - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
        <span className="text-neutral-500">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-neutral-900">
          Available Services
        </h1>
        <div className="mt-2 mb-4 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
        <p className="mb-6 text-neutral-600">
          Browse and book professional services
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-indigo-200 bg-white py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Categories */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          <Filter className="h-5 w-5 text-neutral-500 mt-2" />
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === c.value
                  ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow"
                  : "bg-white border hover:bg-indigo-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredServices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-neutral-500">No services found.</p>
            <Button
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentServices.map((service) => (
              <Card
                key={service.service_offering_id}
                className="overflow-hidden transition hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-emerald-100 flex items-center justify-center">
                  {service.main_image_url ? (
                    <img
                      src={service.main_image_url}
                      alt={service.title}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-neutral-500">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {service.title}
                  </h3>

                  <div className="mt-2 flex justify-between items-center">
                    {renderStars(service.rating)}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        categoryColors[service.category]
                      }`}
                    >
                      {service.category.split("_").join(" ")}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-neutral-600">
                    {service.description}
                  </p>

                  <div className="mt-4 text-xl font-bold text-indigo-600">
                    {formatPrice(service.price, service.pricing_type)}
                  </div>

                  <Button
                    className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-90"
                    onClick={() =>
                      navigate("/customer/book", { state: { service } })
                    }
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-4 py-2 rounded-lg transition ${
                  p === currentPage
                    ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white"
                    : "bg-white border hover:bg-indigo-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
