import { useEffect } from "react";
export function useKey(key, action) {
    useEffect(() => {
        function handle(e) {
            if (e.code.toLowerCase() === key.toLowerCase()) action();
        }
        document.addEventListener("keydown", handle);
        return () => document.removeEventListener("keydown", handle);
    }, [key, action]);
}