import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  FileType,
  Folder,
  Globe,
  RefreshCw,
  Search,
  Tag,
  Upload,
  User,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { downloadFile } from "../utils/download";

export default function Repository() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [fileName, setFileName] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [description, setDescription] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [region, setRegion] = useState("EU");
  const [file, setFile] = useState(null);

  async function loadItems(showToast = false) {
    setLoading(true);
    try {
      const res = await api.get("/content-items");
      setItems(res.data || []);
      if (showToast)
        toast.success(`Loaded ${res.data?.length || 0} content items`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading content...");

    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("projectRef", projectRef);
      fd.append("region", region);

      const tagArr = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      fd.append("tags", JSON.stringify(tagArr));

      if (file) fd.append("file", file);

      await api.post("/content-items", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset form
      setTitle("");
      setTags("");
      setDescription("");
      setProjectRef("");
      setRegion("EU");
      setFile(null);
      setFileName("");

      toast.update(toastId, {
        render: "Content uploaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Collapse form after successful upload
      setShowUploadForm(false);
      
      // Reload items
      await loadItems();
    } catch (err) {
      console.error("Upload error:", err);
      toast.update(toastId, {
        render:
          err?.response?.data?.message || "Upload failed. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  }

  async function deleteItem(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    const toastId = toast.loading("Deleting item...");

    try {
      await api.delete(`/content-items/${id}`);
      toast.update(toastId, {
        render: `"${title}" deleted successfully`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      await loadItems();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Failed to delete item",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  }

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags &&
        item.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesStatus =
      filterStatus === "ALL" || item.status === filterStatus;
    const matchesType = filterType === "ALL" || item.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statusColors = {
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const typeColors = {
    DOCUMENT: "bg-blue-100 text-blue-800 border-blue-200",
    TEMPLATE: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const regionColors = {
    EU: "bg-blue-50 text-blue-700 border-blue-200",
    ASIA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NA: "bg-purple-50 text-purple-700 border-purple-200",
    GLOBAL: "bg-gray-100 text-gray-700 border-gray-300",
  };

  // Calculate stats from real data
  const totalItems = items.length;
  const approvedItems = items.filter((i) => i.status === "APPROVED").length;
  const pendingItems = items.filter((i) => i.status === "PENDING").length;
  const templateItems = items.filter((i) => i.type === "TEMPLATE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Knowledge Repository
          </h1>
          <p className="text-gray-600 mt-1">
            Upload, search, and manage organizational knowledge assets
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadItems(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats from real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Items</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {totalItems}
              </p>
            </div>
            <Folder className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {approvedItems}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Pending</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {pendingItems}
              </p>
            </div>
            <Clock className="text-amber-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Templates</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {templateItems}
              </p>
            </div>
            <FileType className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Upload Card - Collapsible */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              showUploadForm 
                ? "bg-gradient-to-br from-indigo-100 to-indigo-50" 
                : "bg-gradient-to-br from-blue-100 to-blue-50"
            }`}>
              <Upload className={showUploadForm ? "text-indigo-600" : "text-blue-600"} size={22} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload New Content
              </h2>
              <p className="text-sm text-gray-500">
                {showUploadForm ? "Click to collapse form" : "Click to expand and share knowledge with your organization"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showUploadForm ? (
              <ChevronUp className="text-gray-400" size={20} />
            ) : (
              <ChevronDown className="text-gray-400" size={20} />
            )}
          </div>
        </button>

        {/* Collapsible Form Content */}
        {showUploadForm && (
          <div className="px-6 pb-6 border-t border-gray-100 animate-slideDown">
            <form onSubmit={submit} className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={14} />
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter a descriptive title"
                    required
                    disabled={uploading}
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileType size={14} />
                    Content Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    disabled={uploading}
                  >
                    <option value="DOCUMENT">Document</option>
                    <option value="TEMPLATE">Template</option>
                  </select>
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe size={14} />
                    Region *
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    disabled={uploading}
                  >
                    <option value="EU">Europe</option>
                    <option value="ASIA">Asia</option>
                    <option value="NA">North America</option>
                    <option value="GLOBAL">Global</option>
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag size={14} />
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="react, security, compliance (comma separated)"
                    disabled={uploading}
                  />
                </div>

                {/* Project Reference */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Folder size={14} />
                    Project Reference
                  </label>
                  <input
                    type="text"
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="PROJ-001, CLIENT-ABC, etc."
                    disabled={uploading}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    File Upload (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Upload size={18} className="text-gray-500" />
                      <div className="flex-1">
                        {fileName ? (
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileName}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Choose a file or drag here
                          </p>
                        )}
                      </div>
                    </label>
                    {fileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setFileName("");
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-600"
                        disabled={uploading}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Provide a brief description of this content..."
                  disabled={uploading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    // Reset form
                    setTitle("");
                    setTags("");
                    setDescription("");
                    setProjectRef("");
                    setRegion("EU");
                    setFile(null);
                    setFileName("");
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !title.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload Content
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Knowledge Library
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredItems.length} of {items.length} items
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
                placeholder="Search by title, description, or tags..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
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
            <p className="text-gray-500">
              Fetching knowledge items from repository
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No content found
            </h3>
            <p className="text-gray-500">
              Try uploading content or adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.description || "No description"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        typeColors[item.type] ||
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {item.type || "UNKNOWN"}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        statusColors[item.status] ||
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {item.status || "UNKNOWN"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                  {item.uploaded_by_name && (
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{item.uploaded_by_name}</span>
                    </div>
                  )}
                  {item.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {item.region && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${
                        regionColors[item.region] ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {item.region}
                    </span>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {item.projectRef && (
                      <span className="text-xs text-gray-500">
                        Project:{" "}
                        <span className="font-medium">{item.projectRef}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.file_url && (
                      <button
                        onClick={() =>
                          downloadFile(`http://localhost:5000${item.file_url}`)
                        }
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        title="Download"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}