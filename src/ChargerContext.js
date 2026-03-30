import { createContext, useContext, useState, useEffect } from "react";

const ChargerContext = createContext();

export const ChargerProvider = ({ children }) => {
  const [chargerId, setChargerId] = useState("250822008C06");
  const [tenantId, setTenantId] = useState(null);



  return (
    <ChargerContext.Provider value={{ chargerId, setChargerId, tenantId, setTenantId }}>
      {children}
    </ChargerContext.Provider>
  );
};

export const useCharger = () => useContext(ChargerContext);