import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

import {
  initializeDatabase,
  getLibraries,
  getMoviesByLibrary,
  addLibrary,
  synchronizeMovies,
} from "./services/database";

import type {
  Library,
  Movie,
} from "./services/database";

import MovieCard from "./components/MovieCard";
import SearchBar from "./components/SearchBar";
import VideoPlayer from "./components/VideoPlayer";

interface ScannedMovie {
  name: string;
  title: string;
  year: number | null;
  path: string;
}
type SortOption =
  | "title-asc"
  | "title-desc"
  | "year-newest"
  | "year-oldest";

function App() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] =
    useState<Library | null>(null);

  const [movies, setMovies] = useState<Movie[]>([]);

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedMovie, setSelectedMovie] =
    useState<Movie | null>(null);
  
  const [searchTerm, setSearchTerm] =
    useState("");

  const [sortOption, setSortOption] =
    useState<SortOption>("title-asc");

  const [yearFilter, setYearFilter] =
    useState<number | null>(null);

  const availableYears = Array.from(
    new Set(
      movies
        .map((movie) => movie.year)
        .filter(
          (year): year is number =>
            year !== null
        )
    )
  ).sort((a, b) => b - a);

  const [playingMovie, setPlayingMovie] =
  useState<Movie | null>(null);

  const filteredMovies = [...movies]
    .filter((movie) => {
      if (!searchTerm.trim()) {
        return true;
      }

      return movie.title
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase().trim()
        );
    })
    .filter((movie) => {
      if (yearFilter === null) {
        return true;
      }

      return movie.year === yearFilter;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "title-desc":
          return b.title.localeCompare(
            a.title
          );

        case "year-newest":
          return (
            (b.year ?? 0) -
            (a.year ?? 0)
          );

        case "year-oldest":
          return (
            (a.year ?? 9999) -
            (b.year ?? 9999)
          );

        case "title-asc":
        default:
          return a.title.localeCompare(
            b.title
          );
      }
    });

  /*
   * Initialize database and load libraries.
   */
  useEffect(() => {
    async function setupDatabase() {
      try {
        setLoading(true);

        await initializeDatabase();

        const storedLibraries =
          await getLibraries();

        setLibraries(storedLibraries);

        /*
         * Automatically select the first library.
         */
        if (storedLibraries.length > 0) {
          const firstLibrary =
            storedLibraries[0];

          setSelectedLibrary(firstLibrary);

          const libraryMovies =
            await getMoviesByLibrary(
              firstLibrary.id
            );

          setMovies(libraryMovies);
        }
      } catch (error) {
        console.error(
          "Database initialization failed:",
          error
        );

        setError(String(error));
      } finally {
        setLoading(false);
      }
    }

    setupDatabase();
  }, []);

  function handleMovieClick(movie: Movie) {
    setSelectedMovie(movie);
  }

  function handlePlayMovie(movie: Movie) {
    setPlayingMovie(movie);
    setSelectedMovie(null);
  }

  /*
   * Select an existing library.
   */
  async function selectLibrary(
    library: Library
  ) {
    try {
      setError(null);

      setSelectedLibrary(library);

      const libraryMovies =
        await getMoviesByLibrary(
          library.id
        );

      setMovies(libraryMovies);
    } catch (error) {
      console.error(
        "Failed to load library:",
        error
      );

      setError(String(error));
    }
  }

  /*
   * Add a new library.
   */
  async function selectMovieFolder() {
    setError(null);

    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select your movie library",
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    await scanLibrary(selected);
  }

  /*
   * Scan and synchronize a library.
   */
  async function scanLibrary(
    folder: string
  ) {
    setScanning(true);
    setError(null);

    try {
      const libraryName =
        folder
          .split("\\")
          .filter(Boolean)
          .pop() || "Movie Library";

      const libraryId =
        await addLibrary(
          libraryName,
          folder
        );

      const scannedMovies =
        await invoke<ScannedMovie[]>(
          "scan_movies",
          {
            folderPath: folder,
          }
        );

      await synchronizeMovies(
        libraryId,
        scannedMovies
      );

      /*
       * Reload libraries because this could
       * have created a new one.
       */
      const updatedLibraries =
        await getLibraries();

      setLibraries(updatedLibraries);

      /*
       * Find the current library.
       */
      const currentLibrary =
        updatedLibraries.find(
          (library) =>
            library.id === libraryId
        );

      if (currentLibrary) {
        setSelectedLibrary(
          currentLibrary
        );

        const libraryMovies =
          await getMoviesByLibrary(
            currentLibrary.id
          );

        setMovies(libraryMovies);
      }
    } catch (error) {
      console.error(
        "Library scan failed:",
        error
      );

      setError(String(error));
    } finally {
      setScanning(false);
    }
  }

  /*
   * Initial loading state.
   */
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading JustChill...</p>
      </div>
    );
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          JustChill
        </div>

        <div className="sidebar-section">

          <div className="sidebar-section-header">
            <span>LIBRARIES</span>

            <button
              className="add-library-small"
              onClick={selectMovieFolder}
              title="Add library"
            >
              +
            </button>
          </div>

          <div className="library-list">

            {libraries.map((library) => (
              <button
                key={library.id}
                className={`library-item ${
                  selectedLibrary?.id ===
                  library.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  selectLibrary(library)
                }
              >
                <span className="library-icon">
                  📁
                </span>

                <span className="library-name">
                  {library.name}
                </span>
              </button>
            ))}

            {libraries.length === 0 && (
              <p className="no-libraries">
                No libraries yet.
              </p>
            )}

          </div>
        </div>

        <button
          className="add-library-button"
          onClick={selectMovieFolder}
        >
          <span>+</span>
          Add Library
        </button>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        <header className="content-header">

          <div>
            <p className="page-label">
              LIBRARY
            </p>

            <h1>
              {selectedLibrary
                ? selectedLibrary.name
                : "My Library"}
            </h1>

            {selectedLibrary && (
              <p className="library-path">
                {selectedLibrary.path}
              </p>
            )}
          </div>

          {selectedLibrary && (
            <button
              className="scan-button"
              onClick={() =>
                scanLibrary(
                  selectedLibrary.path
                )
              }
              disabled={scanning}
            >
              {scanning
                ? "Scanning..."
                : "↻ Scan Library"}
            </button>
          )}

        </header>
        <div className="library-toolbar">

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="toolbar-controls">

            <select
              value={yearFilter ?? ""}
              onChange={(event) => {
                const value =
                  event.target.value;

                setYearFilter(
                  value === ""
                    ? null
                    : Number(value)
                );
              }}
              aria-label="Filter by year"
            >
              <option value="">
                All Years
              </option>

              {availableYears.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption
                )
              }
              aria-label="Sort movies"
            >
              <option value="title-asc">
                Title A–Z
              </option>

              <option value="title-desc">
                Title Z–A
              </option>

              <option value="year-newest">
                Newest
              </option>

              <option value="year-oldest">
                Oldest
              </option>
            </select>

          </div>

        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {selectedLibrary && (
          <div className="library-summary">
            <span>
              {filteredMovies.length} of{" "}
              {movies.length}{" "}
              {movies.length === 1
                ? "movie"
                : "movies"}
            </span>
          </div>
        )}

        {scanning && (
          <div className="scanning-message">
            Scanning your library...
          </div>
        )}

        {!selectedLibrary && (
          <div className="empty-state">

            <div className="empty-icon">
              🎬
            </div>

            <h2>
              Your library is empty
            </h2>

            <p>
              Add a folder containing your
              movies to get started.
            </p>

            <button
              className="primary-button"
              onClick={selectMovieFolder}
            >
              Add Movie Library
            </button>

          </div>
        )}

        {selectedLibrary &&
          movies.length === 0 &&
          !scanning && (
            <div className="empty-state">

              <div className="empty-icon">
                📭
              </div>

              <h2>
                No movies found
              </h2>

              <p>
                This library doesn't contain
                any supported movie files.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  scanLibrary(
                    selectedLibrary.path
                  )
                }
              >
                Scan Library
              </button>

            </div>
          )}
        {selectedMovie && (
          <div
            className="movie-details-backdrop"
            onClick={() => setSelectedMovie(null)}
          >
            <div
              className="movie-details-modal"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                className="movie-details-close"
                onClick={() => setSelectedMovie(null)}
                aria-label="Close movie details"
              >
                ×
              </button>

              <div className="movie-details-poster">
                🎬
              </div>

              <div className="movie-details-content">
                <p className="page-label">
                  MOVIE
                </p>

                <h2>
                  {selectedMovie.title}
                </h2>

                {selectedMovie.year && (
                  <p className="movie-details-year">
                    {selectedMovie.year}
                  </p>
                )}

                <p className="movie-details-path">
                  {selectedMovie.path}
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    handlePlayMovie(selectedMovie)
                  }
                >
                  ▶ Play
                </button>
              </div>
            </div>
          </div>
        )}
        {filteredMovies.length > 0 && (
          <div className="movie-grid">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
                onPlay={handlePlayMovie}
              />
            ))}

          </div>
        )}

      </main>
      {playingMovie && (
        <VideoPlayer
          movie={playingMovie}
          onClose={() =>
            setPlayingMovie(null)
          }
        />
      )}
    </div>
  );
}

export default App;