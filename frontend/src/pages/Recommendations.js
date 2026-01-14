import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  FileType,
  RefreshCw,
  Sparkles,
  Tag,
  Target,
  ThumbsUp,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { downloadFile } from "../utils/download";

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [viewedItems, setViewedItems] = useState(new Set());
  const [likedItems, setLikedItems] = useState(new Set());

  async function loadRecommendations(showToast = false) {
    setLoading(true);
    try {
      const res = await api.get("/recommendations");
      setItems(res.data || []);
      if (res.data?.length > 0 && showToast) {
        toast.success(`Found ${res.data.length} personalized recommendations`);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load recommendations"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  function handleViewItem(id) {
    setViewedItems((prev) => new Set([...prev, id]));
    // You could send analytics to backend here
    console.log(`Viewed recommendation ${id}`);
  }

  function handleLikeItem(id) {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.info("Removed from liked items");
      } else {
        newSet.add(id);
        toast.success("Added to liked items");
      }
      return newSet;
    });
  }

  // Filter items based on type and region
  const filteredItems = items.filter((item) => {
    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesRegion =
      filterRegion === "ALL" || item.region === filterRegion;
    return matchesType && matchesRegion;
  });

  // Get unique regions from actual data
  const uniqueRegions = [...new Set(items.map((item) => item.region))];
  const uniqueTypes = [...new Set(items.map((item) => item.type))];

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

  const confidenceColors = (score) => {
    if (score >= 0.9) return "bg-green-100 text-green-800";
    if (score >= 0.7) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            AI Recommendations
          </h1>
          <p className="text-gray-600 mt-1">
            Personalized content suggestions based on your profile and activity
          </p>
        </div>
        <button
          onClick={() => loadRecommendations(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Recommendations"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">
                Total Recommendations
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {items.length}
              </p>
            </div>
            <Sparkles className="text-purple-600" size={24} />
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
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-800">Liked Items</p>
              <p className="text-2xl font-bold text-pink-900 mt-1">
                {likedItems.size}
              </p>
            </div>
            <ThumbsUp className="text-pink-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Personalized Suggestions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredItems.length} of {items.length} recommendations match
              your filters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              >
                <option value="ALL">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

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
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analyzing your profile...
            </h3>
            <p className="text-gray-500">
              Generating personalized recommendations
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              <Target className="text-purple-600" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No matching recommendations
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or check back later for new content
            </p>
            <button
              onClick={() => {
                setFilterType("ALL");
                setFilterRegion("ALL");
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="group relative">
                {/* Confidence Score Indicator */}
                {item.confidence_score && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${confidenceColors(
                        item.confidence_score
                      )}`}
                    >
                      {Math.round(item.confidence_score * 100)}% match
                    </div>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          item.type === "DOCUMENT"
                            ? "bg-gradient-to-br from-blue-100 to-blue-50"
                            : "bg-gradient-to-br from-purple-100 to-purple-50"
                        }`}
                      >
                        {item.type === "DOCUMENT" ? (
                          <FileText className="text-blue-600" size={24} />
                        ) : (
                          <FileType className="text-purple-600" size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
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
                          {item.status && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Recommendation Reason (if available) */}
                  {item.recommendation_reason && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                      <div className="flex items-start gap-2">
                        <Zap
                          size={16}
                          className="text-purple-600 mt-0.5 flex-shrink-0"
                        />
                        <p className="text-sm text-purple-800 font-medium">
                          {item.recommendation_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
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
                    {viewedItems.has(item.id) && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Eye size={14} />
                        <span>Viewed</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.file_url && (
                        <a
                          href={`http://localhost:5000${item.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleViewItem(item.id)}
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                        >
                          <BookOpen size={16} />
                          Open Content
                        </a>
                      )}
                      {item.file_url && (
                        <button
                          onClick={() =>
                            downloadFile(
                              `http://localhost:5000${item.file_url}`
                            )
                          }
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                          title="Download"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLikeItem(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          likedItems.has(item.id)
                            ? "text-pink-600 bg-pink-50 hover:bg-pink-100"
                            : "text-gray-400 hover:text-pink-600 hover:bg-pink-50"
                        }`}
                        title={
                          likedItems.has(item.id)
                            ? "Remove from liked"
                            : "Add to liked"
                        }
                      >
                        <ThumbsUp
                          size={18}
                          fill={
                            likedItems.has(item.id) ? "currentColor" : "none"
                          }
                        />
                      </button>

                      {item.file_url && (
                        <a
                          href={`http://localhost:5000${item.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleViewItem(item.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
                        >
                          <ChevronRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="text-white" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h3>
              <p className="text-sm text-gray-600">
                How recommendations are personalized for you
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-purple-600" />
                <h4 className="font-medium text-gray-900">Based on Profile</h4>
              </div>
              <p className="text-sm text-gray-600">
                Your role, expertise, and region influence what content is
                suggested
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-600" />
                <h4 className="font-medium text-gray-900">Trend Analysis</h4>
              </div>
              <p className="text-sm text-gray-600">
                Popular content in your department and recent uploads are
                prioritized
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-purple-600" />
                <h4 className="font-medium text-gray-900">
                  Continuous Learning
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                The AI improves suggestions based on your interactions with
                recommended content
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
