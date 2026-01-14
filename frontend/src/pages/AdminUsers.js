import { useEffect, useState } from "react";
import { api } from "../api";
import { toast } from "react-toastify";
import { 
  UserPlus, 
  RefreshCw, 
  User, 
  Mail, 
  Shield, 
  Globe, 
  Briefcase,
  Key,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [form, setForm] = useState({
    email: "",
    password: "pass123",
    name: "",
    role: "CONSULTANT",
    region: "EU",
    expertise: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    role: "CONSULTANT",
    region: "EU",
    expertise: "",
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function setEditField(k, v) {
    setEditForm((p) => ({ ...p, [k]: v }));
  }

  async function createUser(e) {
    e.preventDefault();
    setCreating(true);
    
    const toastId = toast.loading("Creating user...");
    
    try {
      const res = await api.post("/users", form);
      
      toast.update(toastId, {
        render: `User ${form.name} created successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      
      setForm({
        email: "",
        password: "pass123",
        name: "",
        role: "CONSULTANT",
        region: "EU",
        expertise: "",
      });
      
      await loadUsers();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Failed to create user",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(userId, userName) {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`User ${userName} deleted successfully`);
      await loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  }

  function startEdit(user) {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      role: user.role,
      region: user.region,
      expertise: user.expertise || "",
    });
  }

  async function saveEdit(userId) {
    const toastId = toast.loading("Updating user...");
    
    try {
      await api.put(`/users/${userId}`, editForm);
      
      toast.update(toastId, {
        render: "User updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      
      setEditingUserId(null);
      await loadUsers();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Failed to update user",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  }

  function cancelEdit() {
    setEditingUserId(null);
  }

  const roleColors = {
    ADMIN: "bg-red-100 text-red-800 border-red-200",
    CHAMPION: "bg-amber-100 text-amber-800 border-amber-200",
    CONSULTANT: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const regionColors = {
    EU: "bg-blue-50 text-blue-700 border-blue-200",
    ASIA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NA: "bg-purple-50 text-purple-700 border-purple-200",
    GLOBAL: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage system users and roles</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Users"}
        </button>
      </div>

      {/* Create User Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
            <UserPlus className="text-indigo-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
            <p className="text-sm text-gray-500">Add new users to the Velion DKN system</p>
          </div>
        </div>

        <form onSubmit={createUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={14} />
                Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="John Consultant"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={14} />
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="name@velion.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Key size={14} />
                Password *
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500">Default password shown for demo purposes</p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield size={14} />
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="CONSULTANT">Consultant</option>
                <option value="CHAMPION">Knowledge Champion</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe size={14} />
                Region *
              </label>
              <select
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="EU">Europe (EU)</option>
                <option value="ASIA">Asia</option>
                <option value="NA">North America</option>
                <option value="GLOBAL">Global</option>
              </select>
            </div>

            {/* Expertise */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase size={14} />
                Expertise
              </label>
              <input
                type="text"
                value={form.expertise}
                onChange={(e) => setField("expertise", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="React, Security, AI, etc."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating User...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} />
                  Create User
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Users</h2>
              <p className="text-sm text-gray-500 mt-1">
                {users.length} user{users.length !== 1 ? 's' : ''} in the system
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? "Loading..." : "Updated just now"}
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Create your first user to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.role === "ADMIN" ? "bg-red-100" : 
                          user.role === "CHAMPION" ? "bg-amber-100" : "bg-blue-100"
                        }`}>
                          <User className={
                            user.role === "ADMIN" ? "text-red-600" : 
                            user.role === "CHAMPION" ? "text-amber-600" : "text-blue-600"
                          } size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {editingUserId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditField("role", e.target.value)}
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                          <option value="CONSULTANT">Consultant</option>
                          <option value="CHAMPION">Champion</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingUserId === user.id ? (
                        <select
                          value={editForm.region}
                          onChange={(e) => setEditField("region", e.target.value)}
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                          <option value="EU">EU</option>
                          <option value="ASIA">ASIA</option>
                          <option value="NA">NA</option>
                          <option value="GLOBAL">GLOBAL</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${regionColors[user.region] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                          {user.region}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editForm.expertise}
                          onChange={(e) => setEditField("expertise", e.target.value)}
                          className="text-sm w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          placeholder="Add expertise"
                        />
                      ) : (
                        <p className="text-sm text-gray-700">{user.expertise || "Not specified"}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {editingUserId === user.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(user.id)}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            {user.role !== "ADMIN" && (
                              <button
                                onClick={() => deleteUser(user.id, user.name)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Users</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{users.length}</p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Knowledge Champions</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {users.filter(u => u.role === "CHAMPION").length}
              </p>
            </div>
            <Shield className="text-amber-600" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Administrators</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {users.filter(u => u.role === "ADMIN").length}
              </p>
            </div>
            <User className="text-red-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}