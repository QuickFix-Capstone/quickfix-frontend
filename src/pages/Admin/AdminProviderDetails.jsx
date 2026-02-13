import { buildImageUrl } from "../../api/image";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  FileText,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  ArrowLeft,
  MapPin,
  Mail,
  Shield,
  Award,
  FileCheck,
  Loader2,
  X,
  Briefcase,
  DollarSign,
  Star,
} from "lucide-react";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

export default function AdminServiceProviderDetails() {
  const { provider_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [serviceOfferings, setServiceOfferings] = useState([]);
  const [approving, setApproving] = useState(false);
  const [actionError, setActionError] = useState(null);

  /* ===================== LOAD PROVIDER DETAILS ===================== */
  useEffect(() => {
    loadProviderDetails();
  }, []);

  const loadProviderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${API_BASE}/admin/service-providers-details/${provider_id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const json = await res.json();

      if (res.status === 401 || res.status === 403) {
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error(json.error || "Failed to load provider");

      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== VERIFIED CHECK ===================== */
  const isVerified =
    data?.provider?.verification_status?.toUpperCase() === "APPROVED" ||
    data?.provider?.verification_status?.toUpperCase() === "VERIFIED";

  useEffect(() => {
    if (isVerified) {
      setServiceOfferings(data?.service_offerings || []);
    } else {
      setServiceOfferings([]);
    }
  }, [data, isVerified]);

  /* ===================== APPROVE ===================== */
  const handleApprove = async () => {
    try {
      setApproving(true);
      setActionError(null);

      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/admin/verifing-service-provider`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider_id, action: "VERIFY" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");

      await loadProviderDetails();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setApproving(false);
    }
  };

  /* ===================== DOCUMENT COMPONENTS ===================== */
  const DocumentRow = ({ doc }) => {
    const isPdf = doc.filename?.toLowerCase().endsWith(".pdf");
    const isImage = /\.(png|jpe?g|webp)$/i.test(doc.filename || "");

    return (
      <div className="flex items-center gap-3 border-2 border-gray-100 rounded-xl p-4 bg-white">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={doc.view_url} className="w-full h-full object-cover" />
          ) : isPdf ? (
            <FileText className="w-6 h-6 text-red-500" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>

        <p className="flex-1 text-sm truncate">{doc.filename}</p>

        <button
          onClick={() => setPreviewDoc(doc)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const DocSection = ({ title, docs, icon: Icon }) => (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {docs?.length ? (
        <div className="space-y-3">
          {docs.map((d, i) => (
            <DocumentRow key={i} doc={d} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-6">No documents uploaded</p>
      )}
    </div>
  );

  /* ===================== STATES ===================== */
  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border rounded-xl">
        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const { provider, documents, can_approve } = data;
  const address = `${provider.address_line}, ${provider.city}, ${provider.province} ${provider.postal_code}`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white border rounded-xl p-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">{provider.business_name}</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <Mail className="w-4 h-4" /> {provider.email}
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {address}
          </p>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="w-5 h-5 fill-current" />
          {provider.average_rating || 0} ({provider.total_review_count || 0})
        </div>
      </div>

      {/* Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DocSection
          title="Insurance"
          docs={documents.insurance}
          icon={Shield}
        />
        <DocSection
          title="Certifications"
          docs={documents.certification}
          icon={Award}
        />
        <DocSection
          title="Business Registration"
          docs={documents.business_registration}
          icon={FileCheck}
        />
      </div>

      {/* Approve */}
      {!isVerified && (
        <div className="bg-white border rounded-xl p-6 flex justify-end">
          <button
            onClick={handleApprove}
            disabled={!can_approve || approving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            {approving ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {/* Service Offerings */}
      {/* Service Offerings */}
      {isVerified && (
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Service Offerings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceOfferings.map((o) => {
              const imageUrl = buildImageUrl(o.main_image_url);

              return (
                <div
                  key={o.service_offering_id}
                  className="border-2 border-gray-100 rounded-xl overflow-hidden bg-white"
                >
                  {/* IMAGE */}
                  <div className="h-40 bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={o.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-neutral-900">
                      {o.title}
                    </h3>

                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {o.description || "No description provided"}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {o.price}
                      </span>

                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        {o.rating || provider.average_rating || 0}
                      </span>
                    </div>

                    <span className="inline-block text-xs bg-gray-100 px-2 py-1 rounded">
                      {o.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold truncate">{previewDoc.filename}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 bg-gray-50 flex justify-center items-center">
              {previewDoc.filename?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`${previewDoc.view_url}#toolbar=0&navpanes=0`}
                  className="w-full h-[70vh] border-0"
                  title={previewDoc.filename}
                />
              ) : (
                <img
                  src={previewDoc.view_url}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
