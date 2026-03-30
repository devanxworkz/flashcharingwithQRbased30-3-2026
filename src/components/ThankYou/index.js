import React from "react";
import "./thankyou.css";
import { useNavigate } from "react-router-dom";

export default function ThanksScreen() {
  const navigate = useNavigate();

  return (
    <div className="thanks-root">
      
      <div className="thanks-card">

        {/* Glow Icon */}
        <div className="thanks-icon-wrap">
          <div className="thanks-icon">⚡</div>
        </div>

        {/* Title */}
        <h1 className="thanks-title">You're All Charged!</h1>

        {/* Main Text */}
        <p className="thanks-main">
          Power delivered successfully.
        </p>

        {/* Sub Text */}
        <p className="thanks-sub">
          Your EV is ready to hit the road. Drive safe and enjoy the journey.
        </p>

        {/* Divider */}
        <div className="thanks-divider"></div>

        {/* Button */}
        <button 
          className="thanks-btn"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>

      </div>

    </div>
  );
}