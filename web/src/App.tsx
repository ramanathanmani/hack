import { RouterProvider, usePathname } from "./router";
import { ControlTower } from "./routes/ControlTower";
import { Audit } from "./routes/Audit";

function Routes() {
  const pathname = usePathname();
  if (pathname === "/audit") {
    return <Audit />;
  }
  // "/" is self-sufficient for the whole demo arc (AC-10); any unknown path
  // falls back to it rather than a 404, since this runs on one presenter
  // laptop with a fixed two-route surface for M1.
  return <ControlTower />;
}

export function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}
