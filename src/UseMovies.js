import { useEffect, useState } from "react";
const OMDB_API_KEY = "44386d09";

export function useMovies(query) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(
        function () {
            async function fetchMovies() {
                try {
                    setError("");
                    setIsLoading(true);
                    const res = await fetch(
                        `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${query}`
                    );
                    if (!res.ok)
                        throw new Error("Something went wrong with fetching movies");

                    const data = await res.json();
                    if (data.Response === "False") throw new Error("Movie not found");

                    setMovies(data.Search);
                } catch (e) {
                    console.error(e.message);
                    setError(e.message);
                } finally {
                    setIsLoading(false);
                }
            }

            if (query.length < 3) {
                setMovies([]);
                setError("");
                return;
            }
            fetchMovies();
        },
        [query]
    );
    return { movies, isLoading, error };

}