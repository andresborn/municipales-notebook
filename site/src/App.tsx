import { useEffect, useState } from "react";

import { routeFromHash, type Route } from "./lib/routes";
import { CantonPage } from "./pages/CantonPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { PresidentialCantonPage } from "./pages/PresidentialCantonPage";
import { PresidentialHomePage } from "./pages/PresidentialHomePage";
import "./App.css";

const renderRoute = (route: Route) => {
  switch (route.page) {
    case "landing":
      return <LandingPage />;
    case "home":
      return <HomePage key={route.year} year={route.year} />;
    case "cantones":
      return <CantonPage year={route.year} cantonSlug={route.cantonSlug} />;
    case "presidential-home":
      return <PresidentialHomePage />;
    case "presidential-cantones":
      return <PresidentialCantonPage cantonSlug={route.cantonSlug} />;
  }
};

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

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.focus();
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Saltar al contenido
      </a>
      {renderRoute(route)}
    </>
  );
}
