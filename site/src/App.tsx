import { useEffect, useState } from "react";

import { CantonPage } from "./pages/CantonPage";
import { HomePage } from "./pages/HomePage";
import "./App.css";

type Route = "home" | "cantones";

const routeFromHash = (): Route =>
  window.location.hash.replace(/^#/, "").startsWith("/cantones")
    ? "cantones"
    : "home";

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route === "cantones" ? <CantonPage /> : <HomePage />;
}
