# JustChill

A desktop Netflix-style media library for managing and watching movies stored locally on your PC.
JustChill scans local movie folders, stores the library information in SQLite, and provides a modern interface for browsing, searching, filtering, and playing locally stored movies.

# Features
* Recursive scanning of local movie folders
* Automatic movie title and year extraction from filenames
* Multiple movie libraries
* SQLite-based persistent library
* Library synchronization
* Database migrations and indexes
* Movie search
* Year filtering
* Movie sorting
* Interactive movie cards
* Movie details interface
* Local video playback
* Dark media-focused UI
# Tech Stack
* Tauri 2
* React
* TypeScript
* Vite
* Rust
* SQLite
* Tauri SQL Plugin
* HTML5 Video
* CSS
# Disclaimer
JustChill is a personal/local media management application. It does not provide or distribute movies. Users are responsible for the media files they use with the application.
### Library

<img width="2559" height="1361" alt="Image" src="https://github.com/user-attachments/assets/0589d269-0e97-4782-a343-1ca76a3a1d37" />

### Player

<img width="2555" height="1359" alt="Image" src="https://github.com/user-attachments/assets/7125264c-ad66-45d3-9065-d5cf5b7222f1" />

### Setup & Usage

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/myflix.git
cd myflix
```

2. **Install dependencies**

```bash
npm install
```

3. **Run MyFlix**

```bash
npm run tauri dev
```

4. **Add your movie library**

   * Open MyFlix.
   * Click **Add Library**.
   * Select a folder containing your movies.
   * MyFlix recursively scans the folder and stores the library in SQLite.

5. **Browse and watch**

   * Select a library from the sidebar.
   * Search, filter, and sort your movies.
   * Click a movie for details or **▶** to play it.

**Supported formats:** `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.m4v`

> **Note:** The project is currently in development, so some video formats/codecs may not work with the built-in player yet.
