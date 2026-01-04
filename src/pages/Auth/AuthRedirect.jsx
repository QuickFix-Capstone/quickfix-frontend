// import { fetchAuthSession } from "aws-amplify/auth";
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// const ME_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider";

// export default function AuthRedirect() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     let cancelled = false;

//     const routeUser = async () => {
//       try {
//         const session = await fetchAuthSession();

//         const accessToken = session.tokens?.accessToken?.toString();

//         // ❌ Not authenticated
//         if (!accessToken) {
//           if (!cancelled) navigate("/login", { replace: true });
//           return;
//         }

//         const res = await fetch(ME_API, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         });

//         // ❌ Not onboarded → onboarding
//         if (res.status === 404) {
//           if (!cancelled) navigate("/onboarding", { replace: true });
//           return;
//         }

//         // ❌ Unauthorized / expired token
//         if (res.status === 401 || res.status === 403) {
//           if (!cancelled) navigate("/login", { replace: true });
//           return;
//         }

//         // ❌ Unexpected error
//         if (!res.ok) {
//           console.error("Unexpected auth error:", res.status);
//           if (!cancelled) navigate("/login", { replace: true });
//           return;
//         }

//         // ✅ Onboarded
//         if (!cancelled)
//           navigate("/service-provider/dashboard", { replace: true });

//       } catch (err) {
//         console.error("Auth redirect failed:", err);
//         if (!cancelled) navigate("/login", { replace: true });
//       }
//     };

//     routeUser();

//     return () => {
//       cancelled = true;
//     };
//   }, [navigate]);

//   return <p>Checking your account…</p>;
// }

// import { fetchAuthSession } from "aws-amplify/auth";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const ME_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider";

// export default function AuthRedirect() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     const routeUser = async () => {
//       try {
//         // 🔑 FORCE session hydration (CRITICAL)
//         const session = await fetchAuthSession({ forceRefresh: true });

//         const idToken = session.tokens?.idToken?.toString();

//         // ❌ Not authenticated
//         if (!idToken) {
//           navigate("/login", { replace: true });
//           return;
//         }

//         // 🔎 Check onboarding status
//         const res = await fetch(ME_API, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${idToken}`,
//           },
//         });

//         // ❌ Not onboarded → onboarding
//         if (res.status === 404) {
//           if (!cancelled) navigate("/onboarding", { replace: true });
//           return;
//         }

//         // ❌ Auth failure
//         if (res.status === 401 || res.status === 403) {
//           if (!cancelled) navigate("/login", { replace: true });
//           return;
//         }

//         // ❌ Unexpected backend error
//         if (!res.ok) {
//           console.error("Unexpected auth error:", res.status);
//           if (!cancelled) navigate("/login", { replace: true });
//           return;
//         }

//         // ✅ Onboarded service provider
//         if (!cancelled)
//           navigate("/service-provider/dashboard", { replace: true });
//       } catch (err) {
//         console.error("Auth redirect failed:", err);
//         if (!cancelled) navigate("/login", { replace: true });
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     routeUser();

//     return () => {
//       cancelled = true;
//     };
//   }, [navigate]);

//   return (
//     <p className="text-center text-sm text-gray-500">Checking your account…</p>
//   );
// }

import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ME_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider";

export default function AuthRedirect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const routeUser = async () => {
      try {
        // 🔑 Force token hydration
        const session = await fetchAuthSession({ forceRefresh: true });

        const accessToken = session.tokens?.accessToken?.toString();

        // ❌ Not authenticated
        if (!accessToken) {
          navigate("/login", { replace: true });
          return;
        }

        // 🔎 Check onboarding status
        const res = await fetch(ME_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.status === 404) {
          navigate("/onboarding", { replace: true });
          return;
        }

        if (res.status === 401 || res.status === 403) {
          navigate("/login", { replace: true });
          return;
        }

        if (!res.ok) {
          console.error("Unexpected auth error:", res.status);
          navigate("/login", { replace: true });
          return;
        }

        // ✅ Authenticated & onboarded
        navigate("/service-provider/dashboard", { replace: true });
      } catch (err) {
        console.error("Auth redirect failed:", err);
        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    routeUser();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <p className="text-center text-sm text-gray-500">
        Checking your account…
      </p>
    );
  }

  return null;
}
