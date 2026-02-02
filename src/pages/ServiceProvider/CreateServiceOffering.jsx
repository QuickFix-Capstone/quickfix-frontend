// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { createServiceOffering } from "../../api/serviceOffering";
// import { ServiceCategory, PricingType } from "../../constants/serviceEnum";
// import { useLocation } from "../../context/LocationContext";

// const UPLOAD_IMAGE_URL =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/upload_image_URL";

// const labelize = (value) =>
//   value
//     .replace(/_/g, " ")
//     .toLowerCase()
//     .replace(/\b\w/g, (c) => c.toUpperCase());

// export default function CreateServiceOffering({ onCancel, onSuccess }) {
//   const navigate = useNavigate();
//   const { location, getLocation, loading: locationLoading, error: locationError } = useLocation();

//   useEffect(() => {
//     if (!location) {
//       getLocation();
//     }
//   }, [location, getLocation]);

//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     category: ServiceCategory.PLUMBING,
//     pricing_type: PricingType.HOURLY,
//     price: "",
//   });

//   const [imageFile, setImageFile] = useState(null);
//   const [imageUploading, setImageUploading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleCancel = () => {
//     onCancel ? onCancel() : navigate("/service-provider/dashboard");
//   };

//   // ==========================
//   // 🖼️ Upload Image Helper
//   // ==========================
//   const uploadImage = async (file, title) => {
//     const session = await fetchAuthSession();
//     const token = session.tokens.accessToken.toString();

//     // 1️⃣ Request presigned URL
//     const res = await fetch(UPLOAD_IMAGE_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         title,
//         content_type: file.type, // still OK for validation only
//       }),
//     });

//     if (!res.ok) {
//       const err = await res.json();
//       throw new Error(err.error || "Failed to get upload URL");
//     }

//     // ✅ ONLY expect uploadUrl + s3Key
//     const { uploadUrl, s3Key } = await res.json();

//     // 2️⃣ Upload image to S3 (NO HEADERS)
//     const uploadRes = await fetch(uploadUrl, {
//       method: "PUT",
//       body: file,
//     });

//     if (!uploadRes.ok) {
//       throw new Error("Failed to upload image to S3");
//     }

//     // ✅ RETURN THE KEY (NOT A URL)
//     return s3Key;
//   };

//   // ==========================
//   // 🚀 Submit Handler
//   // ==========================
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError("");

//       const session = await fetchAuthSession();
//       const token = session.tokens.accessToken.toString();

//       let imageKey = null;

//       // 🖼️ Upload image first (optional)
//       if (imageFile) {
//         setImageUploading(true);
//         imageKey = await uploadImage(imageFile, form.title);
//         setImageUploading(false);
//       }

//       // 📦 Create service offering
//       await createServiceOffering(
//         {
//           ...form,
//           price: Number(form.price),
//           main_image_url: imageKey, // ✅ STORE KEY ONLY
//           ...(location && {
//             latitude: location.latitude,
//             longitude: location.longitude,
//           }),
//         },
//         token
//       );

//       onSuccess ? onSuccess() : navigate("/service-provider/dashboard");
//     } catch (err) {
//       setError(err.message || "Failed to create service offering");
//     } finally {
//       setLoading(false);
//       setImageUploading(false);
//     }
//   };

//   return (
//     <div className="mx-auto max-w-2xl px-4 py-8">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold">Create a Service Offering</h1>
//         <p className="text-neutral-600">
//           List a service clients can discover and book instantly.
//         </p>
//       </div>

//       {/* Card */}
//       <div className="card p-6 space-y-6">
//         {error && (
//           <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {locationError && (
//           <div className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-yellow-700">
//             {locationError} - Your service will be created without location data.
//           </div>
//         )}

//         {locationLoading && (
//           <div className="rounded-xl bg-blue-100 px-4 py-3 text-sm text-blue-700">
//             Getting your location...
//           </div>
//         )}

//         {location && (
//           <div className="rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
//             Location detected
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Service Details */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-semibold">Service Details</h2>

//             <div className="space-y-2">
//               <label className="text-sm text-neutral-600">Title</label>
//               <input
//                 name="title"
//                 required
//                 placeholder="e.g. Emergency Plumbing Repair"
//                 className="input"
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm text-neutral-600">Description</label>
//               <textarea
//                 name="description"
//                 required
//                 placeholder="Describe what you offer, what's included, and why clients should choose you."
//                 className="input min-h-[120px]"
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="grid gap-4 md:grid-cols-2">
//               <div className="space-y-2">
//                 <label className="text-sm text-neutral-600">Category</label>
//                 <select
//                   name="category"
//                   className="input"
//                   value={form.category}
//                   onChange={handleChange}
//                 >
//                   {Object.values(ServiceCategory).map((cat) => (
//                     <option key={cat} value={cat}>
//                       {labelize(cat)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm text-neutral-600">Pricing Type</label>
//                 <select
//                   name="pricing_type"
//                   className="input"
//                   value={form.pricing_type}
//                   onChange={handleChange}
//                 >
//                   {Object.values(PricingType).map((type) => (
//                     <option key={type} value={type}>
//                       {labelize(type)}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Pricing */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-semibold">Pricing</h2>

