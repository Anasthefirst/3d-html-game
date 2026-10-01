# Simple 3D HTML Game

This repository contains a lightweight 3D browser game built with Three.js.

## Features
- 3D arena and basic lighting
- Keyboard movement with WASD
- Jumping and platform-like collisions
- Axis-aware collision resolution with wall and floor blocking
- Simple goal pickup loop

## Run locally
Open `index.html` in a browser, or serve the folder with a local HTTP server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes
The focus of this early version is collision stability and bug removal across X, Y, and Z axes.
