# 🗺️ SIGEDUNG — Campus Navigator

> An interactive indoor & outdoor navigation platform for Telkom University campus. Walk through building entrances and explore interiors — all from your browser.

**[View Live →](https://sigedung.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ Interactive Map | Leaflet.js-powered campus map with real-world satellite imagery |
| 📍 Precise Locations | Buildings plotted with accurate GPS coordinates |
| 🚪 Entrance Previews | Street-view style photos for every building entrance |
| 🏢 Indoor Navigation | Scene-to-scene walkthrough of building interiors |
| ⌨️ Keyboard Support | WASD / arrow keys for desktop navigation inside buildings |
| 📱 Fully Responsive | Optimized for both desktop and mobile — bottom sheet UI on small screens |
| ⚡ Image Preloading | Adjacent scenes preload in the background for instant transitions |
| 🔗 Deep Linking | Every view is URL-addressable — shareable and bookmarkable |

---

## 🛠️ Tech Stack

```
HTML5 · CSS3 · JavaScript ES6 Modules
Leaflet.js · Esri World Imagery · Google Fonts (Outfit)
Vercel (Hosting)
```

No build tools. No frameworks. No dependencies beyond Leaflet — ships as pure static files.

---

## ⚙️ How It Works

The app is built around a single JSON file that acts as the brain of the entire system.

**`campus.json`** stores three things per building:
1. **Location** — GPS coordinates for the map marker
2. **Entrance** — coordinates + image for the entrance preview
3. **Scenes** — a graph of indoor rooms, each linked to its neighbors by direction (up / down / left / right)

The navigation engine reads this graph and renders whichever scene the user navigates to, creating a seamless virtual walkthrough without any server-side logic.

```
Map → click building marker
  → Entrance preview
    → "Enter Building" button
      → Indoor scene graph
        → Navigate via arrows or WASD
```

---

## 📂 Project Structure

```
sigedung/
│
├── index.html                  # Campus map + building list
├── entrance.html               # Building entrance preview
├── indoor.html                 # Indoor walkthrough module
│
├── data/
│   └── campus.json             # All buildings, coordinates, scenes & paths
│
├── assets/
│   ├── entrance/               # Entrance preview photos
│   ├── floorplan/              # Indoor scene photos
│   ├── thumb/                  # Building thumbnail images
│   └── starting/               # Map background image
│
├── styles/
│   ├── tokens.css              # Design tokens (colors, spacing, easing) + reset
│   ├── components.css          # Shared UI: topbar, arrows, spinners, error states
│   ├── map.css                 # Sidebar, Leaflet overrides, building cards
│   ├── entrance.css            # Entrance scene, action buttons
│   └── indoor.css              # Scene panel, view area, HUD, floor selector
│
└── scripts/
    ├── utils.js                # Shared: fetchCampusData, URL params, error injection
    ├── map.js                  # Leaflet map, sidebar collapse, building list, search
    ├── entrance.js             # Entrance image load, arrow, Google Maps link
    └── indoor.js               # Scene graph navigation, floor switching, keyboard
```

---

## 🏗️ Adding a New Building

All content is data-driven. No code changes needed — just update `campus.json`.

**1. Add a building entry:**
```json
{
  "id": "your-building-id",
  "name": "Building Name",
  "thumbnail": "assets/thumb/your-building.jpg",
  "location": { "lat": -6.9744, "lng": 107.6310 },
  "entrance": {
    "lat": -6.9734,
    "lng": 107.6320,
    "image": "assets/entrance/your-building-entrance.jpg"
  },
  "floors": [ ... ]
}
```

**2. Add scenes to a floor:**
```json
{
  "floor": 1,
  "name": "Ground Floor",
  "startScene": "entrance",
  "scenes": {
    "entrance": {
      "name": "Lobby",
      "img": "assets/floorplan/lobby.jpg",
      "left": "corridor-a",
      "right": "corridor-b"
    },
    "corridor-a": {
      "img": "assets/floorplan/corridor-a.jpg",
      "right": "entrance",
      "up": "room-101"
    }
  }
}
```

Each scene can have up to 4 neighbors: `up`, `down`, `left`, `right`. Omit any direction that has no neighbor.

---

## 📸 Screenshots

| Campus Map | Building Entrance | Indoor Navigation |
|---|---|---|
| Sidebar + satellite map with building markers | Entrance photo with directions button | Scene-to-scene walkthrough with arrow controls |

---

## 📈 Roadmap

- [ ] **Room Search** — find specific rooms or offices by name
- [ ] **Smart Routing** — automated pathfinding from point A to point B
- [ ] **Multi-building** — expand beyond Gedung Cacuk to the full campus
- [ ] **Floor Plans** — overlay 2D floor plan alongside the scene view
- [ ] **Backend / CMS** — replace static JSON with a live editable database
- [ ] **GPS Blue Dot** — real-time location tracking for on-campus users

---

## 🐛 Known Limitations

- Navigation is photo-based, not 3D — scene coverage depends on available photos
- Adding buildings requires manual photo capture and JSON authoring
- No offline support (images are not cached via Service Worker yet)

---

## 👤 Author

Built by **Prince Konou**

---

## ⭐ Acknowledgements

- [Leaflet.js](https://leafletjs.com) — open-source mapping library
- [Esri / ArcGIS](https://www.esri.com) — satellite imagery tiles
- [Google Fonts](https://fonts.google.com/specimen/Outfit) — Outfit typeface