//             <div className="space-y-2">
//               <label className="text-sm text-neutral-600">Price</label>
//               <div className="flex items-center rounded-xl border border-neutral-300 px-3 focus-within:ring-2 focus-within:ring-black/20">
//                 <span className="text-neutral-500">$</span>
//                 <input
//                   type="number"
//                   name="price"
//                   required
//                   placeholder="0.00"
//                   className="w-full border-none bg-transparent px-2 py-2 outline-none"
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Media */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-semibold">Media</h2>

//             <div className="space-y-2">
//               <label className="text-sm text-neutral-600">
//                 Main Image (optional)
//               </label>
//               <input
//                 type="file"
//                 accept="image/png,image/jpeg,image/webp"
//                 className="input"
//                 onChange={(e) => setImageFile(e.target.files[0])}
//               />

//               {imageFile && (
//                 <p className="text-xs text-neutral-500">
//                   Selected: {imageFile.name}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 pt-6">
//             <button
//               type="button"
//               onClick={handleCancel}
//               className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-100"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={loading || imageUploading}
//               className="btn-primary w-full"
//             >
//               {imageUploading
//                 ? "Uploading image..."
//                 : loading
//                 ? "Creating..."
//                 : "Create Service"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { createServiceOffering } from "../../api/serviceOffering";
import { ServiceCategory, PricingType } from "../../constants/serviceEnum";
import { useLocation } from "../../context/LocationContext";

const UPLOAD_IMAGE_URL =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/upload_image_URL";

const labelize = (value) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function CreateServiceOffering({ onCancel, onSuccess }) {
  const navigate = useNavigate();

  // 📍 Location Context
  const {
    location,
    getLocation,
    loading: locationLoading,
    error: locationError,
  } = useLocation();

  useEffect(() => {
    if (!location) {
      getLocation();
    }
  }, [location, getLocation]);

  // 📦 Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: ServiceCategory.PLUMBING,
    pricing_type: PricingType.HOURLY,
    price: "",
    service_radius_km: 10,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCancel = () => {
    onCancel ? onCancel() : navigate("/service-provider/dashboard");
  };

  // ==========================
  // 🖼️ Upload Image Helper
  // ==========================
  const uploadImage = async (file, title) => {
    const session = await fetchAuthSession();
    const token = session.tokens.accessToken.toString();

    const res = await fetch(UPLOAD_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        content_type: file.type,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get upload URL");
    }

    const { uploadUrl, s3Key } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload image to S3");
    }

    return s3Key;
  };

  // ==========================
  // 🚀 Submit Handler
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚫 Location is REQUIRED
    if (!location) {
      setError("Location is required to create a service offering.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const session = await fetchAuthSession();
      const token = session.tokens.accessToken.toString();

      let imageKey = null;

      if (imageFile) {
        setImageUploading(true);
        imageKey = await uploadImage(imageFile, form.title);
        setImageUploading(false);
      }

      await createServiceOffering(
        {
          title: form.title,
          description: form.description,
          category: form.category,
          pricing_type: form.pricing_type,
          price: Number(form.price),
          latitude: location.latitude,
          longitude: location.longitude,
          service_radius_km: Number(form.service_radius_km),
          main_image_url: imageKey,
        },
        token,
      );

      onSuccess ? onSuccess() : navigate("/service-provider/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create service offering");
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create a Service Offering</h1>
        <p className="text-neutral-600">
          List a service clients can discover and book instantly.
        </p>
      </div>

      {/* Card */}
      <div className="card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {locationError && (
          <div className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-yellow-700">
            {locationError}
          </div>
        )}

        {locationLoading && (
          <div className="rounded-xl bg-blue-100 px-4 py-3 text-sm text-blue-700">
            Getting your location…
          </div>
        )}

        {location && (
          <div className="rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
            Location detected ({location.latitude.toFixed(4)},{" "}
            {location.longitude.toFixed(4)})
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Service Details</h2>

            <input
              name="title"
              required
              placeholder="Service title"
              className="input"
              onChange={handleChange}
            />

            <textarea
              name="description"
              required
              placeholder="Describe your service"
              className="input min-h-[120px]"
              onChange={handleChange}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="category"
                className="input"
                value={form.category}
                onChange={handleChange}
              >
                {Object.values(ServiceCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {labelize(cat)}
                  </option>
                ))}
              </select>

              <select
                name="pricing_type"
                className="input"
                value={form.pricing_type}
                onChange={handleChange}
              >
                {Object.values(PricingType).map((type) => (
                  <option key={type} value={type}>
                    {labelize(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>

            <input
              type="number"
              name="price"
              required
              placeholder="Price"
              className="input"
              onChange={handleChange}
            />
          </div>

          {/* Service Area */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Service Area</h2>

            <input
              type="number"
              name="service_radius_km"
              min={1}
              max={100}
              required
              className="input"
              value={form.service_radius_km}
              onChange={handleChange}
            />
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Media</h2>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="input"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || imageUploading}
              className="btn-primary w-full"
            >
              {imageUploading
                ? "Uploading image…"
                : loading
                  ? "Creating…"
                  : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
