// // import { useEffect, useState } from "react";
// // import { fetchAuthSession } from "aws-amplify/auth";
// // import { useNavigate } from "react-router-dom";

// // import OfferingCard from "../../components/UI/OfferingCards";
// // import CreateServiceCard from "../../components/UI/CreateServiceCardStyle";
// // import MyJobApplicationsWidget from "../../pages/ServiceProvider/MyJobApplicationWidget";

// // export default function ServiceProviderDashboard() {
// //   const [offerings, setOfferings] = useState([]);
// //   const [profile, setProfile] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");

// //   const navigate = useNavigate();

// //   /* ================= Edit / Delete ================= */
// //   const handleEdit = (offering) => {
// //     navigate(`/service-provider/edit/${offering.service_offering_id}`);
// //   };

// //   const handleDelete = async (offering) => {
// //     const confirmed = window.confirm(`Delete "${offering.title}"?`);
// //     if (!confirmed) return;
// //     console.log("Deleting:", offering.service_offering_id);
// //   };

// //   /* ================= Load Profile ================= */
// //   useEffect(() => {
// //     const fetchProfile = async () => {
// //       try {
// //         const session = await fetchAuthSession();
// //         const token = session.tokens.idToken.toString();

// //         const res = await fetch(
// //           "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
// //           {
// //             headers: { Authorization: `Bearer ${token}` },
// //           }
// //         );

// //         if (!res.ok) throw new Error("Profile fetch failed");
// //         const data = await res.json();
// //         setProfile(data);
// //       } catch (err) {
// //         console.error(err);
// //         setError("Unable to load provider profile");
// //       }
// //     };

// //     fetchProfile();
// //   }, []);

// //   /* ================= Load Offerings ================= */
// //   useEffect(() => {
// //     const fetchOfferings = async () => {
// //       try {
// //         const session = await fetchAuthSession();
// //         const token = session.tokens.idToken.toString();

// //         const res = await fetch(
// //           "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service-offerings",
// //           {
// //             headers: { Authorization: `Bearer ${token}` },
// //           }
// //         );

// //         if (!res.ok) throw new Error("Offerings fetch failed");
// //         const data = await res.json();
// //         setOfferings(data.items || []);
// //       } catch (err) {
// //         console.error(err);
// //         setError("Unable to load service offerings");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchOfferings();
// //   }, []);

// //   /* ================= Loading ================= */
// //   if (loading) {
// //     return (
// //       <div className="max-w-7xl mx-auto px-4 py-10">
// //         <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
// //       </div>
// //     );
// //   }

// //   /* ================= Error ================= */
// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
// //         <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
// //           <h2 className="text-lg font-semibold text-red-600">
// //             Something went wrong
// //           </h2>
// //           <p className="mt-2 text-sm text-gray-500">{error}</p>
// //           <button
// //             onClick={() => window.location.reload()}
// //             className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
// //           >
// //             Retry
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   /* ================= MAIN DASHBOARD (THIS WAS MISSING) ================= */
// //   return (
// //     <div className="bg-gray-50 min-h-screen">
// //       <div className="max-w-7xl mx-auto px-4 py-10">
// //         {/* ================= Profile Summary ================= */}
// //         {profile && (
// //           <div className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
// //             <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
// //               <div className="flex items-center gap-4">
// //                 <div className="h-14 w-14 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-lg font-semibold text-neutral-700">
// //                   {profile.business_name?.[0] || "S"}
// //                 </div>

// //                 <div>
// //                   <div className="flex items-center gap-2">
// //                     <h2 className="text-xl font-semibold">
// //                       {profile.business_name}
// //                     </h2>

// //                     {profile.verification_status === "VERIFIED" && (
// //                       <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
// //                         ✓ Verified
// //                       </span>
// //                     )}
// //                   </div>

// //                   <p className="mt-1 text-sm text-neutral-500">
// //                     {profile.email}
// //                     {profile.phone_number && ` • ${profile.phone_number}`}
// //                   </p>
// //                 </div>
// //               </div>

// //               <button
// //                 onClick={() => navigate("/service-provider/profile")}
// //                 className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
// //               >
// //                 Edit profile
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         {/* ================= Job Applications ================= */}
// //         <div className="mb-12">
// //           <MyJobApplicationsWidget />
// //         </div>

// //         {/* ================= Offerings ================= */}
// //         <h1 className="text-3xl font-bold mb-2">Your Service Offerings</h1>
// //         <p className="text-gray-500 mb-6">
// //           Manage, edit, and showcase your services.
// //         </p>

// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //           <CreateServiceCard />
// //           {offerings.map((offering) => (
// //             <OfferingCard
// //               key={offering.service_offering_id}
// //               offering={offering}
// //               onEdit={handleEdit}
// //               onDelete={handleDelete}
// //               showActions
// //             />
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// import { useEffect, useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useNavigate } from "react-router-dom";

// import OfferingCard from "../../components/UI/OfferingCards";
// import CreateServiceCard from "../../components/UI/CreateServiceCardStyle";
// import MyJobApplicationsWidget from "../../pages/ServiceProvider/MyJobApplicationWidget";

// export default function ServiceProviderDashboard() {
//   const [offerings, setOfferings] = useState([]);
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const navigate = useNavigate();

//   /* ================= Edit / Delete ================= */
//   const handleEdit = (offering) => {
//     navigate(`/service-provider/edit/${offering.service_offering_id}`);
//   };

