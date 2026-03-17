import { Navigate } from "react-router-dom";
import { isLoggedIn, isTokenExpired } from "./AuthUtils";

function PrivateRoute({ children }) {

  if (!isLoggedIn() || isTokenExpired()) {
    // logout(); // optional but recommended
    return <Navigate to="/login" />;
  }

  return children;
}
export default PrivateRoute;