

import { useEffect, useState } from "react";
import ChargerDetails from "../components/ChargerDetails";
import ConnectionStatus from "../components/ConnectionStatus";
import ChargingPreferences from "../components/ChargingPreferences";
import ChargerStartandStop from "../components/ChargerStartandStop";
import SessionSummary from "../components/SessionSummary";
import { useParams } from "react-router-dom";
import { useCharger } from "../ChargerContext";

// const CHARGER_ID = "250822008C06";

const HASURA_URL = "https://ocpp.rivotmotors.com/v1/graphql";
const HASURA_ADMIN_SECRET = "CitrineOS!";




export default function MainFlow() {
  
  const { tenantId } = useCharger();
const CONNECTOR_ID = Number(tenantId);
  const { chargerId } = useCharger();
  const [screen, setScreen] = useState("LOADING");
  const [connectorStatus, setConnectorStatus] = useState(null);
  const [chargerOnline, setChargerOnline] = useState(false);
  const [vehicleModel, setVehicleModel] = useState(null);
  const [displayStatus, setDisplayStatus] = useState(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const { chargerId: urlChargerId, tenantId: urlTenantId } = useParams();
const { setChargerId, setTenantId } = useCharger();



useEffect(() => {
  if (urlChargerId) setChargerId(urlChargerId);
  if (urlTenantId) setTenantId(urlTenantId);
}, [urlChargerId, urlTenantId]);

  const TEST_MODE = true;
  const allowedModels = ["Classic", "Pro", "Offlander", "Max"];

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const checkoutId = params.get("checkout_id");

  console.log("Payment:", paymentStatus);

  if (paymentStatus?.startsWith("success")) {
    console.log("✅ Payment success detected");

    // 🔥 CALL BACKEND HERE
    fetch("https://ocpp.rivotmotors.com/api/payment-success", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkout_id: checkoutId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("🔥 Backend response:", data);
      })
      .catch((err) => {
        console.error("❌ Backend call failed:", err);
      });

    setIsPaymentSuccess(true);
    setScreen("CHARGING");
  } else {
    setScreen("DETAILS");
  }
}, []);
// const startSmartCharging = async () => {
//   try {
//     const targetKwh = localStorage.getItem("targetKwh");

//     if (!targetKwh) {
//       console.error("No targetKwh found in localStorage");
//       return;
//     }

//     await fetch("http://localhost:4000/start-smart-charging", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         chargerId: CHARGER_ID,
//         connectorId: CONNECTOR_ID,
//         targetKwh: Number(targetKwh)
//       })
//     });

//     setScreen("CHARGING");

//   } catch (err) {
//     console.error("Smart charging error:", err);
//   }
// };

  useEffect(() => {
    let isActive = true;

    const fetchStatus = async () => {
      if (!isActive) return;

      try {
        const res = await fetch(HASURA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
          },
          body: JSON.stringify({
            query: `
              query GetLiveStatus($stationId: String!, $connectorId: Int!) {
                ChargingStations(where: {id: {_eq: $stationId}}) { isOnline }
                Connectors(where: {stationId: {_eq: $stationId}, connectorId: {_eq: $connectorId}}) {
                  status
                }
                vehicledata(where: {stationid: {_eq: $stationId}}, order_by: {created_at: desc}, limit: 1) {
                  model
                }
              }
            `,
            variables: { stationId: chargerId, connectorId: CONNECTOR_ID },
          }),
        });

        const result = await res.json();

        const charger = result.data?.ChargingStations?.[0];
        const connector = result.data?.Connectors?.[0];
        const latestVehicle = result.data?.vehicledata?.[0];

        const isOnline = !!charger?.isOnline;
        const status = connector?.status?.trim().toLowerCase() || "unknown";

      const displayStatus =
        status === "preparing" ? "Plugged In" : status;

        setChargerOnline(isOnline);
        setConnectorStatus(status);
        setDisplayStatus(displayStatus); // UI text
        setVehicleModel(latestVehicle?.model || null);

        // 🔴 If charging session finished → show summary
       // 🔴 If charging session finished → show summary
if (status === "finishing") {
  setScreen("SUMMARY");
  return;
}

// 🛑 DO NOT override if already charging
// 🛑 DO NOT override if payment success OR charging
if (isPaymentSuccess || screen === "CHARGING") {
  return;
}

        // Only auto-set screen on initial load
if (screen === "LOADING" && !isPaymentSuccess) {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment") || "";

  if (paymentStatus.startsWith("success")) {
    return; // 🔥 DO NOT override
  } else {
    setScreen("DETAILS");
  }
}

      } catch (err) {
        console.error("Error:", err);
        if (screen === "LOADING") {
          setScreen("DETAILS");
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [screen]);

  const isConnectorReady =
    connectorStatus === "preparing" ||
    connectorStatus === "faulted";

  const isVehicleDetected =
    TEST_MODE ||
    (vehicleModel && allowedModels.includes(vehicleModel));

  const canProceed = isConnectorReady && isVehicleDetected;

  if (screen === "LOADING") {
    return <div style={{ color: "#fff", padding: 20 }}>Loading...</div>;
  }

  
  if (!chargerId) {
  return <div style={{ color: "#fff" }}>Loading charger...</div>;
}

  return (
    <>
      {/* CHARGER DETAILS SCREEN (always first) */}
    {screen === "DETAILS" && (
  <ChargerDetails
    data={{
      stationName: "flashCharge",
      chargerId: chargerId,
      powerRating: 11,
      connector: "Type-6",
      rate: 18,
      location: "Located near the main entrance parking lot",
     status: chargerOnline ? displayStatus : "Offline",
    }}
    onProceed={() => setScreen("PREPARING")}   // ALWAYS move forward
  />
)}

      {/* CONNECTION STATUS */}
    {screen === "PREPARING" && (
  <ConnectionStatus
    connectorStatus={connectorStatus}
    chargerOnline={chargerOnline}
    vehicleModel={vehicleModel}
    canProceed={canProceed}
    onContinue={() => setScreen("PREFERENCES")}
    onBack={() => setScreen("DETAILS")}
  />
)}

      {/* PREFERENCES */}
    {screen === "PREFERENCES" && (
 <ChargingPreferences
    setScreen={setScreen}
    setIsPaymentSuccess={setIsPaymentSuccess}
    onBack={() => setScreen("PREPARING")}
  />
)}

      {/* CHARGING */}
      {screen === "CHARGING" && (
        <ChargerStartandStop
          connectorStatus={connectorStatus}
          vehicleModel={vehicleModel}
          onBack={() => setScreen("PREFERENCES")}
        />
      )}

      {/* SESSION SUMMARY */}
  {screen === "SUMMARY" && (
    <SessionSummary
      chargerId={chargerId}
      connectorId={CONNECTOR_ID}
    />
  )}
    </>
  );
}