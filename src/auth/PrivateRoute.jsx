import { Navigate } from "react-router-dom";
import { isLoggedIn, isTokenExpired } from "./AuthUtils";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const hasValidToken = token && token !== "undefined" && token !== "null";

  return hasValidToken ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;
