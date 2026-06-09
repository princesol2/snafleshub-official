import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingNavbar from "./components/LandingNavbar";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace("#", "");

      window.requestAnimationFrame(() => {
        const element = document.getElementById(elementId);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.hash, location.pathname]);

  return (
    <div className={`app-shell ${isHomeRoute ? "app-shell--home" : ""}`}>
      {isHomeRoute ? <LandingNavbar /> : <Navbar />}
      <main className={`app-main ${isHomeRoute ? "app-main--home" : ""}`}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
