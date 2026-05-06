# 🗺️ Campus Navigator

**Campus Navigator** is an interactive web platform designed to take the guesswork out of finding your way around campus. While traditional maps stop at the front door, this tool takes you inside, offering a visual walkthrough of building entrances and indoor hallways.

### 🚀 Key Features

*   **Interactive Mapping:** A fluid map interface built with Leaflet.js for high-performance exploration.
*   **Precise Locations:** Buildings are plotted using real-world coordinates for maximum accuracy.
*   **Entrance Previews:** Visual "street-view" style previews of every building entrance.
*   **Indoor Discovery:** A scene-to-scene navigation system that lets you walk through interiors virtually.
*   **Cross-Platform Ready:** A responsive design optimized for both desktop browsers and mobile devices.

---

### 🛠️ Tech Stack

*   **Core:** HTML5, CSS3, JavaScript (ES6)
*   **Library:** Leaflet.js (Map Rendering)
*   **Data:** JSON-driven architecture for easy updates and scaling.

---

### ⚙️ How It Works

The system is built to be lightweight and scalable. Instead of heavy 3D models, it uses a structured **JSON-based data system** to link locations together.

*   **The Data Brain:** `campus.json` stores all building coordinates, entrance imagery, and the "links" between indoor rooms.
*   **The Navigation Engine:** As you click through the interface, the app dynamically pulls the next scene (Up, Down, Left, or Right) based on the current scene's neighbors, creating a seamless virtual tour.

---

### 📂 Project Structure

```text
├── index.html        # The main landing page and campus map
├── entrance.html     # Dedicated view for building entry points
├── indoor.html       # The indoor "walkthrough" navigation module
├── campus.json       # Central database for all coordinates and paths
└── assets/           # Directory for scene images and thumbnails
```

---

### 📸 Live Demo

Experience the navigation first-hand:  
👉 **[View Live Project](https://sigedung.netlify.app/)**

---

### 📈 Future Roadmap

*   **Search & Discovery:** Quickly find specific rooms or offices by name.
*   **Smart Routing:** Automated pathfinding from point A to point B.
*   **Backend Integration:** Moving from static JSON to a live database for real-time updates.
*   **GPS Tracking:** Real-time "Blue Dot" navigation for users on the move.

---

### 👤 Author

Developed with care by **Konou**.

### ⭐ Acknowledgements

*   **Leaflet.js** – For the robust mapping framework.
*   **OpenStreetMap / Esri** – For the high-quality map tiles and data.
