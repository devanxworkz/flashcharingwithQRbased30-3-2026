import React, { useEffect, useState } from "react";
import "./charger.css";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";


import { FiZap } from "react-icons/fi";        // Power
import { LuBatteryCharging } from "react-icons/lu"; // Energy
import { FiClock } from "react-icons/fi";      // Time
import { FiMapPin } from "react-icons/fi";
import { useCharger } from "../../ChargerContext";

// const CHARGER_ID = "250822008C06";
// const TENANT_ID = 1;



const GRAPHQL_URL = "https://ocpp.rivotmotors.com/v1/graphql";
const CSMS_URL = "https://ocpp.rivotmotors.com/csms";



export default function ChargerPage({onBack  }) {
  const { chargerId, tenantId } = useCharger();
  

  const [soc, setSoc] = useState(0);
  const [power, setPower] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [transactionId, setTransactionId] = useState(null);
  const [isCharging, setIsCharging] = useState(false);
const [targetSoc, setTargetSoc] = useState(100);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (soc / 100) * circumference;

  const [showToast, setShowToast] = useState(false);
  
  


useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");

  if (paymentStatus === "success") {
    setShowToast(true);

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2500);

    return () => clearTimeout(timer);
  }
}, []);

const getTargetSoc = async () => {

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "CitrineOS!"
    },
    body: JSON.stringify({
      query: `
        query {
          charging_targets(
            where: { evse_id: { _like: "${chargerId}%" } }
            order_by: { created_at: desc }
            limit: 1
          ) {
            target_soc
             estimated_time_min 
          }
        }
      `
    })
  });

  const result = await response.json();

  console.log("TARGET RESPONSE:", result);

 const target = result?.data?.charging_targets?.[0];

if (target) {
  if (target.target_soc) {
    setTargetSoc(Number(target.target_soc));
  }

  if (target.estimated_time_min !== null) {
    setTimeLeft(Number(target.estimated_time_min)); // ✅ SET TIME
  }
}
};

  const getActiveTransaction = async () => {

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": "CitrineOS!"
      },
      body: JSON.stringify({
        query: `
          query {
            Transactions(
              where: {
                stationId: { _eq: "${chargerId}" }
                isActive: { _eq: true }
              }
              limit: 1
            ) {
              transactionId
            }
          }
        `
      })
    });

    const result = await response.json();
    const tx = result?.data?.Transactions?.[0];

    if (tx) {
      setTransactionId(tx.transactionId);
      setIsCharging(true);
      return tx.transactionId;
    }

    setIsCharging(false);
    return null;
  };

  /* ---------------------------- */
  /* GET LATEST METER VALUES      */
  /* ---------------------------- */

const getLatestTelemetry = async () => {

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "CitrineOS!"
    },
    body: JSON.stringify({
      query: `
        query {
          LiveTelemetry(
            where: { station_id: { _eq: "${chargerId}" } }
            order_by: { created_at: desc }
            limit: 1
          ) {
            power
            energy
            state   
          }
        }
      `
    })
  });

  const result = await response.json();

 const telemetry = result?.data?.LiveTelemetry?.[0];

if (!telemetry) return;

// ✅ Power
if (telemetry.power !== null) {
  setPower(parseFloat(telemetry.power));
}

// ✅ Energy
if (telemetry.energy !== null) {
  const energyKwh = parseFloat(telemetry.energy) / 1000;
  setEnergy(energyKwh);
}

// 🔥 SOC from state (IMPORTANT)
if (telemetry.state !== null) {
  setSoc(parseFloat(telemetry.state)); // 👈 THIS DRIVES GAUGE
}

};

