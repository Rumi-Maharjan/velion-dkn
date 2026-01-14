import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

export default function Collaboration() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState(null);

  /* ---------------- CURRENT USER ---------------- */
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id;

  /* ---------------- CREATE WORKSPACE ---------------- */
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");

  /* ---------------- MEMBERS ---------------- */
  const [members, setMembers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);

  /* ---------------- CONTENT ---------------- */
  const [contentQuery, setContentQuery] = useState("");
  const [contentSuggestions, setContentSuggestions] = useState([]);
  const [shareNote, setShareNote] = useState("");

  /* ---------------- CHAT ---------------- */
  const [messages, setMessages] = useState([]);
  const [shared, setShared] = useState([]);
  const [messageText, setMessageText] = useState("");

  const chatEndRef = useRef(null);

  /* ---------------- HELPERS ---------------- */
  function isSameSender(a, b) {
    return a?.authorId && b?.authorId && a.authorId === b.authorId;
  }

  /* ---------------- TIMELINE (FIXED) ---------------- */
  const timeline = useMemo(() => {
    const m = (messages || []).map((x) => ({
      kind: "message",
      id: `m-${x.id}`,
      author:
        x.author_name ||
        x.created_by_name ||
        x.user?.name ||
        "Unknown",
      authorId:
        x.user_id ||
        x.created_by ||
        x.user?.id,
      text: x.message,
      at: x.created_at,
    }));

    const s = (shared || []).map((x) => ({
      kind: "share",
      id: `s-${x.id}`,
      author:
        x.shared_by_name ||
        x.shared_by_user?.name ||
        "Unknown",
      authorId:
        x.shared_by ||
        x.shared_by_user?.id,
      text: x.note || "",
      fileUrl: x.file_url,
      title: x.title,
      status: x.status,
      at: x.shared_at,
    }));

    return [...m, ...s].sort(
      (a, b) => new Date(a.at) - new Date(b.at)
    );
  }, [messages, shared]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length]);

  /* ---------------- LOADERS ---------------- */
  async function loadWorkspaces() {
    const res = await api.get("/collaboration/workspaces");
    setWorkspaces(res.data);
  }

  async function loadWorkspaceData(id) {
    const [m, msg, c] = await Promise.all([
      api.get(`/collaboration/workspaces/${id}/members`),
      api.get(`/collaboration/workspaces/${id}/messages`),
      api.get(`/collaboration/workspaces/${id}/content`),
    ]);

    setMembers(m.data);
    setMessages(msg.data);
    setShared(c.data);
  }

  async function selectWorkspace(ws) {
    setSelected(ws);
    await loadWorkspaceData(ws.id);
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  /* ---------------- WORKSPACE ---------------- */
  async function createWorkspace(e) {
    e.preventDefault();
    await api.post("/collaboration/workspaces", {
      name: wsName,
      description: wsDesc,
    });
    setWsName("");
    setWsDesc("");
    loadWorkspaces();
  }

  /* ---------------- USERS ---------------- */
  async function searchUsers(q) {
    setUserQuery(q);
    if (!q.trim()) return setUserSuggestions([]);
    const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    setUserSuggestions(res.data);
  }

  async function addMember(user) {
    if (!selected) return;
    await api.post(`/collaboration/workspaces/${selected.id}/members`, {
      userId: user.id,
    });
    setUserQuery("");
    setUserSuggestions([]);
    loadWorkspaceData(selected.id);
  }

  /* ---------------- CONTENT ---------------- */
  async function searchContent(q) {
    setContentQuery(q);
    if (!q.trim()) return setContentSuggestions([]);
    const res = await api.get(`/content-items/search?q=${encodeURIComponent(q)}`);
    setContentSuggestions(res.data);
  }

  async function shareContent(item) {
    if (!selected) return;
    await api.post(`/collaboration/workspaces/${selected.id}/share`, {
      contentId: item.id,
      note: shareNote,
    });
    setContentQuery("");
    setContentSuggestions([]);
    setShareNote("");
    loadWorkspaceData(selected.id);
  }

  /* ---------------- MESSAGE ---------------- */
  async function sendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || !selected) return;

    await api.post(`/collaboration/workspaces/${selected.id}/messages`, {
      message: messageText,
    });

    setMessageText("");
    loadWorkspaceData(selected.id);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* CREATE WORKSPACE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold">Collaboration Workspaces</h2>
        <p className="text-sm text-gray-500">
          Shared documents with real-time discussion.
        </p>

        <form onSubmit={createWorkspace} className="mt-4 space-y-2">
          <input
            className="w-full border rounded p-2"
            placeholder="Workspace name"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Description (optional)"
            value={wsDesc}
            onChange={(e) => setWsDesc(e.target.value)}
          />
          <button className="w-full bg-black text-white rounded p-2">
            Create Workspace
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* WORKSPACES */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-bold mb-2">My Workspaces</h3>

          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => selectWorkspace(ws)}
              className={`w-full text-left border rounded p-3 mb-2 ${
                selected?.id === ws.id ? "border-black" : "border-gray-200"
              }`}
            >
              <div className="font-semibold">{ws.name}</div>
              <div className="text-xs text-gray-500">{ws.description}</div>
              <div className="text-xs text-gray-500">Role: {ws.my_role}</div>
            </button>
          ))}
        </div>

        {/* DETAILS */}
        <div className="bg-white p-4 rounded-xl shadow">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a workspace.</p>
          ) : (
            <>
              <h3 className="font-bold mb-3">{selected.name}</h3>

              {/* CHAT */}
              <div className="border rounded-xl p-3 bg-gray-50">
                <h4 className="font-semibold mb-2">Workspace Chat</h4>

                <div className="h-80 overflow-y-auto flex flex-col gap-2">
                  {timeline.map((item, idx) => {
                    const mine = item.authorId === currentUserId;
                    const prev = timeline[idx - 1];
                    const showHeader = !isSameSender(prev, item);

                    return (
                      <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%]">
                          {showHeader && (
                            <div className="text-xs text-gray-500 mb-1">
                              {mine ? "You" : item.author}
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-3 py-2 ${
                              mine ? "bg-black text-white" : "bg-white"
                            }`}
                          >
                            {item.kind === "share" && (
                              <div className="mb-2 text-sm">
                                <div className="font-semibold">{item.title}</div>
                                <div className="text-xs">Status: {item.status}</div>
                              </div>
                            )}
                            {item.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                  <input
                    className="flex-1 border rounded-full px-4 py-2"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button className="bg-black text-white rounded-full px-4 py-2">
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
