import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import OfferingCard from "../../components/UI/OfferingCards";

export default function ServiceProviderDashboard() {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        setError("");

        // 🔐 Get Cognito ID token
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        // 🌐 Call backend
        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service-offerings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load service offerings");
        }

        const data = await res.json();
        setOfferings(data.items || []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">Loading your services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Service Offerings</h1>

        <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
          + Create New
        </button>
      </div>

      {offerings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          You haven’t created any service offerings yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <OfferingCard
              key={offering.service_offering_id}
              offering={offering}
            />
          ))}
        </div>
      )}
    </div>
  );
}
