import React, { useState } from "react";
import {
    getOfferingsByProvider,
    updateServiceOffering,
} from "../api/quickfix";

export default function ServiceProviderDashboard() {
    const [providerId, setProviderId] = useState("");
    const [offerings, setOfferings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [message, setMessage] = useState("");

    const fetchOfferings = async () => {
        setLoading(true);
        setMessage("");

        try {
            const data = await getOfferingsByProvider(providerId);
            setOfferings(data);
        } catch (err) {
            setMessage("Failed to load offerings.");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (o) => {
        setEditId(o.offering_id);
        setEditData(o);
    };

    const saveEdit = async () => {
        try {
            await updateServiceOffering(editId, editData);
            setMessage("Service updated!");
            alert("Service updated!");
            setEditId(null);
            fetchOfferings();
        } catch (err) {
            setMessage("Error saving changes.");
            alert("Error saving changes.");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 py-8">
            <div className="mx-auto max-w-4xl px-4 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">My Service Offerings</h1>
                </div>

                {/* Provider ID + Load Button */}
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 space-y-4">
                    <label className="text-sm text-neutral-600">Provider ID</label>

                    <input
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 
                       outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Enter your provider ID"
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                    />

                    <button
                        onClick={fetchOfferings}
                        className="inline-flex items-center gap-2 rounded-2xl bg-black text-white 
                       px-4 py-2 shadow-sm hover:shadow transition active:scale-[.99]">
                        {loading ? "Loading..." : "Load My Services"}
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className="rounded-xl bg-neutral-100 border border-neutral-300 p-4 text-sm">
                        {message}
                    </div>
                )}

                {/* Services List */}
                <div className="space-y-6">
                    {offerings.map((o) => (
                        <div
                            key={o.offering_id}
                            className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 space-y-3"
                        >
                            {editId === o.offering_id ? (
                                <>
                                    {/* TITLE */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-neutral-600">Title</label>
                                        <input
                                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none 
                                 focus:ring-2 focus:ring-black/20"
                                            value={editData.title}
                                            onChange={(e) =>
                                                setEditData({ ...editData, title: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* DESCRIPTION */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-neutral-600">Description</label>
                                        <textarea
                                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none 
                                 focus:ring-2 focus:ring-black/20 min-h-[100px]"
                                            value={editData.description}
                                            onChange={(e) =>
                                                setEditData({ ...editData, description: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* PRICE */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-neutral-600">Price ($)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none 
                                 focus:ring-2 focus:ring-black/20"
                                            value={editData.price}
                                            onChange={(e) =>
                                                setEditData({ ...editData, price: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={saveEdit}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-black text-white px-4 py-2 
                                 shadow-sm hover:shadow transition active:scale-[.99]"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditId(null)}
                                            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 
                                 border border-neutral-300 hover:bg-neutral-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* VIEW MODE */}
                                    <div className="flex justify-between">
                                        <h3 className="text-lg font-semibold">{o.title}</h3>
                                        <p className="text-lg font-bold">${o.price}</p>
                                    </div>

                                    <p className="text-neutral-600">{o.description}</p>

                                    <button
                                        onClick={() => startEdit(o)}
                                        className="mt-2 inline-flex items-center gap-2 rounded-2xl px-4 py-2 
                               border border-neutral-300 hover:bg-neutral-50 transition"
                                    >
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
