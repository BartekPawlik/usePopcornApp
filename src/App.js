import { queries } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import StarRaiting from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const key = "2331ee34";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoadnig, error } = useMovies(query);

  const [watched, setWatched] = useLocalStorageState([], "watched");
  // const [watched, setWatched] = useState(function () {
  //   const storeValue = localStorage.getItem("watched");
  //   return JSON.parse(storeValue) || []; // Provide an empty array if storeValue is null
  // });

  function handleSelectedId(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleSelectedMovie() {
    setSelectedId(null);
    document.title = "UsePopcorn";
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
    // localStorage.setItem("watched", JSON.stringify([...watched, movie]));
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <Found movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoadnig && <Loader></Loader>}
          {!isLoadnig && !error && (
            <MovieList movies={movies} onSelectedMovie={handleSelectedId} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <SelectedMovie
              selecteId={selectedId}
              onCloseMovie={handleSelectedMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <Summary watched={watched} />
              <ListWatched
                watched={watched}
                odDeleteWatch={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;

    inputEl.current.focus();
    setQuery("");
  });

  // useEffect(function () {
  //   const el = document.querySelector(".search");
  //   console.log(el);
  //   el.focus();
  // }, []);
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
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

function Found({ movies }) {
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
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectedMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectedMovie={onSelectedMovie}
        />
      ))}
    </ul>
  );
}
function SelectedMovie({ selecteId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoadnig, setIsLoadnig] = useState(false);
  const [userRating, setUserRating] = useState();

  const isWatched = watched.map((movie) => movie.imdbID).includes(selecteId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selecteId
  )?.userRating;

  const countRef = useRef();

  useEffect(
    function () {
      countRef.current = countRef.current + 1;
    },
    [userRating]
  );

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  // const [avgRating, setAvgRating] = useState(0);

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selecteId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      CountRatingDecisions: countRef.current,
    };
    // setAvgRating(Number(imdbRating));
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }
  useEffect(
    function () {
      async function getMOvieDetails() {
        setIsLoadnig(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${key}&i=${selecteId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoadnig(false);
      }

      getMOvieDetails();
    },
    [selecteId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie |${title}`;

      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  useKey("Escape", onCloseMovie);

  return (
    <dvi className="details">
      {isLoadnig ? (
        <Loader />
      ) : (
        <>
          <header>
            {/* <div>{avgRating}</div> */}
            <button onClick={() => onCloseMovie()} className="btn-back">
              &larr;
            </button>
            <img src={poster} alt={`poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <div className="rating">
            {!isWatched ? (
              <>
                <StarRaiting
                  maxRating={10}
                  size={34}
                  onSetRating={setUserRating}
                />
                {userRating > 0 && (
                  <button className="btn-add" onClick={handleAdd}>
                    add to list
                  </button>
                )}{" "}
              </>
            ) : (
              <p>you rated this movie {watchedUserRating}</p>
            )}
          </div>
          <section>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </dvi>
  );
}
function Movie({ movie, onSelectedMovie }) {
  if (!movie) return null;
  return (
    <li onClick={() => onSelectedMovie(movie.imdbID)}>
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

function Loader() {
  return <div>loadnig....</div>;
}

function ErrorMessage({ message }) {
  return (
    <p className="srrpr">
      <span>{message}</span>
    </p>
  );
}

function Summary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
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
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function ListWatched({ watched, odDeleteWatch }) {
  if (!watched) return null;
  return (
    <ul className="list">
      {watched.map((movie) => (
        <ItemList
          movie={movie}
          key={movie.imdbID}
          odDeleteWatch={odDeleteWatch}
        />
      ))}
    </ul>
  );
}

function ItemList({ movie, odDeleteWatch }) {
  if (!movie) return null;
  return (
    <li>
      <img src={movie.poster} alt={`${movie.Title} poster`} />
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

        <button
          className="btn-delete"
          onClick={() => odDeleteWatch(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
