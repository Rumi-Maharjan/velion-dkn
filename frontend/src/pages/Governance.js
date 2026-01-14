import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  FileType,
  RefreshCw,
  Search,
  Tag,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { downloadFile } from "../utils/download";

export default function Governance() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await api.get("/governance/pending");
      setItems(res.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load pending items"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function approveItem(id, title) {
    setProcessingId(id);
    const toastId = toast.loading(`Approving "${title}"...`);

    try {
      await api.post(`/governance/${id}/approve`);

      toast.update(toastId, {
        render: `"${title}" approved successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      await loadItems();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Failed to approve item",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectItem(id, title) {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessingId(id);
    const toastId = toast.loading(`Rejecting "${title}"...`);

    try {
      await api.post(`/governance/${id}/reject`, { reason: rejectReason });

      toast.update(toastId, {
        render: `"${title}" rejected with feedback provided`,
        type: "warning",
        isLoading: false,
        autoClose: 3000,
      });

      setShowRejectModal(null);
      setRejectReason("");
      await loadItems();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Failed to reject item",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion =
      filterRegion === "ALL" || item.region === filterRegion;
    const matchesType = filterType === "ALL" || item.type === filterType;

    return matchesSearch && matchesRegion && matchesType;
  });

  const regionColors = {
    EU: "bg-blue-50 text-blue-700 border-blue-200",
    ASIA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NA: "bg-purple-50 text-purple-700 border-purple-200",
    GLOBAL: "bg-gray-100 text-gray-700 border-gray-300",
  };

  const typeColors = {
    DOCUMENT: "bg-blue-100 text-blue-800 border-blue-200",
    TEMPLATE: "bg-purple-100 text-purple-800 border-purple-200",
  };

  // Get unique regions for filter
  const uniqueRegions = [...new Set(items.map((item) => item.region))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Content Governance
          </h1>
          <p className="text-gray-600 mt-1">
            Review and validate submitted knowledge content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              loading ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {loading ? (
              <>
                <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                {items.length} pending review
              </>
            )}
          </div>
          <button
            onClick={loadItems}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Pending Review
              </p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {items.length}
              </p>
            </div>
            <Clock className="text-amber-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Documents</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {items.filter((i) => i.type === "DOCUMENT").length}
              </p>
            </div>
            <FileText className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Templates</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {items.filter((i) => i.type === "TEMPLATE").length}
              </p>
            </div>
            <FileType className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Content
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredItems.length} of {items.length} items need review
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full"
                placeholder="Search pending items..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              >
                <option value="ALL">All Regions</option>
                {uniqueRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="DOCUMENT">Documents</option>
                <option value="TEMPLATE">Templates</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Items */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <RefreshCw className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading content...
            </h3>
            <p className="text-gray-500">Fetching items pending review</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500">
              No pending items require review at this time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                        {item.type === "DOCUMENT" ? (
                          <FileText className="text-amber-600" size={20} />
                        ) : (
                          <FileType className="text-amber-600" size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                              typeColors[item.type] ||
                              "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                              regionColors[item.region] ||
                              "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {item.region}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                            AWAITING REVIEW
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-gray-600 text-sm mt-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  {item.uploaded_by_name && (
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>
                        Uploaded by:{" "}
                        <span className="font-medium">
                          {item.uploaded_by_name}
                        </span>
                      </span>
                    </div>
                  )}
                  {item.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        Submitted:{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag size={14} />
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Preview and Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {item.file_url && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:5000${item.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <Eye size={16} />
                          Preview Content
                        </a>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() =>
                            downloadFile(
                              `http://localhost:5000${item.file_url}`
                            )
                          }
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                          title="Download"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveItem(item.id, item.title)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === item.id ? (
                        <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(item.id)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Provide Rejection Reason
            </h3>
            <p className="text-gray-600 mb-4">
              Please explain why this content is being rejected. This feedback
              will be sent to the uploader.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none mb-4 resize-none"
              placeholder="Enter specific feedback for improvement..."
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={processingId === showRejectModal}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = items.find((i) => i.id === showRejectModal);
                  if (item) rejectItem(item.id, item.title);
                }}
                disabled={
                  !rejectReason.trim() || processingId === showRejectModal
                }
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === showRejectModal ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Rejecting...
                  </span>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
