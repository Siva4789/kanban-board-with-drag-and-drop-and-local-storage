/**
 * Yara Kanban Board - Core Script
 * Handles LocalStorage state, drag-and-drop mechanics, and dynamic task CRUD operations.
 */

const STORAGE_KEY = 'yara_kanban_tasks_v1';

// Default initial tasks if none present in localStorage
const defaultTasks = [
    {
        id: 'task-1',
        title: 'Design System Architecture',
        description: 'Define tailwind tokens, typography scale, and color palettes.',
        status: 'done',
        priority: 'high'
    },
    {
        id: 'task-2',
        title: 'Implement Drag and Drop',
        description: 'Attach HTML5 drag & drop listeners to cards and columns.',
        status: 'inprogress',
        priority: 'high'
    },
    {
        id: 'task-3',
        title: 'Task Management Features',
        description: 'Enable full create, edit, and delete capability with localStorage sync.',
        status: 'todo',
        priority: 'medium'
    }
];

let tasks = [];
let draggedCardId = null;

// Initialize application state on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderBoard();
    setupEventListeners();
    setupDragAndDrop();
});

/**
 * LocalStorage persistence functions
 */
function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            tasks = JSON.parse(stored);
        } else {
            tasks = defaultTasks;
            saveTasks();
        }
    } catch (e) {
        console.error('Failed to load tasks from localStorage:', e);
        tasks = defaultTasks;
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
    }
}

/**
 * Render all tasks onto the board and update column counters
 */
function renderBoard() {
    const todoContainer = document.getElementById('todo-dropzone');
    const inprogressContainer = document.getElementById('inprogress-dropzone');
    const doneContainer = document.getElementById('done-dropzone');

    // Clear existing contents
    todoContainer.innerHTML = '';
    inprogressContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    let counts = { todo: 0, inprogress: 0, done: 0 };

    tasks.forEach(task => {
        counts[task.status] = (counts[task.status] || 0) + 1;
        const cardElement = createTaskCardElement(task);
        
        if (task.status === 'todo') {
            todoContainer.appendChild(cardElement);
        } else if (task.status === 'inprogress') {
            inprogressContainer.appendChild(cardElement);
        } else if (task.status === 'done') {
            doneContainer.appendChild(cardElement);
        }
    });

    // Update column counters
    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-inprogress').textContent = counts.inprogress;
    document.getElementById('count-done').textContent = counts.done;
}

/**
 * Create DOM element for an individual task card
 */
function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition cursor-grab active:cursor-grabbing group relative';
    card.draggable = true;
    card.dataset.id = task.id;

    // Priority Badge styling
    let priorityClass = 'bg-slate-800 text-slate-300';
    if (task.priority === 'high') {
        priorityClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    } else if (task.priority === 'medium') {
        priorityClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    } else if (task.priority === 'low') {
        priorityClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }

    card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-2">
            <h4 class="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">${escapeHTML(task.title)}</h4>
            <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button onclick="openEditTaskModal('${task.id}')" class="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition" title="Edit Task">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteTask('${task.id}')" class="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Delete Task">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        ${task.description ? `<p class="text-xs text-slate-400 line-clamp-2 mb-3">${escapeHTML(task.description)}</p>` : ''}
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${priorityClass}">${task.priority}</span>
            <span class="text-[10px] text-slate-500 font-mono">#${task.id.slice(-4)}</span>
        </div>
    `;

    // Attach dragstart and dragend directly to card element
    card.addEventListener('dragstart', (e) => {
        draggedCardId = task.id;
        setTimeout(() => card.classList.add('opacity-40'), 0);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40');
        draggedCardId = null;
        document.querySelectorAll('.dropzone').forEach(dz => dz.classList.remove('drag-over'));
    });

    return card;
}

/**
 * Drag and Drop zone event handlers
 */
function setupDragAndDrop() {
    const dropzones = document.querySelectorAll('.dropzone');

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', (e) => {
            if (!zone.contains(e.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const newStatus = zone.dataset.status;
            if (draggedCardId && newStatus) {
                updateTaskStatus(draggedCardId, newStatus);
            }
        });
    });
}

/**
 * Update task status on drop or move
 */
function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveTasks();
        renderBoard();
    }
}

/**
 * Modal UI & Event Listeners
 */
function setupEventListeners() {
    const modal = document.getElementById('task-modal');
    const openModalBtn = document.getElementById('open-add-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const taskForm = document.getElementById('task-form');

    openModalBtn.addEventListener('click', () => openNewTaskModalWithStatus('todo'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleTaskFormSubmit();
    });
}

function openNewTaskModalWithStatus(status) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskForm = document.getElementById('task-form');

    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-status').value = status;
    document.getElementById('task-priority').value = 'medium';

    modal.classList.remove('hidden');
    document.getElementById('task-title').focus();
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');

    modalTitle.textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;

    modal.classList.remove('hidden');
    document.getElementById('task-title').focus();
}

function closeModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('hidden');
}

function handleTaskFormSubmit() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const status = document.getElementById('task-status').value;
    const priority = document.getElementById('task-priority').value;

    if (!title) return;

    if (id) {
        // Edit existing task
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.status = status;
            task.priority = priority;
        }
    } else {
        // Create new task
        const newTask = {
            id: 'task-' + Date.now(),
            title,
            description,
            status,
            priority
        };
        tasks.push(newTask);
    }

    saveTasks();
    renderBoard();
    closeModal();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderBoard();
    }
}

/**
 * Utility helper to escape HTML and prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
