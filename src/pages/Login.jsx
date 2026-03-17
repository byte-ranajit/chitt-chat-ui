import { useState,useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { isLoggedIn } from '../auth/AuthUtils';


function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

const navigate = useNavigate();

useEffect(() => {
  if (isLoggedIn()) {
    navigate("/dashboard");
  }
}, [navigate]);

const handleSubmit = async (e) => {
  e.preventDefault();
  // Handle login logic here
  console.log('Username:', username);
  console.log('Password:', password);

  try {
    await login(username, password);
    // TODO: Show success message or redirect to dashboard
    // rewrite the code to use navigate with condition that checks if the user is logged in
  } catch (err) {
    console.error("Login failed:", err);
    alert("Login failed: " + (err.message || "Unknown error"));
  }
};
  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button style={styles.button}>
          Login
        </button>
      </form>
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
  form: {
    padding: "40px",
    background: "white",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    width: "300px",
  },
  input: {
    marginBottom: "15px",
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};
export default Login;