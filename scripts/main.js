
window.addEventListener('load', () => {
    let notes = [];
    const notesListContainer = document.querySelector('#notes-list');
    const addButton = document.querySelector('#add-button');

    function appendNoteToList(note) {
        const notesListItem = new NotesListItem(note);

        notesListContainer.appendChild(notesListItem.getElement());

        notesListItem.onCloseButtonClick(() => {
            deleteNote(note.id, (err, res) => {
                if (err) console.error(err);
                const index = notes.map(n => n.id).indexOf(note.id);
                notes.splice(index, 1);
                notesListContainer.removeChild(notesListItem.getElement());
            });
        });

        let saveTitleChangeTimeoutId, saveContentChangeTimeoutId;

        notesListItem.onTitleChange(e => {
            const newTitle = e.target.innerText;

            clearTimeout(saveTitleChangeTimeoutId);

            saveTitleChangeTimeoutId = setTimeout(() => {
                editNote({
                    title: newTitle,
                    content: note.content
                }, note.id, (err, body) => {
                    if (err) console.error(err);
                    note.title = newTitle;
                });
            }, 1000);
        });

        notesListItem.onContentChange(e => {
            const newContent = e.target.innerText;

            clearTimeout(saveContentChangeTimeoutId);

            saveContentChangeTimeoutId = setTimeout(() => {
                editNote({
                    title: note.title,
                    content: newContent
                }, note.id, (err, body) => {
                    if (err) console.error(err);
                    note.content = newContent;
                });
            }, 1000);
        });

        return notesListItem;
    }
    
    getNotes((err, body) => {
        if (err) {
            console.error(err);
            return;
        }

        notes = body.notes;
        notesListContainer.innerHTML = "";
        notes.forEach(note => {
            appendNoteToList(note);
        });
    });

    addButton.addEventListener('click', () => {
        const defaultNote = {
            title: 'Note title',
            content: 'Note content'
        }

        postNote(defaultNote, (err, body) => {
            if (err) {
                console.error(err);
                return;
            }
            
            notes.splice(0, 0, body.note);

            const notesListItem = appendNoteToList(body.note);

            notesListItem.focusTitle();
        });
    })
});

function NotesListItem({title, content, id}) {
    const li = document.createElement('li');
    const article = document.createElement('article');
    const closeButton = document.createElement('button');
    const h1 = document.createElement('h1');
    const p = document.createElement('p');

    li.classList.add('notes-list-item');
    article.classList.add('note-container');
    h1.classList.add('note-title');
    p.classList.add('note-content');
    closeButton.classList.add('close-button');

    li.setAttribute('data-key', id);
    h1.setAttribute('contentEditable', true);
    p.setAttribute('contentEditable', true);

    closeButton.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 18 18"
        >
            <path
                d="
                    M14.53
                    4.53l-1.06-1.06L9
                    7.94 4.53 3.47
                    3.47 4.53 7.94
                    9l-4.47 4.47 1.06
                    1.06L9 10.06l4.47
                    4.47 1.06-1.06L10.06
                    9z
                "
            />
        </svg>
    `;

    li.appendChild(closeButton);
    article.appendChild(h1);
    article.appendChild(p);
    li.appendChild(article);

    h1.innerText = title;
    p.innerText = content;

    // capture h1 enter key press
    h1.addEventListener('keypress', e => {
        if (e.keyCode === 13) {
            e.preventDefault();
            p.focus();
        }
    })

    h1.addEventListener('keyup', e => {
        if (e.keyCode === 27) {
            e.target.blur();
        }
    });

    p.addEventListener('keyup', e => {
        if (e.keyCode === 27) {
            e.target.blur();
        }
    });

    this.getElement = () => {
        return li;
    }

    this.setContent = (content) => {
        p.innerText = content;
    }

    this.setTitle = (title) => {
        h1.innerText = title;
    }

    this.onCloseButtonClick = cb => {
        closeButton.addEventListener('click', cb);
    }

    this.onTitleChange = cb => {
        h1.addEventListener('input', cb);
    }

    this.onContentChange = cb => {
        p.addEventListener('input', cb);
    }

    this.focusTitle = () => {
        h1.focus();
        document.execCommand('selectAll', false, null);
    }
}

function getNotes(cb) {
    fetch('http://localhost:5001/notes')
    .then(res => {
        return res.json();
    })
    .then(body => {
        cb(null, body);
    })
    .catch(e => {
        cb(e);
    });
}

function postNote(note, cb) {
    fetch('http://localhost:5001/notes', {
        method: 'POST',
        body: JSON.stringify(note),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        return res.json()
    })
    .then(body => {
        cb(null, body);
    })
    .catch(e => {
        cb(e);
    })
}

function deleteNote(id, cb) {
    fetch(`http://localhost:5001/notes/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (res.status === 200) cb(null, {})
        else cb(new Error('Failed trying to delete note'));
    })
    .catch(e => {
        cb(e);
    })
}

function editNote(newNote, id, cb) {
    fetch(`http://localhost:5001/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(newNote),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        return res.json()
    })
    .then(body => {
        cb(null, body)
    })
    .catch(e => {
        cb(e);
    })
}