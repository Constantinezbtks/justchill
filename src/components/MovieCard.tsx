import type { Movie } from "../services/database";

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

function MovieCard({
  movie,
  onClick,
  onPlay,
}: MovieCardProps) {
  return (
    <article
      className="movie-card"
      onClick={() => onClick(movie)}
    >
      <div className="movie-poster">
        <div className="movie-placeholder">
          <span>🎬</span>
        </div>

        <div className="movie-overlay">
          <button
            className="movie-play-button"
            onClick={(event) => {
              event.stopPropagation();
              onPlay(movie);
            }}
            aria-label={`Play ${movie.title}`}
          >
            ▶
          </button>
        </div>
      </div>

      <div className="movie-card-info">
        <h3>{movie.title}</h3>

        {movie.year && (
          <span className="movie-year">
            {movie.year}
          </span>
        )}
      </div>
    </article>
  );
}

export default MovieCard;