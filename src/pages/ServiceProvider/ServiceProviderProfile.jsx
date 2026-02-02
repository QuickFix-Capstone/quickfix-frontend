// import { useEffect, useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useNavigate } from "react-router-dom";

// export default function ServiceProviderProfile() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     business_name: "",
//     phone_number: "",
//     address_line: "",
//     city: "",
//     province: "",
//     postal_code: "",
//     bio: "",
//   });

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   /* ==============================
//      LOAD CURRENT SERVICE PROVIDER
//      ============================== */
//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         const session = await fetchAuthSession();
//         const token = session.tokens.idToken.toString();

//         const res = await fetch(
//           "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         if (!res.ok) {
//           throw new Error("Failed to load profile");
//         }

//         const data = await res.json();

//         // ✅ PREFILL FORM WITH EXISTING DATA
//         setForm({
//           name: data.name ?? "",
//           business_name: data.business_name ?? "",
//           phone_number: data.phone_number ?? "",
//           address_line: data.address_line ?? "",
//           city: data.city ?? "",
//           province: data.province ?? "",
//           postal_code: data.postal_code ?? "",
//           bio: data.bio ?? "",
//         });
//       } catch (err) {
//         console.error(err);
//         setError("Unable to load profile information.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadProfile();
//   }, []);

//   /* ==============================
//      HANDLERS
//      ============================== */
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     setError("");

//     try {
//       const session = await fetchAuthSession();
//       const token = session.tokens.idToken.toString();

//       const res = await fetch(
//         "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(form),
//         }
//       );

//       if (!res.ok) {
//         throw new Error("Update failed");
//       }

//       navigate("/service-provider/dashboard");
//     } catch (err) {
//       console.error(err);
//       setError("Failed to update profile. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ==============================
//      LOADING STATE
//      ============================== */
//   if (loading) {
//     return (
//       <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
//         <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
//         <div className="space-y-4">
//           {[...Array(7)].map((_, i) => (
//             <div key={i} className="h-10 bg-gray-100 rounded" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto px-4 py-10">
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">
//         Edit Service Provider Profile
//       </h1>

//       {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

//       <form onSubmit={handleSubmit} className="space-y-5">
//         <Input
//           label="Your Name"
//           name="name"
//           value={form.name}
//           onChange={handleChange}
//         />

//         <Input
//           label="Business Name"
//           name="business_name"
//           value={form.business_name}
//           onChange={handleChange}
//         />

//         <Input
//           label="Phone Number"
//           name="phone_number"
//           value={form.phone_number}
//           onChange={handleChange}
//         />

//         <Input
//           label="Address Line"
//           name="address_line"
//           value={form.address_line}
//           onChange={handleChange}
//         />

//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <Input
//             label="City"
//             name="city"
//             value={form.city}
//             onChange={handleChange}
//           />
//           <Input
//             label="Province"
//             name="province"
//             value={form.province}
//             onChange={handleChange}
//           />
//           <Input
//             label="Postal Code"
//             name="postal_code"
//             value={form.postal_code}
//             onChange={handleChange}
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Bio
//           </label>
//           <textarea
//             name="bio"
//             value={form.bio}
//             onChange={handleChange}
//             rows={4}
//             className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black"
//           />
//         </div>

//         <div className="flex justify-end gap-3 pt-4">
//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="rounded-lg border px-4 py-2 text-sm text-gray-700"
//           >
//             Cancel
//           </button>

//           <button
//             type="submit"
//             disabled={saving}
//             className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Save Changes"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// /* ==============================
//    REUSABLE INPUT COMPONENT
//    ============================== */
// function Input({ label, ...props }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-1">
//         {label}
//       </label>
//       <input
//         {...props}
//         className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black"
//       />
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

export default function ServiceProviderProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    business_name: "",
    phone_number: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
    bio: "",
  });

  const [originalForm, setOriginalForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  /* ==============================
     LOAD PROFILE
     ============================== */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();

        const prefilled = {
          name: data.name ?? "",
          business_name: data.business_name ?? "",
          phone_number: data.phone_number ?? "",
          address_line: data.address_line ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
          postal_code: data.postal_code ?? "",
          bio: data.bio ?? "",
        };

        setForm(prefilled);
        setOriginalForm(prefilled);
      } catch (err) {
        console.error(err);
        setAlert({
          type: "error",
          message: "Unable to load profile information.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  /* ==============================
     HELPERS
     ============================== */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);

  const validateForm = () => {
    if (!form.name.trim()) return "Your name is required";
    if (!form.phone_number.match(/^[0-9+\-\s()]{7,}$/))
      return "Enter a valid phone number";
    if (form.postal_code.length > 10) return "Postal code looks too long";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    const validationError = validateForm();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      setSaving(false);
      return;
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(
        "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      setAlert({
        type: "success",
        message: "Profile updated successfully",
      });

      setTimeout(() => {
        navigate("/service-provider/dashboard");
      }, 1200);
    } catch (err) {
      console.error(err);
      setAlert({
        type: "error",
        message: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ==============================
     LOADING
     ============================== */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 sm:h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Service Provider Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Keep your details accurate so customers can trust you
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ALERT */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <Input
            label="Your Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            label="Business Name"
            name="business_name"
            value={form.business_name}
            onChange={handleChange}
          />

          <Input
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            helper="Used for customer contact"
          />

          <Input
            label="Address Line"
            name="address_line"
            value={form.address_line}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
            />
            <Input
              label="Province"
              name="province"
              value={form.province}
              onChange={handleChange}
            />
            <Input
              label="Postal Code"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
            />
          </div>

          {/* BIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-black min-h-[100px] sm:min-h-[120px]"
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {form.bio.length}/500
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border px-4 py-2.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="rounded-lg bg-black px-5 py-2.5 sm:py-2 text-sm font-medium text-white
                         hover:bg-gray-800 disabled:opacity-40 transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ==============================
   COMPONENTS
   ============================== */

function Input({ label, helper, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-sm
                   focus:ring-2 focus:ring-black focus:border-black transition
                   h-10 sm:h-11"
      />
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

function Alert({ type, message, onClose }) {
  const styles =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";

  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
