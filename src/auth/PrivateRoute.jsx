import { Navigate } from "react-router-dom";
import { isLoggedIn, isTokenExpired } from "./AuthUtils";

function PrivateRoute({children}){
 return isLoggedIn() || isTokenExpired() ? children : <Navigate to="/login"/>
}

export default PrivateRoute;