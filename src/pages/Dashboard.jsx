import React from "react";
import { logout } from "../auth/AuthUtils";

function Dashboard() {
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };
  return (
    <div style={styles.container}>
      <h1>Welcome to the Dashboard!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#992525",
  },
};

export default Dashboard;