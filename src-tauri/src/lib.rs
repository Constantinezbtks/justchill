use std::fs;
use std::path::Path;
use tauri_plugin_sql::{
    Migration,
    MigrationKind,
};

#[derive(serde::Serialize)]
struct MovieFile {
    name: String,
    title: String,
    year: Option<u16>,
    path: String,
}



fn is_movie_file(path: &Path) -> bool {
    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or("")
        .to_lowercase();

    matches!(
        extension.as_str(),
        "mp4" | "mkv" | "avi" | "mov" | "webm" | "m4v"
    )
}

fn parse_movie_filename(filename: &str) -> (String, Option<u16>) {
    let name_without_extension = Path::new(filename)
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or(filename);

    let mut title = name_without_extension.to_string();
    let mut year = None;

    /*
     * Look for a four digit year.
     *
     * Examples:
     *
     * Interstellar (2014)
     * Inception.2010.1080p
     * The.Matrix.1999.BluRay
     */

    let characters: Vec<char> = name_without_extension.chars().collect();

    for i in 0..characters.len().saturating_sub(3) {
        let candidate: String = characters[i..i + 4].iter().collect();

        if let Ok(number) = candidate.parse::<u16>() {
            if (1900..=2099).contains(&number) {
                year = Some(number);

                title = name_without_extension[..i].to_string();

                break;
            }
        }
    }

    /*
     * Clean common filename separators.
     */

    title = title
        .replace('.', " ")
        .replace('_', " ")
        .replace('-', " ");

    /*
     * Remove common release tags.
     */

    let unwanted_tags = [
        "1080p",
        "720p",
        "2160p",
        "4k",
        "bluray",
        "brrip",
        "webrip",
        "web-dl",
        "webdl",
        "hdr",
        "x264",
        "x265",
        "h264",
        "h265",
        "hevc",
        "aac",
        "dts",
        "remux",
    ];

    for tag in unwanted_tags {
        title = title.replace(tag, " ");
        title = title.replace(&tag.to_uppercase(), " ");
    }

    /*
     * Clean multiple spaces.
     */

    title = title
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ");

    (title.trim().to_string(), year)
}

fn scan_directory(path: &Path, movies: &mut Vec<MovieFile>) -> Result<(), String> {
    let entries = fs::read_dir(path)
        .map_err(|error| format!("Failed to read directory: {}", error))?;

    for entry in entries {
        let entry = entry
            .map_err(|error| format!("Failed to read directory entry: {}", error))?;

        let path = entry.path();

        /*
         * If it's a directory, scan it recursively.
         */

        if path.is_dir() {
            scan_directory(&path, movies)?;
            continue;
        }

        /*
         * Ignore files that aren't movies.
         */

        if !is_movie_file(&path) {
            continue;
        }

        let filename = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("Unknown");

        let (title, year) = parse_movie_filename(filename);

        movies.push(MovieFile {
            name: filename.to_string(),
            title,
            year,
            path: path.to_string_lossy().to_string(),
        });
    }

    Ok(())
}

#[tauri::command]
fn scan_movies(folder_path: String) -> Result<Vec<MovieFile>, String> {
    let path = Path::new(&folder_path);

    if !path.exists() {
        return Err("The selected folder does not exist.".to_string());
    }

    if !path.is_dir() {
        return Err("The selected path is not a folder.".to_string());
    }

    let mut movies = Vec::new();

    scan_directory(path, &mut movies)?;

    movies.sort_by_key(|movie| movie.title.to_lowercase());

    Ok(movies)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:myflix_v4.db",
                    vec![
                        Migration {
                            version: 1,
                            description: "initial schema",
                            sql: include_str!("../migrations/001_initial_schema.sql"),
                            kind: MigrationKind::Up,
                        },
                        Migration {
                            version: 2,
                            description: "add indexes",
                            sql: include_str!("../migrations/002_add_indexes.sql"),
                            kind: MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![scan_movies])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}