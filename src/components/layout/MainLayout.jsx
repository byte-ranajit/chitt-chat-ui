import { useAuth } from "../../auth/AuthContext";

function MainLayout({ children }) {

  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">

        <div className="p-5 text-xl font-bold border-b border-gray-700">
          SaaS App
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="block p-2 rounded hover:bg-gray-700">
            Dashboard
          </a>
          <a href="#" className="block p-2 rounded hover:bg-gray-700">
            Users
          </a>
          <a href="#" className="block p-2 rounded hover:bg-gray-700">
            Settings
          </a>
        </nav>

        <button
          onClick={logout}
          className="m-4 bg-red-500 hover:bg-red-600 p-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <span className="text-gray-600">Welcome 👋</span>
        </div>

        {/* Page Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}

export default MainLayout;