# WHEN_IS_THE_NEXT?

> A sci-fi terminal interface for tracking the universe's schedule.

**When Is The Next?** is a React-based web application that visualizes time until significant astronomical, chronological, and deep-time events. It features a "BIOS" boot sequence, CRT monitor aesthetics, and real-time geolocation data to answer the ultimate question: *How long do we have?*

## 🖥️ Features

* **BIOS Boot Sequence:** Authentic 1.7s startup with CRT scanlines, flicker, and phosphor glow effects.
* **Dynamic Geolocation:** Uses IP triangulation to calculate precise local sunsets, blue hours, and solar noons.
* **Event Matrix:** Tracks everything from the next "Friday the 13th" to "Voyager 1's Arrival at Gliese 445".
* **Sci-Fi UI:** "Chronos OS" aesthetic with orbital geometry, glitch effects, and liquid text.
* **Mobile Optimized:** Responsive layout with specific adjustments for handheld viewports.

## 🛠️ Tech Stack

* **Core:** React (Vite)
* **Animation:** Framer Motion
* **Calculations:** SunCalc, date-fns
* **Styling:** SCSS, CSS Variables

## 🚀 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ShubhmDalvi/whenisthenext.git
    cd when-is-the-next
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Initialize the system**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```text
/src
  ├── App.jsx        # Main Logic & Event Data
  ├── App.css        # Global Styles, CRT Effects, & Responsive Rules
  ├── assets         # Fonts & Static Media
  └── main.jsx       # Entry Point