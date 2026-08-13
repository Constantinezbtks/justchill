import Database from "@tauri-apps/plugin-sql";

export interface Library {
  id: number;
  name: string;
  path: string;
}

export interface Movie {
  id: number;
  library_id: number;
  name: string;
  title: string;
  year: number | null;
  path: string;
}

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    console.log("Opening MyFlix database...");

    db = await Database.load("sqlite:myflix_v4.db");

    console.log("MyFlix database opened successfully");
  }

  return db;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();

  console.log("Database initialized through migrations.");
}

export async function addMovie(movie: {
  name: string;
  title: string;
  year: number | null;
  path: string;
}): Promise<void> {
  const database = await getDatabase();

  await database.execute(
    `
      INSERT OR IGNORE INTO movies
      (name, title, year, path)
      VALUES ($1, $2, $3, $4)
    `,
    [
      movie.name,
      movie.title,
      movie.year,
      movie.path,
    ]
  );
}

export async function synchronizeMovies(
  libraryId: number,
  scannedMovies: {
    name: string;
    title: string;
    year: number | null;
    path: string;
  }[]
): Promise<void> {
  const database = await getDatabase();

  const existingMovies = await database.select<{
    path: string;
    name: string;
    title: string;
    year: number | null;
  }[]>(
    `
      SELECT
        path,
        name,
        title,
        year
      FROM movies
      WHERE library_id = $1
    `,
    [libraryId]
  );

  const existingByPath = new Map(
    existingMovies.map((movie) => [
      movie.path,
      movie,
    ])
  );

  const scannedPaths = new Set<string>();

  for (const movie of scannedMovies) {
    scannedPaths.add(movie.path);

    const existing =
      existingByPath.get(movie.path);

    /*
     * New movie.
     */
    if (!existing) {
      await database.execute(
        `
          INSERT INTO movies
          (
            library_id,
            name,
            title,
            year,
            path
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          libraryId,
          movie.name,
          movie.title,
          movie.year,
          movie.path,
        ]
      );

      continue;
    }

    /*
     * Existing movie.
     * Update only if something changed.
     */
    if (
      existing.name !== movie.name ||
      existing.title !== movie.title ||
      existing.year !== movie.year
    ) {
      await database.execute(
        `
          UPDATE movies
          SET
            name = $1,
            title = $2,
            year = $3
          WHERE library_id = $4
            AND path = $5
        `,
        [
          movie.name,
          movie.title,
          movie.year,
          libraryId,
          movie.path,
        ]
      );
    }
  }

  /*
   * Remove movies that no longer exist
   * in the filesystem.
   */
  for (const existing of existingMovies) {
    if (!scannedPaths.has(existing.path)) {
      await database.execute(
        `
          DELETE FROM movies
          WHERE library_id = $1
            AND path = $2
        `,
        [
          libraryId,
          existing.path,
        ]
      );
    }
  }
}

export async function addLibrary(
  name: string,
  path: string
): Promise<number> {
  const database = await getDatabase();

  await database.execute(
    `
      INSERT OR IGNORE INTO libraries
      (name, path)
      VALUES ($1, $2)
    `,
    [name, path]
  );

  const result = await database.select<{ id: number }[]>(
    `
      SELECT id
      FROM libraries
      WHERE path = $1
    `,
    [path]
  );

  if (result.length === 0) {
    throw new Error("Failed to create library.");
  }

  return result[0].id;
}

export async function getMoviesByLibrary(
  libraryId: number
): Promise<Movie[]> {
  const database = await getDatabase();

  return await database.select<Movie[]>(
    `
      SELECT
        id,
        library_id,
        name,
        title,
        year,
        path
      FROM movies
      WHERE library_id = $1
      ORDER BY title COLLATE NOCASE ASC
    `,
    [libraryId]
  );
}

export async function getMovieCount(
  libraryId: number
): Promise<number> {
  const database = await getDatabase();

  const result = await database.select<
    { count: number }[]
  >(
    `
      SELECT COUNT(*) AS count
      FROM movies
      WHERE library_id = $1
    `,
    [libraryId]
  );

  return result[0]?.count ?? 0;
}

export async function searchMovies(
  searchTerm: string
): Promise<Movie[]> {
  const database = await getDatabase();

  return await database.select<Movie[]>(
    `
      SELECT
        id,
        library_id,
        name,
        title,
        year,
        path
      FROM movies
      WHERE title LIKE $1
      ORDER BY title COLLATE NOCASE ASC
    `,
    [`%${searchTerm}%`]
  );
}

export async function getMovies(): Promise<Movie[]> {
  const database = await getDatabase();

  return await database.select<Movie[]>(`
    SELECT
      id,
      library_id,
      name,
      title,
      year,
      path
    FROM movies
    ORDER BY title COLLATE NOCASE ASC
  `);
}

export async function getLibraries(): Promise<Library[]> {
  const database = await getDatabase();

  return await database.select<Library[]>(`
    SELECT
      id,
      name,
      path
    FROM libraries
    ORDER BY name COLLATE NOCASE ASC
  `);
}

export async function getAllMoviePaths(): Promise<string[]> {
  const database = await getDatabase();

  const rows = await database.select<{ path: string }[]>(`
    SELECT path
    FROM movies
  `);

  return rows.map((row) => row.path);
}

export async function getLibraryByPath(
  path: string
): Promise<Library | null> {
  const database = await getDatabase();

  const result = await database.select<Library[]>(
    `
      SELECT
        id,
        name,
        path
      FROM libraries
      WHERE path = $1
    `,
    [path]
  );

  return result.length > 0 ? result[0] : null;
}

export async function deleteMovieByPath(
  path: string
): Promise<void> {
  const database = await getDatabase();

  await database.execute(
    `
      DELETE FROM movies
      WHERE path = $1
    `,
    [path]
  );
}



