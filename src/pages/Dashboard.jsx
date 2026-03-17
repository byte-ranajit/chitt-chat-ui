import React from "react";
import { logout } from "../auth/AuthUtils";
import MainLayout from "../components/layout/MainLayout";

function Dashboard() {
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };
  return (
    <MainLayout>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Users</h2>
          <p className="text-2xl font-bold mt-2">1,250</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Revenue</h2>
          <p className="text-2xl font-bold mt-2">$12,500</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Active Sessions</h2>
          <p className="text-2xl font-bold mt-2">320</p>
        </div>

      </div>

      {/* Table Section */}
      <div className="mt-8 bg-white rounded-xl shadow p-6">

        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="py-2">John Doe</td>
              <td>john@example.com</td>
              <td className="text-green-500">Active</td>
            </tr>

            <tr className="border-b">
              <td className="py-2">Jane Smith</td>
              <td>jane@example.com</td>
              <td className="text-red-500">Inactive</td>
            </tr>
          </tbody>
        </table>

      </div>

    </MainLayout>
  );
}

export default Dashboard;