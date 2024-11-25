import React, { useEffect, useState } from "react";
import './App.css';
import Home from './pages/Home/Home';
import ProjectDashboard from './pages/Dashboard/project-dashboard/ProjectDashboard';
import AdminDashboard from './pages/Dashboard/admin-dashboard/AdminDashboard';
import Sidebar from "./pages/Notes/Sidebar";
import Notes from "./pages/Notes/Notes";
import { ThemeProvider } from "styled-components";
import { darkTheme } from "./utils/Theme";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { closeSnackbar } from "./redux/snackbarSlice";
import { RecoilRoot } from 'recoil';
import uuid from "react-uuid";

function App() {
  // Snackbar state for notifications
  const snackbarState = useSelector((state) => state.snackbar);
  const dispatch = useDispatch();

  // Note-taking state and logic
  const [notes, setNotes] = useState(
    localStorage.notes ? JSON.parse(localStorage.notes) : []
  );
  const [activeNote, setActiveNote] = useState(null);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const onAddNote = () => {
    const newNote = {
      id: uuid(),
      title: "Untitled Note",
      body: "",
      lastModified: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote.id);
  };

  const onDeleteNote = (noteId) => {
    setNotes(notes.filter(({ id }) => id !== noteId));
    if (noteId === activeNote) {
      setActiveNote(null);
    }
  };

  const onUpdateNote = (updatedNote) => {
    const updatedNotesArr = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note
    );
    setNotes(updatedNotesArr);
  };

  const getActiveNote = () => {
    return notes.find((note) => note.id === activeNote);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    dispatch(closeSnackbar());
  };

  return (
    <RecoilRoot>
      <DndProvider backend={HTML5Backend}>
        <ThemeProvider theme={darkTheme}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard/user" element={<ProjectDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route
                path="/Notes"
                element={
                  <div className="App">
                    <Sidebar
                      notes={notes}
                      onAddNote={onAddNote}
                      onDeleteNote={onDeleteNote}
                      activeNote={activeNote}
                      setActiveNote={setActiveNote}
                    />
                    <Notes activeNote={getActiveNote()} onUpdateNote={onUpdateNote} />
                  </div>
                }
              />
            </Routes>

            {/* Snackbar for notifications */}
            <Snackbar
              open={snackbarState.open}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
            >
              <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity}>
                {snackbarState.message}
              </Alert>
            </Snackbar>
          </BrowserRouter>
        </ThemeProvider>
      </DndProvider>
    </RecoilRoot>
  );
}

export default App;
