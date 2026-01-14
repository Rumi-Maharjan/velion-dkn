import { useEffect, useState } from "react";
import { setAuthUser } from "./api";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import Repository from "./pages/Repository";
import Governance from "./pages/Governance";
import Recommendations from "./pages/Recommendations";
import Collaboration from "./pages/Collaboration";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Building,
  ChevronRight,
  User,
  Globe
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("velion_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setAuthUser(user);
  }, [user]);

  function handleLogin(u) {
    localStorage.setItem("velion_user", JSON.stringify(u));
    setAuthUser(u);
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("velion_user");
    setAuthUser(null);
    setUser(null);
  }

  const isAdmin = user?.role === "ADMIN";
  const isChampion = user?.role === "CHAMPION";

  // Navigation items based on user role
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { id: "repository", label: "Repository", icon: FolderKanban, visible: true },
    { id: "governance", label: "Governance", icon: ShieldCheck, visible: isChampion || isAdmin },
    { id: "recommendations", label: "Recommendations", icon: Sparkles, visible: true },
    { id: "collaboration", label: "Collaboration", icon: MessageSquare, visible: true },
    { id: "users", label: "User Management", icon: Users, visible: isAdmin },
  ].filter(item => item.visible);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your knowledge network.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <div className={`h-2 w-2 rounded-full ${user.role === "ADMIN" ? "bg-red-500" : user.role === "CHAMPION" ? "bg-amber-500" : "bg-blue-500"}`}></div>
                <span className="text-sm font-medium text-gray-700">{user.role}</span>
                <div className="h-4 w-px bg-gray-300"></div>
                <Globe size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">{user.region}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Profile</h3>
                    <p className="text-sm text-gray-500">Account information</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${user.role === "ADMIN" ? "bg-red-100 text-red-700" : user.role === "CHAMPION" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Region</span>
                    <span className="text-sm font-medium">{user.region}</span>
                  </div>
                </div>
              </div>

              {/* System Status Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <Building className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Status</h3>
                    <p className="text-sm text-gray-500">Velion DKN Health</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Connection</span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="text-sm font-medium text-green-600">SQLite Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Sync</span>
                    <span className="text-sm font-medium text-gray-700">Just now</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("repository")}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FolderKanban size={18} className="text-gray-500 group-hover:text-blue-600" />
                      <span className="text-sm font-medium">Upload Document</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                  </button>
                  {(isChampion || isAdmin) && (
                    <button
                      onClick={() => setActiveTab("governance")}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-gray-500 group-hover:text-amber-600" />
                        <span className="text-sm font-medium">Review Pending</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-amber-600" />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("recommendations")}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-gray-500 group-hover:text-purple-600" />
                      <span className="text-sm font-medium">View Recommendations</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Component Status */}
            {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">System Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Knowledge Repository", status: "active", color: "blue" },
                  { name: "Governance System", status: isChampion || isAdmin ? "active" : "restricted", color: "amber" },
                  { name: "AI Recommendations", status: "active", color: "purple" },
                  { name: "Collaboration Workspace", status: "active", color: "green" },
                ].map((component) => (
                  <div key={component.name} className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{component.name}</h4>
                      <div className={`h-2 w-2 rounded-full ${component.status === "active" ? "bg-green-500" : "bg-gray-300"}`}></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Status: <span className={`font-medium ${component.status === "active" ? "text-green-600" : "text-gray-600"}`}>
                        {component.status === "active" ? "Online" : "Restricted"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        );
      case "repository":
        return <Repository />;
      case "governance":
        return <Governance />;
      case "recommendations":
        return <Recommendations />;
      case "collaboration":
        return <Collaboration />;
      case "users":
        return <AdminUsers />;
      default:
        return null;
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gray-50 lg:flex">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <Building className="text-blue-600" size={24} />
              <span className="font-bold text-lg">Velion</span>
            </div>
            <div className="w-10"></div>
          </header>

          {/* Sidebar Overlay for Mobile */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200`}>
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <Building className="text-white" size={22} />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Velion DKN
                    </h1>
                    <p className="text-xs text-gray-500">Knowledge Network</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === item.id
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                      {activeTab === item.id && (
                        <ChevronRight size={16} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </nav>

              {/* User Profile & Logout */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <main className="min-h-screen">
              {/* Desktop Header */}
              <header className="hidden md:block bg-white border-b border-gray-200 px-8 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 capitalize">
                      {activeTab === "dashboard" ? "Dashboard" : navItems.find(item => item.id === activeTab)?.label}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {user.role} • {user.region}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <User className="text-blue-600" size={16} />
                    </div>
                  </div>
                </div>
              </header>

              {/* Content Area */}
              <div className="p-4 md:p-8">
                {renderContent()}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white px-8 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                  Velion Digital Knowledge Network • Mobile Web Component Development • CP70055E
                </p>
                <p className="text-xs text-gray-500">
                  Built with React + Node.js + SQLite • {new Date().getFullYear()}
                </p>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}