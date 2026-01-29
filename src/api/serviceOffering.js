// import { fetchAuthSession } from "aws-amplify/auth";

// const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

// export async function createServiceOffering(payload) {
//   const session = await fetchAuthSession();
//   const token = session.tokens?.accessToken?.toString();

//   if (!token) {
//     throw new Error("User not authenticated");
//   }

//   const res = await fetch(`${API_BASE}/service-offerings`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json();

//   if (!res.ok) {
//     throw new Error(data.error || "Failed to create service offering");
//   }

//   return data;
// }


import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

/* =========================
   CREATE SERVICE OFFERING
========================= */
export async function createServiceOffering(payload) {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(`${API_BASE}/service-offerings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create service offering");
  }

  return data;
}

/* =========================
   UPDATE SERVICE OFFERING
========================= */
export async function updateServiceOffering(offeringId, payload) {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(
    `${API_BASE}/service-offerings/${offeringId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update service offering");
  }

  return data;
}
