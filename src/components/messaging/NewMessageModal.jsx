// src/components/messaging/NewMessageModal.jsx
import React, { useState, useEffect } from "react";
import { X, Search, MessageSquare, Star } from "lucide-react";
import Button from "../UI/Button";
import { createConversation } from "../../api/messaging";

/**
 * Modal for starting a new conversation with a service provider
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onConversationCreated - Callback when conversation is created
 */
export default function NewMessageModal({ isOpen, onClose, onConversationCreated }) {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch providers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      setSearchQuery("");
      setError(null);
    }
  }, [isOpen]);

  // Filter providers when search query changes
  useEffect(() => {
    filterProviders();
  }, [providers, searchQuery]);

  /**
   * Fetch all service providers
   */
  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_all_service_offering"
      );

      if (res.ok) {
        const data = await res.json();
        // Convert S3 paths to full URLs and group by provider
        const servicesWithFullUrls = (data.items || []).map((service) => ({
          ...service,
          main_image_url: service.main_image_url
            ? `https://quickfix-app-files.s3.us-east-2.amazonaws.com/${service.main_image_url}`
            : null,
        }));

        // Group services by provider and get unique providers
        const providerMap = new Map();
        servicesWithFullUrls.forEach((service) => {
          if (!providerMap.has(service.provider_id)) {
            providerMap.set(service.provider_id, {
              provider_id: service.provider_id,
              provider_name: service.provider_name,
              service_offering_id: service.service_offering_id,
              main_image_url: service.main_image_url,
              category: service.category,
              rating: service.rating,
              title: service.title,
            });
          }
        });

        setProviders(Array.from(providerMap.values()));
      } else {
        setError("Failed to load service providers");
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError("Failed to load service providers. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Filter providers based on search query
   */
  function filterProviders() {
    if (!searchQuery.trim()) {
      setFilteredProviders(providers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = providers.filter(
      (provider) =>
        provider.provider_name.toLowerCase().includes(query) ||
        provider.title.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query)
    );

    setFilteredProviders(filtered);
  }

  /**
   * Handle provider selection - create conversation
   * @param {Object} provider
   */
  async function handleSelectProvider(provider) {
    try {
      setCreating(true);
      setError(null);

      const conversation = await createConversation(
        provider.provider_id,
        provider.service_offering_id
      );

      // Notify parent component
      onConversationCreated(conversation);
      onClose();
    } catch (err) {
      // If conversation already exists (409), still notify parent to navigate
      if (err.status === 409 && err.conversationId) {
        onConversationCreated({ conversationId: err.conversationId });
        onClose();
      } else {
        console.error("Failed to create conversation:", err);
        setError("Failed to start conversation. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                New Message
              </h2>
              <p className="text-sm text-neutral-500">
                Select a service provider to message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by provider name, service, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Provider List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600"></div>
              <p className="mt-3 text-sm text-neutral-500">Loading providers...</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-600">
                {searchQuery ? "No providers found" : "No providers available"}
              </p>
              {searchQuery && (
                <p className="mt-1 text-xs text-neutral-400">
                  Try adjusting your search query
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.provider_id}
                  onClick={() => handleSelectProvider(provider)}
                  disabled={creating}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Provider Image */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                      {provider.main_image_url ? (
                        <img
                          src={provider.main_image_url}
                          alt={provider.provider_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {provider.provider_name}
                      </h3>
                      <p className="mt-0.5 text-sm text-neutral-600 truncate">
                        {provider.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-neutral-700">
                            {provider.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {provider.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} available
            </span>
            <Button onClick={onClose} variant="outline" className="px-4 py-2">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
