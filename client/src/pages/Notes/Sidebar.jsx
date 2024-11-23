const Sidebar = ({
    notes,
    onAddNote,
    onDeleteNote,
    activeNote,
    setActiveNote,
}) => {
    const sortedNotes = notes.sort((a, b) => b.lastModified - a.lastModified);

    // Log to check data
    console.log("Notes:", sortedNotes);

    return (
        <div className="app-sidebar">
            <div className="app-sidebar-header">
                <h1>Notes</h1>
                <button onClick={onAddNote}>Add</button>
            </div>
            <div className="app-sidebar-notes">
                {sortedNotes.map(({ id, title, projectTitle, day, lastModified }, i) => (
                    <div
                        key={id}
                        className={`app-sidebar-note ${id === activeNote ? "active" : ""}`}
                        onClick={() => setActiveNote(id)}
                    >
                        <div className="sidebar-note-title">
                            <strong>{title || "Untitled Note"}</strong>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteNote(id); }}>Delete</button>
                        </div>
                        
                        <div className="sidebar-note-details">
                            <strong>Project: </strong> {projectTitle || "Untitled Project"}
                        </div>

                        <small className="note-meta">
                            Last Modified{" "}
                            {new Date(lastModified).toLocaleDateString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Sidebar;