useEffect(() => {

  const load = async () => {

    const txId = await getActiveTransaction();

   await getLatestTelemetry();   // ✅ always fetch
await getTargetSoc();

if (txId) {
  setIsCharging(true);
}

  };

  load();

  const interval = setInterval(load, 5000);

  return () => clearInterval(interval);

}, []);

  const startCharging = async () => {
    await fetch(
     `${CSMS_URL}/ocpp/1.6/evdriver/remoteStartTransaction?identifier=${chargerId}&tenantId=${tenantId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId: 1,
          idTag: "TEST_TAG"
        })
      }
    );
  };

  const stopCharging = async () => {
    if (!transactionId) return;

    await fetch(
     `${CSMS_URL}/ocpp/1.6/evdriver/remoteStopTransaction?identifier=${chargerId}&tenantId=${tenantId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId })
      }
    );
  };


 const targetProgress =
  targetSoc > 0 ? Math.min((soc / targetSoc) * 100, 100) : 0;

if (!chargerId) return <div>Loading...</div>;

  return (
    <div className="page">

{showToast && (
  <div className="pay-toast-wrap">
    <div className="pay-toast-card">

      <div className="pay-icon">✓</div>

      <div className="pay-text">
        <h4>Payment Successful</h4>
        <p>Your transaction was completed</p>
      </div>

    </div>
  </div>
)}

  <header className="topbar">

 {/* <div className="back-btn" onClick={onBack}>
  <span className="material-symbols-outlined">arrow_back</span>
</div> */}

  <button className="icon-btn" onClick={onBack}>
    ←
  </button>
  
  <div className="center-title">
    <div className="session-text">SESSION ACTIVE</div>
    <div className="station-id">Station #{chargerId}</div>
  </div>

  <button className="icon-btn">
    i
  </button>

</header>

      <div className="gauge-container">
        <svg className="progress-ring" width="300" height="300">
          <circle
            className="bg-ring"
            strokeWidth="12"
            r={radius}
            cx="150"
            cy="150"
          />
          <circle
            className="progress-ring-circle"
            strokeWidth="12"
            r={radius}
            cx="150"
            cy="150"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <div className="gauge-content">
          <div className="bolt">⚡</div>
          <div className="soc">
            {soc}<span>%</span>
          </div>
         <p>{isCharging ? "CHARGING..." : "IDLE"}</p>
        </div>
      </div>

      {/* ---------------- LOCATION CARD ---------------- */}

<div className="location-card">
  <div className="location-info">
    <p className="location-label">CURRENT LOCATION</p>
    <h3>
      KIADB Industrial Estate, Auto Nagar, Kalakamba,
      Belagavi taluku, Belagavi, Karnataka – 590001
    </h3>

    <div className="location-sub">
      <FiMapPin className="unit" />
      <span>India</span>
    </div>
  </div>

  <img
    src="/flsahcharger.png"
    alt="Charger Location"
    className="location-image"
  />
</div>

      <div className="stats">

  <div className="stat-cards">
    <div className="stat-header">
      <FiZap className="stat-icon" />
      <span>POWER</span>
    </div>
   <h3 className="stat-value">
  {power.toFixed(2)}
  <span className="unit"> W</span>
</h3>
  </div>

  <div className="stat-cards">
    <div className="stat-header">
      <LuBatteryCharging className="stat-icon" />
      <span>ENERGY</span>
    </div>
    <h3 className="stat-value">
  {energy.toFixed(2)}
  <span className="unit"> kWh</span>
</h3>
  </div>

  <div className="stat-cards">
    <div className="stat-header">
      <FiClock className="stat-icon" />
      <span>TIME LEFT</span>
    </div>
  <h3 className="stat-value primary">
  {timeLeft}
  <span className="unit"> min</span>
</h3>
  </div>

</div>

      <div className="footer">
    <div className="target-section">

  <div className="target-header">
    <span>Target Charge: {targetSoc}%</span>
    <span className="fast-text">Fast Charging Active</span>
  </div>

  <div className="target-bar">
    <div
      className="target-progress"
      style={{ width: `${targetProgress}%` }}
    />
  </div>

</div>

        {isCharging ? (
          <button className="stop-btn" onClick={stopCharging}>
            ⛔ Stop Charging
          </button>
        ) : (
          <button className="start-btn" onClick={startCharging}>
            ▶ Start Charging
          </button>
        )}
      </div>


      
    </div>



  );
}