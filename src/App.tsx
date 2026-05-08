import AdminPage from "./components/AdminPage";
import LandingPage from "./components/LandingPage";

function App() {
  const path = window.location.pathname;
  if (path === '/info' || path === '/info/') return <LandingPage />;
  return <AdminPage />;
}

export default App;
