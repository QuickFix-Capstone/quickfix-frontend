import { API_BASE } from "./config";

// -------------------- SERVICE OFFERINGS --------------------

export async function getAllOfferings() {
    const res = await fetch(`${API_BASE}/service-offerings`);
    return res.json();
}

export async function getOfferingsByProvider(providerId) {
    const res = await fetch(`${API_BASE}/service-offerings?provider_id=${providerId}`);
    return res.json();
}

export async function createServiceOffering(data) {
    try {
        const response = await fetch(`${API_BASE}/service-offerings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        return await response.json();
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}

export async function updateServiceOffering(offeringId, data) {
    const res = await fetch(`${API_BASE}/service-offerings/${offeringId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}
