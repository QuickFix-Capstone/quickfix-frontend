import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

export default function MyJobApplicationsWidget() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/applications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        setApplications(data.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          My Job Applications
        </h3>

        <button
          onClick={() => navigate("/service-provider/applications")}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 self-start sm:self-auto"
        >
          View all →
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <p className="text-sm text-gray-500">
          You haven’t applied to any jobs yet.
        </p>
      ) : (
        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-72 overflow-y-auto">
          {applications.map((app) => (
            <div
              key={app.application_id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 sm:p-3 hover:bg-gray-100 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {app.title}
                </p>

                <span
                  className={`self-start sm:self-auto shrink-0 rounded-full px-2 sm:px-2.5 py-0.5 text-xs font-medium ${
                    app.application_status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : app.application_status === "ACCEPTED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {app.application_status}
                </span>
              </div>

              <div className="mt-1.5 sm:mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Proposed: ${app.proposed_price}</span>
                <span>{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
