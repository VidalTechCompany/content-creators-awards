"use client";

import { createContext, useContext, ReactNode } from "react";
import type { AdminRole } from "@/types/database";

type SessionContextType = {
    email: string | null;
    isAdmin: boolean;
    adminRole: AdminRole | null;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
    children,
    email,
    isAdmin = false,
    adminRole = null,
}: {
    children: ReactNode;
    email: string | null;
    isAdmin?: boolean;
    adminRole?: AdminRole | null;
}) {
    return (
        <SessionContext.Provider value={{ email, isAdmin, adminRole }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}
