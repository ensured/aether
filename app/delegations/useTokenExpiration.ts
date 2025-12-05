"use client";

import { useEffect, useState } from "react";

export function useTokenExpiration() {
    const [isTokenExpired, setIsTokenExpired] = useState(false);

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            const errorMessage = event.error?.message || "";
            if (errorMessage.includes("401")) {
                setIsTokenExpired(true);
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const errorMessage = event.reason?.message || "";
            if (errorMessage.includes("401")) {
                setIsTokenExpired(true);
            }
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    const resetTokenExpiration = () => {
        setIsTokenExpired(false);
    };

    return { isTokenExpired, resetTokenExpiration };
}
