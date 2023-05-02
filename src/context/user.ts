import { createContext } from "react";

export type User = {
  uid: string,
  email: string,
}

export default createContext<User | null>(null);