import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { downloadFile } from "../utils/download";

export default function Collaboration() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false); // New state

  // Get current user - using velion_user from your login
  const currentUser = JSON.parse(localStorage.getItem("velion_user") || "null");
  const currentUserId = currentUser?.id;

  // Create workspace
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Members
  const [members, setMembers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);

  // Content sharing
  const [contentQuery, setContentQuery] = useState("");
  const [contentSuggestions, setContentSuggestions] = useState([]);
  const [shareNote, setShareNote] = useState("");

  // Messages + shared content
  const [messages, setMessages] = useState([]);
  const [shared, setShared] = useState([]);
  const [messageText, setMessageText] = useState("");

  const chatEndRef = useRef(null);

  /* ---------------- HELPERS ---------------- */

  function isSameSender(a, b) {
    return a && b && a.authorId && b.authorId && a.authorId === b.authorId;
  }

  const timeline = useMemo(() => {
    const m = (messages || []).map((x) => ({
      kind: "message",
      id: `m-${x.id}`,
      author: x.author_name,
      authorId: x.user_id,
      text: x.message,
      at: x.created_at,
    }));

    const s = (shared || []).map((x) => ({
      kind: "share",
      id: `s-${x.workspace_id || "ws"}-${x.id}`,
      author: x.shared_by_name,
      authorId: x.shared_by,
      text: x.note || "",
      fileUrl: x.file_url,
      title: x.title,
      status: x.status,
      type: x.type || "DOCUMENT",
      at: x.shared_at,
    }));

    return [...m, ...s].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [messages, shared]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [timeline.length]);

  /* ---------------- LOADERS ---------------- */

  async function loadWorkspaces(showToast = false) {
    setLoading(true);
    try {
      const res = await api.get("/collaboration/workspaces");
      setWorkspaces(res.data);
      if (showToast) toast.success("Workspaces loaded successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceData(workspaceId) {
    try {
      const [m, msg, c] = await Promise.all([
        api.get(`/collaboration/workspaces/${workspaceId}/members`),
        api.get(`/collaboration/workspaces/${workspaceId}/messages`),
        api.get(`/collaboration/workspaces/${workspaceId}/content`),
      ]);

      setMembers(m.data);
      setMessages(msg.data);
      setShared(c.data);
    } catch (err) {
      toast.error("Failed to load workspace data");
    }
  }

  async function selectWorkspace(ws) {
    try {
      setSelected(ws);
      await loadWorkspaceData(ws.id);
    } catch (err) {
      toast.error("Failed to select workspace");
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  /* ---------------- WORKSPACE ---------------- */

  async function createWorkspace(e) {
    e.preventDefault();
    if (!wsName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setCreating(true);
    try {
      await api.post("/collaboration/workspaces", {
        name: wsName,
        description: wsDesc,
      });

      setWsName("");
      setWsDesc("");
      setShowCreateForm(false); // Close form after creation
      toast.success(`Workspace "${wsName}" created successfully`);
      await loadWorkspaces();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  /* ---------------- MEMBER SEARCH ---------------- */

  async function searchUsers(q) {
    setUserQuery(q);
    if (!q.trim()) return setUserSuggestions([]);

    const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    setUserSuggestions(res.data);
  }

  async function addMember(user) {
    if (!selected) return;

    try {
      await api.post(`/collaboration/workspaces/${selected.id}/members`, {
        userId: user.id,
      });

      setUserQuery("");
      setUserSuggestions([]);
      toast.success(`Added ${user.name} to workspace`);
      await loadWorkspaceData(selected.id);
    } catch (err) {
      toast.error("Failed to add member");
    }
  }

  /* ---------------- CONTENT SEARCH ---------------- */

  async function searchContent(q) {
    setContentQuery(q);
    if (!q.trim()) return setContentSuggestions([]);

    const res = await api.get(
      `/content-items/search?q=${encodeURIComponent(q)}`
    );
    setContentSuggestions(res.data);
  }

  async function shareContent(item) {
    if (!selected) return;

    try {
      await api.post(`/collaboration/workspaces/${selected.id}/share`, {
        contentId: item.id,
        note: shareNote,
      });

      setContentQuery("");
      setContentSuggestions([]);
      setShareNote("");
      toast.success(`Shared "${item.title}" in workspace`);
      await loadWorkspaceData(selected.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  }

  /* ---------------- MESSAGES ---------------- */

  async function sendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || !selected) return;

    try {
      await api.post(`/collaboration/workspaces/${selected.id}/messages`, {
        message: messageText,
      });

      setMessageText("");
      await loadWorkspaceData(selected.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  }

  const statusColors = {
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  const typeColors = {
    DOCUMENT: "bg-blue-100 text-blue-800 border-blue-200",
    TEMPLATE: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Collaboration Workspaces
          </h1>
          <p className="text-gray-600 mt-1">
            Team collaboration with shared documents and real-time messaging
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} />
            {showCreateForm ? "Cancel" : "Create Workspace"}
            {showCreateForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            onClick={() => loadWorkspaces(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Create Workspace Card - Now Collapsible */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <Plus className="text-blue-600" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Workspace
              </h2>
              <p className="text-sm text-gray-500">
                Start a new collaboration space for your team
              </p>
            </div>
          </div>

          <form onSubmit={createWorkspace} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., React Development Team"
                  required
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="What's this workspace about?"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !wsName.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus size={18} />
                    Create Workspace
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Collaboration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Workspaces
            </h2>
            <span className="text-sm text-gray-500">
              {workspaces.length} total
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <RefreshCw className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500">Loading workspaces...</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="text-gray-400" size={28} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No workspaces yet
              </h3>
              <p className="text-gray-500">
                Create your first workspace to start collaborating
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === ws.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {ws.description || "No description"}
                      </p>
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        ws.my_role === "owner" || ws.my_role === "Owner"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ws.my_role}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Active workspace</span>
                    </div>
                    {selected?.id === ws.id && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <span>Selected</span>
                        <ChevronRight size={12} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Details */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Workspace
              </h3>
              <p className="text-gray-600">
                Choose a workspace from the list to start collaborating with
                your team
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workspace Header */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selected.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selected.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {members.length} members
                      </p>
                      <p className="text-xs text-gray-500">Active workspace</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Settings className="text-blue-600" size={18} />
                    </div>
                  </div>
                </div>

                {/* Members Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Users size={18} />
                      Team Members
                    </h3>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => searchUsers(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64"
                        placeholder="Add member..."
                      />
                      {userSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                          {userSuggestions.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => addMember(user)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                                  <Users className="text-blue-600" size={14} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {user.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <UserPlus size={16} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            member.workspace_role === "owner" ||
                            member.workspace_role === "Owner"
                              ? "bg-gradient-to-br from-green-100 to-green-50"
                              : "bg-gradient-to-br from-blue-100 to-blue-50"
                          }`}
                        >
                          <Users
                            className={
                              member.workspace_role === "owner" ||
                              member.workspace_role === "Owner"
                                ? "text-green-600"
                                : "text-blue-600"
                            }
                            size={16}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          {member.workspace_role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share Content Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Share2 size={18} />
                    Share Content
                  </h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={contentQuery}
                        onChange={(e) => searchContent(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Search documents to share..."
                      />
                    </div>

                    {contentSuggestions.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Select content to share:
                        </p>
                        <div className="space-y-2">
                          {contentSuggestions.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => shareContent(item)}
                              className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                      item.type === "DOCUMENT"
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : "bg-purple-100 text-purple-800 border-purple-200"
                                    }`}
                                  >
                                    {item.type}
                                  </span>
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                      statusColors[item.status] ||
                                      "bg-gray-100 text-gray-800 border-gray-200"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                              <Share2 size={16} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={shareNote}
                      onChange={(e) => setShareNote(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                      placeholder="Add a note about why you're sharing this (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Chat Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={20} />
                    Workspace Chat
                  </h3>
                  <div className="text-sm text-gray-500">
                    {timeline.length}{" "}
                    {timeline.length === 1 ? "message" : "messages"}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto mb-6 space-y-4 pr-2">
                  {timeline.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <MessageSquare size={48} className="mb-4 text-gray-300" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    timeline.map((item, idx) => {
                      const prev = timeline[idx - 1];
                      const showHeader = !isSameSender(prev, item);
                      const isYou = item.authorId === currentUserId;
                      const isShare = item.kind === "share";

                      return (
                        <div
                          key={item.id}
                          className={`flex ${
                            isYou ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] ${
                              isYou ? "items-end" : "items-start"
                            } flex flex-col`}
                          >
                            {showHeader && (
                              <div
                                className={`text-xs mb-1 px-2 ${
                                  isYou ? "text-right" : "text-left"
                                }`}
                              >
                                <span
                                  className={`font-medium ${
                                    isYou ? "text-blue-600" : "text-gray-600"
                                  }`}
                                >
                                  {isYou ? "You" : item.author}
                                </span>
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isYou
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-900 rounded-bl-none"
                              }`}
                            >
                              {isShare ? (
                                <div className="space-y-2">
                                  <div
                                    className={`flex items-center gap-2 ${
                                      isYou ? "text-blue-100" : "text-gray-500"
                                    }`}
                                  >
                                    <Share2 size={14} />
                                    <span className="text-sm">
                                      Shared a document
                                    </span>
                                  </div>
                                  <div
                                    className={`p-3 rounded-lg ${
                                      isYou ? "bg-blue-500/30" : "bg-white"
                                    } border ${
                                      isYou
                                        ? "border-blue-400/30"
                                        : "border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {item.type === "DOCUMENT" ? (
                                        <FileText
                                          size={16}
                                          className={
                                            isYou
                                              ? "text-white"
                                              : "text-blue-600"
                                          }
                                        />
                                      ) : (
                                        <FileText
                                          size={16}
                                          className={
                                            isYou
                                              ? "text-white"
                                              : "text-purple-600"
                                          }
                                        />
                                      )}
                                      <p className="font-semibold">
                                        {item.title}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full border ${
                                          isYou
                                            ? "bg-blue-500/50 text-white border-blue-400/50"
                                            : statusColors[item.status] ||
                                              "bg-gray-100 text-gray-800 border-gray-200"
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                      <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full border ${
                                          isYou
                                            ? "bg-blue-500/50 text-white border-blue-400/50"
                                            : typeColors[item.type] ||
                                              "bg-gray-100 text-gray-800 border-gray-200"
                                        }`}
                                      >
                                        {item.type}
                                      </span>
                                    </div>
                                    {item.text && (
                                      <p
                                        className={`text-sm ${
                                          isYou
                                            ? "text-blue-100"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {item.text}
                                      </p>
                                    )}
                                    {item.fileUrl && (
                                      <button
                                        onClick={() =>
                                          downloadFile(
                                            `${
                                              process.env
                                                .REACT_APP_API_ORIGIN || ""
                                            }${item.fileUrl}`
                                          )
                                        }
                                        className={`inline-flex items-center gap-1 text-sm mt-2 ${
                                          isYou
                                            ? "text-white hover:text-blue-200"
                                            : "text-blue-600 hover:text-blue-700"
                                        }`}
                                        title="Download File"
                                      >
                                        <Download size={14} />
                                        Download File
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">
                                  {item.text}
                                </p>
                              )}
                            </div>

                            <div
                              className={`text-xs mt-1 px-2 ${
                                isYou ? "text-right" : "text-left"
                              } text-gray-500`}
                            >
                              {new Date(item.at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none pr-12"
                      placeholder="Type your message here..."
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    <Send size={18} />
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}