import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import NotesWindow from "./tour/NotesWindow";

// The same page serves two windows: the app, and with ?notes=1 the presenter's notes that follow its tour.
const notes = new URLSearchParams(window.location.search).has("notes");

createRoot(document.getElementById("root")!).render(<StrictMode>{notes ? <NotesWindow /> : <App />}</StrictMode>);
