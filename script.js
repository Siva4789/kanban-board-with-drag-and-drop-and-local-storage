/**
 * Yara Kanban - Main Script
 * Handles task management, local storage, UI rendering, and HTML5 Drag & Drop.
 */

// State Management
let tasks = [];

// DOM Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskColumnSelect = document.getElementById('task-column');
const taskPrioritySelect = document.getElementById('task-priority');
const addTaskBtn = document.getElementById('add-task-btn');

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderBoard();
    setupEventListeners();
    setupDragAndDrop();
});

/**
 * Load tasks from Local Storage or initialize defaults if none exist
 */
function loadTasks() {
    const storedTasks = localStorage.getItem('yara_kanban_tasks');
    if (storedTasks) {
        try {
            tasks = JSON.parse(storedTasks);
        } catch (e) {
            console.error('Failed to parse tasks from localStorage', e);
            tasks = getInitialTasks();
        }
    } else {
        tasks = getInitialTasks();
        saveTasks();
    }
}

/**
 * Save current tasks array to Local Storage
 */
function saveTasks() {
    localStorage.setItem('yara_kanban_tasks', JSON.stringify(tasks));
}

/**
 * Default initial tasks for first-time visitors
 */
function getInitialTasks() {
    return [
        {
            id: 'task-1',
            title: 'Design system architecture',
            description: 'Establish standard color palettes, typography scales, and modular component guidelines.',
            column: 'todo',
            priority: 'high'
        },
        {
            id: 'task-2',
            title: 'Implement authentication flow',
            description: 'Secure JWT based authentication with secure httpOnly refresh tokens.',
            column: 'in-progress',
            priority: 'high'
        },
        {
            id: 'task-3',
            title: 'Write unit tests for core utilities',
            description: 'Ensure 90%+ code coverage for parser and storage modules.',
            column: 'review',
            priority: 'medium'
        },
        {
            id: 'task-4',
            title: 'Setup repository and CI/CD pipeline',
            description: 'Configured automated linting, building, and deployment workflows.',
            column: 'done',
            priority: 'low'
        }
    ];
}

/**
 * Set up general UI event listeners
 */
function setupEventListeners() {
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openAddTaskModal('todo'));
    }
}

/**
 * Render the Kanban board columns and task cards
 */
function renderBoard() {
    const columns = ['todo', 'in-progress', 'review', 'done'];
    
    columns.forEach(col => {
        const container = document.getElementById(`list-${col}`);
        const countBadge = document.getElementById(`count-${col}`);
        
        if (!container) return;
        
        // Filter tasks for this column
        const colTasks = tasks.filter(t => t.column === col);
        
        // Update counter badge
        if (countBadge) {
            countBadge.textContent = colTasks.length;
        }
        
        // Clear container
        container.innerHTML = '';
        
        if (colTasks.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                    <i class="fa-regular fa-folder-open text-2xl mb-1"></i>
                    <span class="text-xs">No tasks yet</span>
                </div>
            `;
            return;
        }
        
        // Render task cards
        colTasks.forEach(task => {
            const card = createTaskCardElement(task);
            container.appendChild(card);
        });
    });
}

/**
 * Create DOM element for an individual task card
 */
function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700/80 group';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);
    
    // Priority badge styling
    let priorityBadgeClass = 'bg-slate-800 text-slate-300';
    if (task.priority === 'high') {
        priorityBadgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    } else if (task.priority === 'medium') {
        priorityBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    } else if (task.priority === 'low') {
        priorityBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    
    card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-2">
            <h4 class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug">${escapeHtml(task.title)}</h4>
            <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editTask('${task.id}')" class="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors" title="Edit Task">
                    <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors" title="Delete Task">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            </div>
        </div>
        ${task.description ? `<p class="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">${escapeHtml(task.description)}</p>` : ''}
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${priorityBadgeClass}">${task.priority}</span>
            <div class="flex items-center text-slate-500 text-xs space-x-1">
                <i class="fa-solid fa-grip-vertical text-[10px]"></i>
            </div>
        </div>
    `;
    
    // Attach drag events to the card
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

/**
 * Setup HTML5 Drag and Drop events on columns
 */
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

// Drag & Drop Event Handlers
let draggedTaskId = null;

function handleDragStart(e) {
    draggedTaskId = this.getAttribute('data-task-id');
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedTaskId);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedTaskId = null;
    
    // Remove drag-over states from all columns
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const column = this.closest('.kanban-column');
    if (column) {
        column.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const column = this.closest('.kanban-column');
    // Ensure we are leaving the column container and not entering a child element
    if (column && !column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const column = this.closest('.kanban-column');
    if (!column) return;
    
    column.classList.remove('drag-over');
    const targetColumnId = column.getAttribute('data-column');
    
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    
    if (taskId && targetColumnId) {
        moveTaskColumn(taskId, targetColumnId);
    }
}

/**
 * Move a task to a new column and re-render
 */
function moveTaskColumn(taskId, newColumn) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.column !== newColumn) {
        task.column = newColumn;
        saveTasks();
        renderBoard();
    }
}

/**
 * Open Modal for creating a new task
 */
function openAddTaskModal(defaultColumn = 'todo') {
    modalTitle.textContent = 'Create New Task';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskColumnSelect.value = defaultColumn;
    taskPrioritySelect.value = 'medium';
    
    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
}

/**
 * Open Modal for editing an existing task
 */
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskColumnSelect.value = task.column;
    taskPrioritySelect.value = task.priority;
    
    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
}

/**
 * Close task modal
 */
function closeModal() {
    taskModal.classList.add('hidden');
}

/**
 * Handle form submission for create / edit task
 */
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const column = taskColumnSelect.value;
    const priority = taskPrioritySelect.value;
    
    if (!title) return;
    
    if (id) {
        // Edit existing task
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.column = column;
            task.priority = priority;
        }
    } else {
        // Create new task
        const newTask = {
            id: 'task-' + Date.now(),
            title,
            description,
            column,
            priority
        };
        tasks.push(newTask);
    }
    
    saveTasks();
    renderBoard();
    closeModal();
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderBoard();
    }
}

/**
 * Utility to escape HTML and prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}