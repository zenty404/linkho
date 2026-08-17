"use client";

import { createContext, useContext, useState } from "react";

export const LoaderContext = createContext<{
  isLoaderFinished: boolean;
  setLoaderFinished: (value: boolean) => void;
}>({
  isLoaderFinished: true,
  setLoaderFinished: () => {},
});

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoaderFinished, setLoaderFinished] = useState(false);

  return (
    <LoaderContext.Provider value={{ isLoaderFinished, setLoaderFinished }}>
      {children}
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
