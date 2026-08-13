CREATE TABLE libraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    year INTEGER,
    path TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (library_id)
        REFERENCES libraries(id)
        ON DELETE CASCADE,

    UNIQUE(library_id, path)
);