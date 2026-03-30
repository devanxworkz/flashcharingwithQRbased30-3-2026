import "./details.css";

export default function ChargerDetails({ data, onProceed = () => {} }) {

  const handleProceed = () => {
    if (typeof onProceed === "function") {
      onProceed(data.status?.toLowerCase() || "available");
    }
  };

  return (

    <div className="pref-containersss">
      <div>
        <div className="screen">

          {/* HEADER */}
          <header className="topbarssss">

            <h2 className="title">Charger Details</h2>

          </header>

          <main className="main">

            {/* HERO CARD */}
            <div className="heroCard">

              <div
                className="heroImage"
                style={{ backgroundImage: "url(/flsahcharger.png)" }}
              >
                <div className="overlay"></div>

                <div className="badge">
                  <div className="pulse"></div>
                  {data.status}
                </div>

              </div>

              <div className="stationInfo">

                <span className="nodeTag">SUPERCHARGER NODE</span>

                <h1 className="stationName">
                  {data.stationName}
                </h1>

                <p className="stationId">
                  ID: {data.chargerId}
                </p>

              </div>

            </div>


            {/* SPEC GRID */}
            <div className="specGrid">

              <div className="specCard">

                <div className="specIcon">
                  <span className="material-symbols-outlined">bolt</span>
                </div>

                <div>
                  <p className="specLabel">POWER RATING</p>
                  <p className="specValue">{data.powerRating}kW</p>
                </div>

              </div>


              <div className="specCard">

                <div className="specIcon">
                  <span className="material-symbols-outlined">ev_charger</span>
                </div>

                <div>
                  <p className="specLabel">CONNECTOR</p>
                  <p className="specValue">{data.connector}</p>
                </div>

              </div>

            </div>


            {/* BILLING */}
            <h3 className="sectionTitle">BILLING DETAILS</h3>

            <div className="billingCard">

              <div className="billingRow">

                <div className="billingLeft">

                  <div className="billingIcon">
                    <span className="material-symbols-outlined">payments</span>
                  </div>

                  <div>
                    <p className="billingTitle">Charging Rate</p>
                    <p className="billingSub">Standard outdoor rate</p>
                  </div>

                </div>

                <div className="billingPrice">
                  ₹{data.rate}<span>/kWh</span>
                </div>

              </div>


              <div className="billingRow">

                <div className="billingLeft">

                  <div className="billingIcon">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>

                  <div>
                    <p className="billingTitle">Compatibility</p>
                    <p className="billingSub">Matches your vehicle</p>
                  </div>

                </div>

                <span className="material-symbols-outlined successIcon">
                  done_all
                </span>

              </div>

            </div>


            {/* LOCATION */}
            <div className="locationNote">
              <span className="material-symbols-outlined locationIcon">
                location_on
              </span>

              <p>{data.location}</p>
            </div>
          </main>

          {/* CTA */}
          <div>

            <button className="ctaButton" onClick={handleProceed}>

              <span className="material-symbols-outlined">
                electric_bolt
              </span>
              Proceed to Charge
            </button>


          </div>

        </div>

      </div>

    </div>
  );
}