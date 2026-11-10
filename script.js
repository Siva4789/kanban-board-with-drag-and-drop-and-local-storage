/**
 * Local Storage Integration Module
 * Handles saving and loading the board state to/from browser localStorage.
 */

const STORAGE_KEY = 'yara_kanban_board_state_v1';

/**
 * Default initial state if no storage exists
 */
const defaultState = {
    columns: [
        {
            id: 'todo',
            title: 'To Do',
            tasks: [
                { id: 'task-1', title: 'Design system review', description: 'Review the latest UI components and design tokens.', priority: 'High', tags: ['Design', 'UI'] },
                { id: 'task-2', title: 'Setup repository', description: 'Initialize Git repository and setup project structure.', priority: 'Medium', tags: ['DevOps'] }
            ]
        },
        {
            id: 'in-progress',
            title: 'In Progress',
            tasks: [
                { id: 'task-3', title: 'Local Storage Integration', description: 'Implement functions to save and load board state.', priority: 'High', tags: ['Feature', 'Storage'] }
            ]
        },
        {
            id: 'review',
            title: 'Review',
            tasks: [
                { id: 'task-4', title: 'Security audit', description: 'Check dependencies for known vulnerabilities.', priority: 'Low', tags: ['Security'] }
            ]
        },
        {
            id: 'done',
            title: 'Done',
            tasks: [
                { id: 'task-5', title: 'Project Initialization', description: 'Setup initial HTML and CSS layout.', priority: 'Medium', tags: ['Setup'] }
            ]
        }
    ]
};

/**
 * Save the current board state to localStorage
 * @param {Object} state - The board state object to save
 */
function saveBoardState(state) {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serializedState);
        console.log('Board state successfully saved to localStorage.');
    } catch (error) {
        console.error('Failed to save board state to localStorage:', error);
    }
}

/**
 * Load the board state from localStorage
 * @returns {Object} The loaded state or defaultState if none exists
 */
function loadBoardState() {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            console.log('No existing board state found. Initializing with default state.');
            return defaultState;
        }
        return JSON.parse(serializedState);
    } catch (error) {
        console.error('Failed to load board state from localStorage, falling back to default:', error);
        return defaultState;
    }
}

/**
 * Clear stored board state and reset to default
 */
function resetBoardState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Board state cleared from localStorage.');
        return defaultState;
    } catch (error) {
        console.error('Failed to reset board state:', error);
        return defaultState;
    }
}

// Auto-load and initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const currentState = loadBoardState();
    console.log('Loaded board state:', currentState);
    // Future task rendering hooks can be attached here
});
