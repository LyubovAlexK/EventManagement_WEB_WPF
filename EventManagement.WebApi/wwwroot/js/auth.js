class AuthManager {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = window.location.origin + '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    async login() {
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value;

        if (!login || !password) {
            this.showMessage('Заполните все поля!', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });

            if (response.ok) {
                const user = await response.json();
                // Нормализуем пользователя
                this.currentUser = this.normalizeUserData(user);
                this.showApp();
                this.showMessage('Успешный вход!', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Ошибка авторизации', 'error');
                if (error.message === "Вход ограничен для организаторов") {
                    this.showAccessDenied();
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Ошибка соединения с сервером', 'error');
        }
    }

    // Нормализация данных пользователя
    normalizeUserData(user) {
        return {
            userId: user.UserId || user.userId,
            lastName: user.LastName || user.lastName,
            name: user.Name || user.name,
            middleName: user.MiddleName || user.middleName,
            phone: user.Phone || user.phone,
            specialty: user.Specialty || user.specialty,
            login: user.Login || user.login,
            roleId: user.RoleId || user.roleId,
            roleName: user.RoleName || user.roleName
        };
    }

    showAccessDenied() {
        const authContainer = document.querySelector('.auth-container');
        authContainer.innerHTML = `
            <div class="access-denied">
                <h1>Доступ ограничен</h1>
                <p>Вход в систему для организаторов временно недоступен</p>
                <button onclick="location.reload()" class="btn-primary">
                    <img src="img/refresh.png" alt="Обновить" class="btn-icon">
                    Вернуться к авторизации
                </button>
            </div>
        `;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
        this.showMessage('Вы вышли из системы', 'info');
        this.clearAllNotifications();
    }

    clearAllNotifications() {
        const notifications = document.querySelectorAll('.notification, .event-reminder, #reminders-container');
        notifications.forEach(notification => notification.remove());
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.currentUser = this.normalizeUserData(user);
                this.showApp();
            } catch (e) {
                console.error('Error parsing saved user:', e);
                localStorage.removeItem('currentUser');
                this.showAuth();
            }
        }
    }

    showAuth() {
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('app-page').classList.remove('active');
        document.getElementById('login').value = '';
        document.getElementById('password').value = '';
    }

    showApp() {
        console.log('=== SHOW APP ===');
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('app-page').classList.add('active');

        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            console.log('User saved to localStorage:', this.currentUser);
        }

        this.updateUI();
        this.loadUserProfileData();

        // Показываем панель мероприятий по умолчанию
        setTimeout(() => {
            if (window.eventsManager && window.eventsManager.showPanel) {
                window.eventsManager.showPanel('events-cards');
            }
        }, 1000);
    }

    updateUI() {
        this.updateUserProfile();
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        const fullName = `${this.currentUser.lastName} ${this.currentUser.name} ${this.currentUser.middleName || ''}`.trim();

        const userFullnameElement = document.getElementById('user-fullname');
        const userFullnameProfileElement = document.getElementById('user-fullname-profile');

        if (userFullnameElement) userFullnameElement.textContent = fullName;
        if (userFullnameProfileElement) userFullnameProfileElement.textContent = fullName;

        const specialtyElement = document.getElementById('user-specialty');
        const phoneElement = document.getElementById('user-phone');

        if (specialtyElement) specialtyElement.textContent = this.currentUser.specialty || 'Не указана';
        if (phoneElement) phoneElement.textContent = this.currentUser.phone || 'Не указан';
    }

    async loadUserProfileData() {
        try {
            if (!this.currentUser) return;

            console.log('Loading user profile data for user:', this.currentUser.userId);

            const response = await fetch(`${this.apiBaseUrl}/Events`);
            if (response.ok) {
                const events = await response.json();
                // Нормализуем события для профиля
                const normalizedEvents = events.map(event => ({
                    eventId: event.EventId || event.eventId,
                    eventName: event.EventName || event.eventName,
                    description: event.Description || event.description,
                    dateTimeStart: event.DateTimeStart || event.dateTimeStart,
                    dateTimeFinish: event.DateTimeFinish || event.dateTimeFinish,
                    categoryId: event.CategoryId || event.categoryId,
                    categoryName: event.CategoryName || event.categoryName,
                    venueId: event.VenueId || event.venueId,
                    venueName: event.VenueName || event.venueName,
                    userId: event.UserId || event.userId,
                    userName: event.UserName || event.userName,
                    status: event.Status || event.status,
                    estimatedBudget: event.EstimatedBudget || event.estimatedBudget,
                    actualBudget: event.ActualBudget || event.actualBudget,
                    maxNumOfGuests: event.MaxNumOfGuests || event.maxNumOfGuests
                }));

                const userEvents = normalizedEvents.filter(event => event.userId === this.currentUser.userId);
                console.log('User events:', userEvents);

                // Обновляем счетчик мероприятий
                const eventsCountElement = document.getElementById('user-events-count');
                if (eventsCountElement) {
                    eventsCountElement.textContent = userEvents.length;
                }

                // Обновляем список последних мероприятий
                const eventsList = document.getElementById('user-events-list');
                if (eventsList) {
                    if (userEvents.length === 0) {
                        eventsList.innerHTML = '<li>Нет мероприятий</li>';
                    } else {
                        eventsList.innerHTML = userEvents
                            .slice(0, 5)
                            .map(event => `
                                <li>
                                    <strong>${this.escapeHtml(event.eventName)}</strong><br>
                                    <small>${this.formatDateTime(event.dateTimeStart)} • ${event.status}</small>
                                </li>
                            `)
                            .join('');
                    }
                }
            } else {
                console.error('Failed to load events for profile');
            }
        } catch (error) {
            console.error('Error loading user profile data:', error);
            const eventsCountElement = document.getElementById('user-events-count');
            if (eventsCountElement) eventsCountElement.textContent = '0';
            const eventsList = document.getElementById('user-events-list');
            if (eventsList) eventsList.innerHTML = '<li>Ошибка загрузки</li>';
        }
    }

    // Вспомогательные методы
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(dateString) {
        if (!dateString) return 'Не указано';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU');
        } catch {
            return 'Неверная дата';
        }
    }

    showMessage(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Инициализация глобального объекта
const authManager = new AuthManager();
window.authManager = authManager;