"use client";

import { createContext, useContext, useEffect, useReducer } from "react";

const UIStateContext = createContext(null);

const initialState = {
  sidebarOpen: true
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR":
      return { ...state, sidebarOpen: action.value };
    default:
      return state;
  }
}

export function UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = localStorage.getItem("sidebarOpen");
    if (stored !== null) {
      dispatch({ type: "SET_SIDEBAR", value: stored === "true" });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(state.sidebarOpen));
  }, [state.sidebarOpen]);

  return (
    <UIStateContext.Provider value={{ state, dispatch }}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useUIState must be used within UIStateProvider");
  }
  return context;
}
