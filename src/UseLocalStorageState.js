import { useState, useEffect } from "react";
export function useLocalStorageState(key, defaultValue) {
    const [value, setValue] = useState(function () {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    });
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}