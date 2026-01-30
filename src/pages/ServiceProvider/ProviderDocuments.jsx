import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

const ProviderDocuments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const API_URL = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = JSON.parse(localStorage.getItem("quickfix_user"));
      if (!userData?.sub) throw new Error("User not authenticated");

      const res = await fetch(
        `${API_URL}/documents?cognito_sub=${userData.sub}`,
      );

      if (!res.ok) throw new Error("Failed to load documents");

      setProviderData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPdf = (name = "") => name.toLowerCase().endsWith(".pdf");
  const isImage = (name = "") => /\.(png|jpe?g|webp)$/i.test(name);

  const getVerificationStatusBadge = (status) => {
    const map = {
      VERIFIED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
        text: "Verified",
      },
      PENDING: {
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800",
        text: "Pending",
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-800",
        text: "Rejected",
      },
      INCOMPLETE: {
        icon: AlertCircle,
        color: "bg-gray-100 text-gray-700",
        text: "Incomplete",
      },
    };

    const cfg = map[status] || map.INCOMPLETE;
    const Icon = cfg.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${cfg.color}`}
      >
        <Icon className="w-5 h-5" />
        {cfg.text}
      </div>
    );
  };

  /* -------------------- DOCUMENT CARD -------------------- */
  const DocumentRow = ({ doc }) => (
    <div className="flex items-center gap-4 bg-white border rounded-xl p-4 hover:shadow-md transition">
      {/* Thumbnail */}
      <div className="w-24 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
        {isImage(doc.filename || doc.file_name) ? (
          <img
            src={doc.viewUrl}
            alt=""
            className="object-cover w-full h-full"
          />
        ) : isPdf(doc.filename || doc.file_name) ? (
          <FileText className="w-8 h-8 text-red-500" />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{doc.file_name || doc.filename}</p>
        <p className="text-xs text-gray-400 truncate">{doc.s3_key}</p>
        {doc.uploaded_at && (
          <p className="text-xs text-gray-500 mt-1">
            Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            setPreviewDoc({
              url: doc.viewUrl,
              filename: doc.file_name || doc.filename,
            })
          }
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View
        </button>

        <button
          onClick={() => download(doc)}
          className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const download = async (doc) => {
    const res = await fetch(doc.viewUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name || doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const DocumentCategory = ({ title, docs }) => (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {docs?.length ? (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <DocumentRow key={i} doc={doc} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No documents uploaded</p>
      )}
    </div>
  );

  if (loading)
    return (
      <div className="p-12 text-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto mb-4" />
        Loading documents…
      </div>
    );

  if (error)
    return <div className="p-6 bg-red-50 border rounded-lg">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-semibold truncate">{previewDoc.filename}</h3>
              <button onClick={() => setPreviewDoc(null)}>✕</button>
            </div>
            <div className="flex-1 bg-gray-50">
              {isPdf(previewDoc.filename) && (
                <iframe src={previewDoc.url} className="w-full h-full" />
              )}
              {isImage(previewDoc.filename) && (
                <div className="flex justify-center items-center h-full">
                  <img
                    src={previewDoc.url}
                    className="max-h-full rounded-lg shadow"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border rounded-xl p-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-gray-500">
            {providerData?.provider_name} ({providerData?.provider_id})
          </p>
        </div>
        {getVerificationStatusBadge(providerData?.verification_status)}
      </div>

      <DocumentCategory
        title="Insurance Documents"
        docs={providerData?.documents?.insurance}
      />
      <DocumentCategory
        title="Certifications & Licenses"
        docs={providerData?.documents?.certification}
      />
      <DocumentCategory
        title="Business Registration"
        docs={providerData?.documents?.business_registration}
      />
    </div>
  );
};

export default ProviderDocuments;
