import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { useRef } from "react";
import { useMovies } from "./UseMovies";
import { useLocalStorageState } from "./UseLocalStorageState";
import { useKey } from "./UseKey";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const OMDB_API_KEY = "44386d09";

export default function App() {

  const [query, setQuery] = useState("");
  const [selectedMovieID, setSelectedMovieID] = useState(null);
  const { movies, isLoading, error } = useMovies(query);
  const [watchedMovies, setWatchedMovies] = useLocalStorageState("watched", []);

  function handleSelectMovie(id) {
    setSelectedMovieID((currentID) => (id === currentID ? null : id));
  }
  function handleDeleteWatchedMovie(id) {
    setWatchedMovies((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  function handleCloseMovie() {
    setSelectedMovieID(null);
  }

  function handleAddWatchedMovie(movie) {
    setWatchedMovies((watched) => [...watched, movie]);
  }


  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
        </Box>

        <Box>
          {selectedMovieID ? (
            <MovieDetails
              selectedMovieID={selectedMovieID}
              onCloseMovie={handleCloseMovie}
              onAddWatchedMovie={handleAddWatchedMovie}
              watchedMovies={watchedMovies}
            />
          ) : (
            <>
              <WatchedSummary watchedMovies={watchedMovies} />
              <WatchedMoviesList watchedMovies={watchedMovies} onDeleteWatchedMovie={handleDeleteWatchedMovie} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function MovieDetails({
  selectedMovieID,
  onCloseMovie,
  onAddWatchedMovie,
  watchedMovies,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRating, setUserRating] = useState("");
  const count = useRef(0);
  useEffect(() => {
    if (userRating) count.current++;
  }, [userRating]);

  const alreadyWatchedMovie = watchedMovies.find(
    (watchedMovie) => watchedMovie.imdbID === selectedMovieID
  );

  function handleAddToWatched(movie) {
    const newWatchedMovie = {
      imdbID: selectedMovieID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
      runtime: Number(movie.Runtime.split(" ").at(0)),
      imdbRating: Number(movie.imdbRating),
      userRating: userRating,
      countRatingDecisions: count.current,
    };
    onAddWatchedMovie(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(
    function () {
      async function fetchMovieDetails() {
        try {
          setError("");
          setIsLoading(true);
          const controller = new AbortController();
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${selectedMovieID}`,
            { signal: controller.signal }
          );
          if (!res.ok)
            throw new Error(
              "Something went wrong with fetching movie details"
            );
          const data = await res.json();
          setMovie(data);
          setError("");
        } catch (e) {
          console.error(e.message);
          if (e.name !== "AbortError") {
            setError(e.message);
          }
        } finally {
          setIsLoading(false);
        }
      }
      fetchMovieDetails();
    },
    [selectedMovieID]
  );
  useEffect(() => {
    if (!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;
    return function () {
      document.title = "usePopcorn";
    }
  }, [movie.Title]);

  const {
    Title: title,
    Year: year,
    imdbRating: rating,
    Director: director,
    Poster: poster,
    Genre: genre,
    Plot: plot,
    Runtime: runtime,
    Released: released,
    Actors: actors,
    Language: language,
    Country: country,
  } = movie;

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {rating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {alreadyWatchedMovie ? (
                <p>
                  You rated this movie {alreadyWatchedMovie.userRating} ⭐️
                </p>
              ) : (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  <button
                    className="btn-add"
                    onClick={() => handleAddToWatched(movie)}
                  >
                    + Add to list
                  </button>
                </>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return <p className="error">⛔ {message}</p>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputRef = useRef(null);
  useKey("Enter", function () {
    if (document.activeElement === inputRef.current) return;
    inputRef.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      ref={inputRef}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectMovie={onSelectMovie}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedSummary({ watchedMovies }) {
  const avgImdbRating = average(watchedMovies.map((movie) => movie.imdbRating));
  const avgUserRating = average(watchedMovies.map((movie) => movie.userRating));
  const avgRuntime = average(watchedMovies.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watchedMovies.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(0)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watchedMovies, onDeleteWatchedMovie }) {
  return (
    <ul className="list">
      {watchedMovies.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatchedMovie={onDeleteWatchedMovie}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatchedMovie }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button className="btn-delete" onClick={() => onDeleteWatchedMovie(movie.imdbID)}>
          ×
        </button>
      </div>
    </li>
  );
}

