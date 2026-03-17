import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PrivateRoute from "./auth/PrivateRoute";
import Chat from "./pages/Chat.jsx";

function App(){
 return(
  <BrowserRouter>
   <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<Login/>} />
    {/*<Route path="/dashboard"*/}
    {/*  element={*/}
    {/*    <PrivateRoute>*/}
    {/*      <Dashboard/>*/}
    {/*    </PrivateRoute>*/}
    {/*  }*/}
    {/*/>*/}
       <Route path="/chat"
              element={
                  <PrivateRoute>
                      <Chat/>
                  </PrivateRoute>
              }
       />
   </Routes>
  </BrowserRouter>
 );
}

export default App;
