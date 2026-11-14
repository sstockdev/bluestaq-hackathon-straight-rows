import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import Reference from "./tour/Reference";
import NotesWindow from "./tour/NotesWindow";

// The same page serves three windows: the app, the presenter's notes (?notes=1), and the presenter's reference (?reference=1).
const params = new URLSearchParams(window.location.search);
const page = params.has("notes") ? <NotesWindow /> : params.has("reference") ? <Reference /> : <App />;

createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);