//   const handleDelete = async (offering) => {
//     const confirmed = window.confirm(`Delete "${offering.title}"?`);
//     if (!confirmed) return;
//     console.log("Deleting:", offering.service_offering_id);
//   };

//   /* ================= Load Profile ================= */
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const session = await fetchAuthSession();
//         const token = session.tokens.idToken.toString();

//         const res = await fetch(
//           "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         if (!res.ok) throw new Error("Profile fetch failed");
//         const data = await res.json();
//         setProfile(data);
//       } catch (err) {
//         console.error(err);
//         setError("Unable to load provider profile");
//       }
//     };

//     fetchProfile();
//   }, []);

//   /* ================= Load Offerings ================= */
//   useEffect(() => {
//     const fetchOfferings = async () => {
//       try {
//         const session = await fetchAuthSession();
//         const token = session.tokens.idToken.toString();

//         const res = await fetch(
//           "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service-offerings",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         if (!res.ok) throw new Error("Offerings fetch failed");
//         const data = await res.json();
//         setOfferings(data.items || []);
//       } catch (err) {
//         console.error(err);
//         setError("Unable to load service offerings");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOfferings();
//   }, []);

//   /* ================= Loading ================= */
//   if (loading) {
//     return (
//       <div className="max-w-7xl mx-auto px-4 py-10">
//         <div className="h-8 w-64 rounded-lg bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
//       </div>
//     );
//   }

//   /* ================= Error ================= */
//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
//         <div className="rounded-xl border bg-white p-6 text-center shadow-md">
//           <h2 className="text-lg font-semibold text-red-600">
//             Something went wrong
//           </h2>
//           <p className="mt-2 text-sm text-gray-500">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   /* ================= MAIN DASHBOARD ================= */
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
//       <div className="max-w-7xl mx-auto px-4 py-10">
//         {/* ================= Profile Summary ================= */}
//         {profile && (
//           <div className="mb-10 rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
//             <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center text-lg font-semibold text-white shadow-md">
//                   {profile.business_name?.[0] || "S"}
//                 </div>

//                 <div>
//                   <div className="flex items-center gap-2">
//                     <h2 className="text-xl font-semibold text-slate-900">
//                       {profile.business_name}
//                     </h2>

//                     {profile.verification_status === "VERIFIED" && (
//                       <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
//                         ✓ Verified
//                       </span>
//                     )}
//                   </div>

//                   <p className="mt-1 text-sm text-slate-500">
//                     {profile.email}
//                     {profile.phone_number && ` • ${profile.phone_number}`}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={() => navigate("/service-provider/profile")}
//                 className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
//               >
//                 Edit profile
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ================= Job Applications ================= */}
//         <div className="mb-12">
//           <MyJobApplicationsWidget />
//         </div>

//         {/* ================= Offerings ================= */}
//         <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
//           Your Service Offerings
//         </h1>
//         <p className="mb-6 text-slate-500">
//           Manage, edit, and showcase your services.
//         </p>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           <CreateServiceCard />
//           {offerings.map((offering) => (
//             <div
//               key={offering.service_offering_id}
//               className="transition-transform hover:-translate-y-1 hover:shadow-lg"
//             >
//               <OfferingCard
//                 offering={offering}
//                 onEdit={handleEdit}
//                 onDelete={handleDelete}
//                 showActions
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

import OfferingCard from "../../components/UI/OfferingCards";
import CreateServiceCard from "../../components/UI/CreateServiceCardStyle";
import MyJobApplicationsWidget from "../../pages/ServiceProvider/MyJobApplicationWidget";

export default function ServiceProviderDashboard() {
  const [offerings, setOfferings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* ================= Edit / Delete ================= */
  const handleEdit = (offering) => {
    navigate(`/service-provider/edit/${offering.service_offering_id}`);
  };

  const handleDelete = async (offering) => {
    const confirmed = window.confirm(`Delete "${offering.title}"?`);
    if (!confirmed) return;
    console.log("Deleting:", offering.service_offering_id);
  };

  /* ================= Load Profile ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load provider profile");
      }
    };

    fetchProfile();
  }, []);

  /* ================= Load Offerings ================= */
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service-offerings",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Offerings fetch failed");
        const data = await res.json();
        setOfferings(data.items || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load service offerings");
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  /* ================= Loading ================= */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 rounded-lg bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
      </div>
    );
  }

  /* ================= Error ================= */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="rounded-xl border bg-white p-6 text-center shadow-md">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ================= MAIN DASHBOARD ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ================= Profile Summary ================= */}
        {profile && (
          <div className="mb-10 rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center text-lg font-semibold text-white shadow-md">
                  {profile.business_name?.[0] || "S"}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {profile.business_name}
                    </h2>

                    {profile.verification_status === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email}
                    {profile.phone_number && ` • ${profile.phone_number}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/service-provider/profile")}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
              >
                Edit profile
              </button>
            </div>
          </div>
        )}

        {/* ================= Job Applications ================= */}
        <div className="mb-12">
          <MyJobApplicationsWidget />
        </div>

        {/* ================= Offerings ================= */}
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Your Service Offerings
        </h1>
        <p className="mb-6 text-slate-500">
          Manage, edit, and showcase your services.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateServiceCard />
          {offerings.map((offering) => (
            <div
              key={offering.service_offering_id}
              className="transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <OfferingCard
                offering={offering}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
