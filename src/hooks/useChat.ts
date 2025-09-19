import { useContext } from "react";
import type { ChatContextType } from "../types";
import ChatContext from "../contexts/ChatContext";

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
