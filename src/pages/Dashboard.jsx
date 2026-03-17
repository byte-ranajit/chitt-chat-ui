import React from "react";

function Dashboard() {
  return (
    <div style={styles.container}>
      <h1>Welcome to the Dashboard!</h1>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f2f2f2",
  },
};

export default Dashboard;