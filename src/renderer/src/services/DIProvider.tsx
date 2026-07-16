import type { ReactNode } from "react";
import { buildContainer } from "./container";

buildContainer();

export function DIProvider({ children }: { children: ReactNode }): ReactNode {
  return children;
}
