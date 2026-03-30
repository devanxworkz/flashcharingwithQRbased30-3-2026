import React, { useEffect, useState } from "react";
import "./index.css";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import jsPDF from "jspdf";

// const CHARGER_ID = "250822008C06";
import { useCharger } from "../../ChargerContext";

const HASURA_URL = "https://ocpp.rivotmotors.com/v1/graphql";
const HASURA_ADMIN_SECRET = "CitrineOS!";

export default function SessionSummary() {
  const { chargerId } = useCharger();

  const [duration, setDuration] = useState("Loading...");
  const [energy, setEnergy] = useState("Loading...");
  const [startTimeIST, setStartTimeIST] = useState("");
  const [stopTimeIST, setStopTimeIST] = useState("");
  // const [chargerId, setChargerId] = useState(null);

  const handleCloseSession = () => {
  navigate("/thank-you");
};
  

const handleDownloadInvoice = () => {
  const doc = new jsPDF();

  // 🔹 CONFIG (REPLACE WITH REAL DATA)
  const COMPANY_NAME = "Rivot Motors Pvt Ltd";
  const COMPANY_ADDRESS = "Belgaum, Karnataka";
  const GSTIN = "29ABCDE1234F1Z5"; // ⚠️ replace with real GSTIN

  const rate = 18; // ₹ per kWh

  // 🔹 SAFE NUMBER CONVERSION
  const energyNum = parseFloat(energy) || 0;

  const taxableAmount = energyNum * rate;
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const totalAmount = taxableAmount + cgst + sgst;

  // 🔹 FORMATTING
  const f = (num) => num.toFixed(2);

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  let y = 20;

  // =========================
  // 🏢 COMPANY DETAILS
  // =========================
  doc.setFontSize(16);
  doc.text(COMPANY_NAME, 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.text(COMPANY_ADDRESS, 20, y);

  y += 6;
  doc.text(`GSTIN: ${GSTIN}`, 20, y);

  // =========================
  // 🧾 INVOICE INFO
  // =========================
  y += 12;
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoiceNumber}`, 20, y);

  y += 6;
  doc.text(`Date: ${invoiceDate}`, 20, y);

  y += 6;
  doc.text(`Station ID: ${chargerId}`, 20, y);

  // =========================
  // ⚡ SERVICE DETAILS
  // =========================
  y += 12;
  doc.text("Description: EV Charging Service", 20, y);

  y += 6;
  doc.text("SAC Code: 998714", 20, y);

  // =========================
  // 📊 USAGE DETAILS
  // =========================
  y += 10;
  doc.text(`Energy Delivered: ${f(energyNum)} kWh`, 20, y);

  // y += 6;
  // doc.text(`Rate: ₹${rate} / kWh`, 20, y);

  // =========================
  // 💰 BILLING
  // =========================
  // y += 10;
  // doc.text(`Taxable Amount: ₹${f(taxableAmount)}`, 20, y);

  // y += 6;
  // doc.text(`CGST (9%): ₹${f(cgst)}`, 20, y);

  // y += 6;
  // doc.text(`SGST (9%): ₹${f(sgst)}`, 20, y);

  // =========================
  // 🧮 TOTAL
  // =========================
  // y += 10;
  // doc.setFontSize(14);
  // doc.text(`Total Amount: ₹${f(totalAmount)}`, 20, y);

  // =========================
  // ⏱ SESSION INFO (BONUS)
  // =========================
  // y += 12;
  // doc.setFontSize(10);
  // doc.text(`Start: ${startTimeIST || "-"}`, 20, y);

  // y += 6;
  // doc.text(`Stop: ${stopTimeIST || "-"}`, 20, y);

  // y += 6;
  // doc.text(`Duration: ${duration || "-"}`, 20, y);

  // =========================
  // 🙏 FOOTER
  // =========================
  y += 12;
  doc.text("Thank you for charging with us!", 20, y);

  doc.save(`Invoice_${invoiceNumber}.pdf`);
};

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // 1️⃣ Get latest completed session for this charger
        const stopRes = await fetch(HASURA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
          },
          body: JSON.stringify({
            query: `
              query {
                StopTransactions(
                  where: { stationId: { _eq: "${chargerId}" } }
                  order_by: { createdAt: desc }
                  limit: 1
                ) {
                  transactionDatabaseId
                  meterStop
                  createdAt
                }
              }
            `,
          }),
        });

        const stopData = await stopRes.json();
        const stop = stopData.data?.StopTransactions?.[0];

        if (!stop) {
          setDuration("No completed session");
          setEnergy("-");
          return;
        }



        // 🔥 Get target_kwh from charging_targets
const targetRes = await fetch(HASURA_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
  },
  body: JSON.stringify({
    query: `
      query {
        charging_targets(
          where: { evse_id: { _like: "${chargerId}%" } }
          order_by: { created_at: desc }
          limit: 1
        ) {
          target_kwh
        }
      }
    `,
  }),
});

const targetData = await targetRes.json();
const target = targetData?.data?.charging_targets?.[0];

// ✅ Set energy from target_kwh
if (target?.target_kwh !== null && target?.target_kwh !== undefined) {
  setEnergy(Number(target.target_kwh).toFixed(2));
} else {
  setEnergy("0.00");
}


const stationRes = await fetch(HASURA_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
  },
  body: JSON.stringify({
    query: `
      query {
        LiveTelemetry(
          order_by: { created_at: desc }
          limit: 1
        ) {
          station_id
        }
      }
    `,
  }),
});

const stationData = await stationRes.json();
const stationId = stationData?.data?.LiveTelemetry?.[0]?.station_id;

        const transactionId = stop.transactionDatabaseId;

        // 2️⃣ Get matching StartTransaction using SAME transactionDatabaseId
        const startRes = await fetch(HASURA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
          },
          body: JSON.stringify({
            query: `
              query {
                StartTransactions(
                  where: { 
                    transactionDatabaseId: { _eq: ${transactionId} },
                    stationId: { _eq: "${chargerId}" }
                  }
                ) {
                  meterStart
                  createdAt
                }
              }
            `,
          }),
        });

        const startData = await startRes.json();
        const start = startData.data?.StartTransactions?.[0];

        if (!start) {
          setDuration("Start not found");
          setEnergy("-");
          return;
        }

        // 3️⃣ Convert times
        const startUTC = new Date(start.createdAt);
        const stopUTC = new Date(stop.createdAt);

        const startIST = startUTC.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });

        const stopIST = stopUTC.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });

        setStartTimeIST(startIST);
        setStopTimeIST(stopIST);

        // 4️⃣ Calculate Duration
        const durationMs = stopUTC - startUTC;
        const totalMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const formattedDuration =
          hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;

        setDuration(formattedDuration);

        // 5️⃣ Calculate Energy Delivered (Wh → kWh)
        // const energyDelivered =
        //   (stop.meterStop - start.meterStart) / 1000;

        // setEnergy(energyDelivered.toFixed(2));

      } catch (error) {
        console.error(error);
        setDuration("Error");
        setEnergy("Error");
      }
    };

    fetchSessionData();
  }, []);

  console.log({energy});
  console.log({duration});

  const navigate = useNavigate();

if (!chargerId) return <div>Loading...</div>;

  return (
    
    <div className="summary-wrapper">
      <div className="summary-container">
        
        {/* Header */}
        <div className="summary-header">
        <ArrowLeft 
          size={22} 
          className="back-icon"
          onClick={() => navigate(-1)}   // 🔥 GO BACK
          style={{ cursor: "pointer" }}
        />
        <h3>Session Summary</h3>
      </div>

        {/* Success Circle */}
        <div className="success-circle">
          <div className="inner-circle">
            ✓
          </div>
        </div>

        <p className="charging-label">CHARGING COMPLETE</p>
        <h2 className="session-title">Session #8821 Success</h2>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <p>Energy Delivered</p>
            {/* <h4>{energy} </h4> */}
            <h4>{energy} kWh</h4>
            
          </div>

          <div className="stat-card">
            <p>Total Duration</p>
            <h4>{duration}</h4>
          </div>
        </div>

        {/* Amount Card */}
        <div className="amount-card">
          <p>Total Amount Paid</p>
          <h1>₹500.00</h1>
        </div>

        {/* Breakdown */}
        <div className="breakdown-card">
          <div className="row">
            <span>Rate</span>
            <span>₹18.00 / kWh</span>
          </div>
          <div className="row">
            <span>Taxes & Fees</span>
            <span>₹0.00</span>
          </div>
          <div className="row">
            <span>Station ID</span>
            <span>{chargerId}</span>
          </div>
          {/* <div className="row">
            <span>Payment Method</span>
            <span>Wallet (Ending 4402)</span>
          </div> */}
        </div>

        {/* Buttons */}
       <button className="download-btn" onClick={handleDownloadInvoice}>
          <Download size={18} />
          Download Invoice
        </button>

      <button className="close-btn" onClick={handleCloseSession}>
  Close Session
</button>

      </div>
    </div>
  );
}