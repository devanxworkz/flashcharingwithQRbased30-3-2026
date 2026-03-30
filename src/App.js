import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainFlow from "./MainFlow";
import SessionSummary from "./components/SessionSummary";
import ThankYou from "./components/ThankYou";
import { ChargerProvider } from "./ChargerContext"; // ✅ ADD THIS

export default function App() {
  return (
    <ChargerProvider> {/* ✅ WRAP EVERYTHING */}
      <BrowserRouter>
        <Routes>
           <Route path="/:chargerId/:tenantId" element={<MainFlow />} />
          <Route path="/summary" element={<SessionSummary />} />
          <Route path="/thank-you" element={<ThankYou />} />
        </Routes>
      </BrowserRouter>
    </ChargerProvider>
  );
}