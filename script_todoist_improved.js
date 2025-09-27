// Improved Todoist integration with OAuth flow
// This replaces the manual token approach with a better UX

class ImprovedTodoistIntegration {
    constructor() {
        this.todoistToken = localStorage.getItem('todoistToken') || '';
        this.todoistTasks = [];
        this.todoistProjectsById = {};
        this.currentTask = null;
    }

    showTodoistModal() {
        // Build modal
        const overlay = document.createElement('div');
        overlay.className = 'focus-stats-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'focus-stats-modal';
        modal.innerHTML = `
            <button class="close-focus-stats-x">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            </button>
            <h3>Integrations</h3>
            <p>Connect your productivity tools to enhance your focus sessions.</p>
            
            <!-- Todoist Integration -->
            <div class="integration-section">
                <div class="integration-header">
                    <div class="integration-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                    </div>
                    <div class="integration-title">
                        <h4>Todoist</h4>
                        <p>Connect your Todoist account to sync tasks</p>
                    </div>
                </div>
                
                <div class="integration-content">
                    <div class="connection-section">
                        <div id="connectTodoistBtn" class="connect-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M13 5h8"/>
                                <path d="M13 12h8"/>
                                <path d="M13 19h8"/>
                                <path d="m3 17 2 2 4-4"/>
                                <rect x="3" y="4" width="6" height="6" rx="1"/>
                            </svg>
                            <span>Connect with Todoist</span>
                        </div>
                        <div id="connectionStatus" class="connection-status" style="display: none;">
                            <span class="status-indicator"></span>
                            <span class="status-text">Connecting...</span>
                        </div>
                    </div>
                    
                    <div class="tasks-section" id="tasksSection" style="display: none;">
                        <div class="tasks-header">
                            <h5>Your Tasks</h5>
                            <span class="tasks-subtitle">Select a task to focus on</span>
                        </div>
                        <div id="todoistTasksList" class="tasks-list"></div>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            try { document.body.removeChild(overlay); } catch (_) {}
        };

        modal.querySelector('.close-focus-stats-x').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Handle OAuth connection
        const connectBtn = modal.querySelector('#connectTodoistBtn');
        const statusEl = modal.querySelector('#connectionStatus');
        const tasksSection = modal.querySelector('#tasksSection');
        const listEl = modal.querySelector('#todoistTasksList');

        connectBtn.addEventListener('click', () => {
            this.initiateOAuthFlow(statusEl, tasksSection, listEl);
        });

        // Check if already connected
        if (this.todoistToken) {
            this.loadTasksFromServer(tasksSection, listEl, statusEl);
        }
    }

    async initiateOAuthFlow(statusEl, tasksSection, listEl) {
        this.showConnectionStatus(statusEl, 'connecting', 'Redirecting to Todoist...');
        
        try {
            // Redirect to our OAuth endpoint
            window.location.href = '/api/todoist-oauth';
        } catch (error) {
            this.showConnectionStatus(statusEl, 'error', 'Failed to connect to Todoist');
        }
    }

    async loadTasksFromServer(tasksSection, listEl, statusEl) {
        if (!this.todoistToken) return;

        this.showConnectionStatus(statusEl, 'connecting', 'Loading your tasks...');
        
        try {
            const response = await fetch('/api/todoist-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: this.todoistToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.todoistTasks = data.tasks;
                this.todoistProjectsById = data.projects;
                
                this.showConnectionStatus(statusEl, 'success', `Found ${data.tasks.length} tasks`);
                tasksSection.style.display = 'block';
                this.renderTasks(listEl);
            } else {
                throw new Error('Failed to load tasks');
            }
        } catch (error) {
            this.showConnectionStatus(statusEl, 'error', 'Failed to load tasks');
        }
    }

    renderTasks(listEl) {
        listEl.innerHTML = '';
        
        if (!this.todoistTasks || this.todoistTasks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = `
                <div class="empty-icon">📝</div>
                <div class="empty-text">No tasks found</div>
                <div class="empty-subtext">Create some tasks in Todoist to get started</div>
            `;
            listEl.appendChild(empty);
            return;
        }
        
        this.todoistTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            const taskTitle = document.createElement('div');
            taskTitle.className = 'task-title';
            taskTitle.textContent = task.content || '(untitled)';
            
            const taskMeta = document.createElement('div');
            taskMeta.className = 'task-meta';
            
            // Project name
            const pj = this.todoistProjectsById[task.project_id];
            const projectSpan = document.createElement('span');
            projectSpan.className = 'task-project';
            projectSpan.textContent = pj ? pj.name : 'Inbox';
            taskMeta.appendChild(projectSpan);
            
            // Due date
            if (task.due) {
                const dueSpan = document.createElement('span');
                dueSpan.className = 'task-due';
                const dueDate = new Date(task.due.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (dueDate.getTime() === today.getTime()) {
                    dueSpan.textContent = 'Today';
                    dueSpan.style.color = '#f59e0b';
                } else if (dueDate < today) {
                    dueSpan.textContent = 'Overdue';
                    dueSpan.style.color = '#ef4444';
                } else {
                    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    dueSpan.textContent = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
                    dueSpan.style.color = '#10b981';
                }
                taskMeta.appendChild(dueSpan);
            }
            
            taskContent.appendChild(taskTitle);
            taskContent.appendChild(taskMeta);
            
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            
            const focusBtn = document.createElement('button');
            focusBtn.className = 'btn-focus';
            focusBtn.textContent = 'Focus This';
            focusBtn.addEventListener('click', () => {
                this.currentTask = { 
                    id: task.id, 
                    content: task.content, 
                    project_id: task.project_id,
                    due: task.due,
                    priority: task.priority
                };
                this.updateCurrentTaskBanner();
                // Close modal
                document.querySelector('.focus-stats-overlay')?.remove();
            });
            
            taskActions.appendChild(focusBtn);
            
            item.appendChild(taskContent);
            item.appendChild(taskActions);
            listEl.appendChild(item);
        });
    }

    showConnectionStatus(statusEl, type, message) {
        if (!statusEl) return;
        
        statusEl.style.display = 'flex';
        statusEl.className = `connection-status ${type}`;
        
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('.status-text');
        
        if (indicator) {
            indicator.className = `status-indicator ${type}`;
        }
        if (text) {
            text.textContent = message;
        }
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }

    updateCurrentTaskBanner() {
        // This would integrate with your existing timer
        console.log('Current task set:', this.currentTask);
    }
}

// Export for use
window.ImprovedTodoistIntegration = ImprovedTodoistIntegration;
