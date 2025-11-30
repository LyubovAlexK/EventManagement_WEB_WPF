class EventsManager {
    constructor() {
        this.events = [];
        this.categories = [];
        this.venues = [];
        this.selectedEvent = null;
        this.apiBaseUrl = window.location.origin + '/api';
        this.sortState = {
            column: null,
            direction: 'asc' // 'asc' или 'desc'
        };
        console.log('EventsManager initialized with API URL:', this.apiBaseUrl);

        // Защита от двойной инициализации
        if (window.eventsManager) {
            return window.eventsManager;
        }
        window.eventsManager = this;

        this.init();
    }

    init() {
        this.bindEvents();
        console.log('EventsManager init completed');
    }

    bindEvents() {
        console.log('Binding events...');

        // Кнопки действий
        const addBtn = document.getElementById('add-event-btn');
        const editBtn = document.getElementById('edit-event-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const checkEventsBtn = document.getElementById('check-events-btn');

        if (addBtn) addBtn.addEventListener('click', () => this.showAddEventModal());
        if (editBtn) editBtn.addEventListener('click', () => this.showEditEventModal());
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadEvents());
        if (checkEventsBtn) checkEventsBtn.addEventListener('click', () => this.checkUpcomingEvents());

        // Поиск
        const searchInput = document.getElementById('search-events');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterEvents(e.target.value));
        }

        // Модальные окна
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Форма мероприятия
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.panel) {
                btn.addEventListener('click', (e) => {
                    this.showPanel(e.currentTarget.dataset.panel);
                });
            }
        });

        // Сортировка таблицы
        this.bindSortEvents();

        console.log('All events bound successfully');
    }

    // Привязка событий сортировки
    bindSortEvents() {
        const tableHeaders = document.querySelectorAll('#events-table th[data-sort]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                this.sortTable(column);
            });
        });
    }

    // Метод сортировки таблицы
    sortTable(column) {
        console.log(`Sorting by column: ${column}`);

        // Определяем направление сортировки
        if (this.sortState.column === column) {
            // Если уже сортируем по этой колонке, меняем направление
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Если новая колонка, сортируем по возрастанию
            this.sortState.column = column;
            this.sortState.direction = 'asc';
        }

        console.log(`Sort state: column=${this.sortState.column}, direction=${this.sortState.direction}`);

        // Сортируем события
        this.events.sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];

            // Для числовых колонок
            if (column.includes('Budget') || column.includes('Guests') || column.includes('Id') || column === 'ClientCount') {
                aValue = this.parseNumber(aValue);
                bValue = this.parseNumber(bValue);
                return this.sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // Для дат
            if (column.includes('DateTime')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
                return this.sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // Для текстовых колонок
            aValue = String(aValue || '').toLowerCase();
            bValue = String(bValue || '').toLowerCase();

            if (this.sortState.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });

        // Обновляем отображение
        this.displayEvents();

        // Обновляем индикаторы сортировки
        this.updateSortIndicators();

        this.showNotification(`Таблица отсортирована по колонке "${this.getColumnDisplayName(column)}" (${this.sortState.direction === 'asc' ? 'по возрастанию' : 'по убыванию'})`, 'info');
    }

    // Парсинг чисел с учетом возможных null/undefined
    parseNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    // Обновление индикаторов сортировки
    updateSortIndicators() {
        const tableHeaders = document.querySelectorAll('#events-table th[data-sort]');

        tableHeaders.forEach(header => {
            const sortIcon = header.querySelector('.sort-icon');
            const column = header.dataset.sort;

            // Сбрасываем все индикаторы
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (sortIcon) {
                sortIcon.style.opacity = '0.6';
                sortIcon.style.transform = 'rotate(0deg)';
            }

            // Устанавливаем индикатор для активной колонки
            if (column === this.sortState.column) {
                if (this.sortState.direction === 'asc') {
                    header.classList.add('sorted-asc');
                } else {
                    header.classList.add('sorted-desc');
                }

                if (sortIcon) {
                    sortIcon.style.opacity = '1';
                    if (this.sortState.direction === 'asc') {
                        sortIcon.style.transform = 'rotate(0deg)';
                    } else {
                        sortIcon.style.transform = 'rotate(180deg)';
                    }
                }
            }
        });
    }

    // Получение отображаемого имени колонки
    getColumnDisplayName(column) {
        const displayNames = {
            'EventId': 'ID',
            'EventName': 'Название',
            'Description': 'Описание',
            'DateTimeStart': 'Начало',
            'DateTimeFinish': 'Окончание',
            'CategoryName': 'Категория',
            'VenueName': 'Место',
            'Status': 'Статус',
            'EstimatedBudget': 'Плановый бюджет',
            'ActualBudget': 'Фактический бюджет',
            'MaxNumOfGuests': 'Количество гостей'
        };

        return displayNames[column] || column;
    }

    async loadEvents() {
        console.log('=== START loadEvents ===');
        try {
            console.log('Fetching events from:', `${this.apiBaseUrl}/Events`);
            const response = await fetch(`${this.apiBaseUrl}/Events`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const events = await response.json();
            console.log('✅ Raw events data from API:', events);

            if (Array.isArray(events)) {
                // НОРМАЛИЗАЦИЯ ДАННЫХ: преобразуем свойства к camelCase
                this.events = events.map(event => this.normalizeEventData(event));
                console.log('✅ Normalized events:', this.events);

                // Фильтрация по роли
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.roleName !== 'Администратор') {
                    const beforeFilter = this.events.length;
                    this.events = this.events.filter(event => {
                        const match = event.userId === currentUser.userId;
                        console.log(`Event ${event.eventId} UserId: ${event.userId}, Current UserId: ${currentUser.userId}, Match: ${match}`);
                        return match;
                    });
                    console.log(`Filtered events: ${beforeFilter} -> ${this.events.length}`);
                }

                // Сбрасываем состояние сортировки
                this.sortState = { column: null, direction: 'asc' };
                this.updateSortIndicators();

                // Отображение
                this.displayEvents();
                this.displayEventsCards();
                this.updateEditButton();

                this.showNotification(`Загружено ${this.events.length} мероприятий`, 'success');
            } else {
                throw new Error('Events is not an array');
            }
        } catch (error) {
            console.error('❌ Error loading events:', error);
            this.showNotification('Ошибка загрузки мероприятий', 'error');
        }
        console.log('=== END loadEvents ===');
    }

    // НОРМАЛИЗАЦИЯ ДАННЫХ: преобразует PascalCase в camelCase
    normalizeEventData(event) {
        return {
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
            maxNumOfGuests: event.MaxNumOfGuests || event.maxNumOfGuests,
            clientCount: event.ClientCount || event.clientCount
        };
    }

    displayEvents = (eventsToShow = null) => {
        console.log('=== START displayEvents ===');
        const events = eventsToShow || this.events;
        const tbody = document.getElementById('events-tbody');

        console.log('Events to display:', events);
        console.log('First event sample:', events[0]);

        if (!tbody) {
            console.error('❌ Events table body not found');
            return;
        }

        tbody.innerHTML = '';

        if (!events || events.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 20px; color: #666;">
                        Мероприятия не найдены
                    </td>
                </tr>
            `;
            return;
        }

        console.log(`Displaying ${events.length} events in table`);

        events.forEach((event, index) => {
            console.log(`Processing event ${index + 1}:`, event);

            const row = document.createElement('tr');
            row.dataset.eventId = event.eventId;

            if (this.selectedEvent && this.selectedEvent.eventId === event.eventId) {
                row.classList.add('selected');
            }

            // Используем НОРМАЛИЗОВАННЫЕ свойства (camelCase)
            const eventName = event.eventName || 'Без названия';
            const description = event.description || '';
            const categoryName = event.categoryName || 'Не указана';
            const venueName = event.venueName || 'Не указано';
            const status = event.status || 'Не указан';
            const startDate = this.formatDateTime(event.dateTimeStart);
            const endDate = this.formatDateTime(event.dateTimeFinish);

            row.innerHTML = `
                <td>${event.eventId}</td>
                <td title="${this.escapeHtml(eventName)}">${this.escapeHtml(eventName)}</td>
                <td title="${this.escapeHtml(description)}">${this.truncateText(description, 50)}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${this.escapeHtml(categoryName)}</td>
                <td>${this.escapeHtml(venueName)}</td>
                <td>${this.escapeHtml(status)}</td>
                <td>${this.formatCurrency(event.estimatedBudget)}</td>
                <td>${this.formatCurrency(event.actualBudget)}</td>
                <td>${event.maxNumOfGuests || 0}</td>
            `;

            row.addEventListener('click', () => {
                console.log('Row clicked:', event.eventId);
                this.selectEvent(row);
            });

            tbody.appendChild(row);
        });

        console.log('Table populated successfully');
        console.log('=== END displayEvents ===');
    }

    displayEventsCards = () => {
        console.log('=== START displayEventsCards ===');
        const container = document.getElementById('events-cards-container');

        if (!container) {
            console.error('❌ Events cards container not found');
            return;
        }

        container.innerHTML = '';

        if (!this.events || this.events.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    Мероприятия не найдены
                </div>
            `;
            return;
        }

        console.log(`Displaying ${this.events.length} events as cards`);

        this.events.forEach((event, index) => {
            const card = document.createElement('div');
            card.className = 'event-card';

            // Используем НОРМАЛИЗОВАННЫЕ свойства (camelCase)
            const eventName = event.eventName || 'Без названия';
            const description = event.description || '';
            const categoryName = event.categoryName || 'Не указана';
            const venueName = event.venueName || 'Не указано';
            const status = event.status || 'Не указан';
            const userName = event.userName || 'Не указан';
            const maxGuests = event.maxNumOfGuests || 0;
            const startDate = this.formatDate(event.dateTimeStart);

            // Цвет статуса
            let statusColor = '#F59E0B';
            if (status === 'Согласован') statusColor = '#22C55E';
            else if (status === 'Ждет утверждения') statusColor = '#3B82F6';
            else if (status === 'Отменен') statusColor = '#EF4444';

            card.innerHTML = `
                <div class="event-card-header" style="background: linear-gradient(to right, #a855f7, ${statusColor})"></div>
                <div class="event-card-content">
                    <h3 class="event-card-title">${this.escapeHtml(eventName)}</h3>
                    <p class="event-card-category">${this.escapeHtml(categoryName)} • ${this.escapeHtml(venueName)}</p>
                    <p style="margin: 10px 0; font-size: 13px; color: #666;">${this.truncateText(description, 100)}</p>
                    <div class="event-card-status" style="background-color: ${statusColor}">${this.escapeHtml(status)}</div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 12px;">
                        <span>📅 ${startDate}</span>
                        <span>👥 ${maxGuests} гостей</span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                        Ответственный: ${userName}
                    </div>
                    <button class="event-card-btn" data-event-id="${event.eventId}">
                        <img src="img/events.png" alt="Посмотреть" class="btn-icon">
                        Подробнее
                    </button>
                </div>
            `;

            const button = card.querySelector('.event-card-btn');
            button.addEventListener('click', () => {
                console.log('Card button clicked for event:', event.eventId);
                this.showEventDetails(event);
            });

            container.appendChild(card);
        });

        console.log('Cards populated successfully');
        console.log('=== END displayEventsCards ===');
    }

    showEventDetails = (event) => {
        console.log('Showing event details:', event.eventId);
        this.showPanel('events');
        setTimeout(() => {
            const row = document.querySelector(`#events-table tr[data-event-id="${event.eventId}"]`);
            if (row) {
                this.selectEvent(row);
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    async showAddEventModal() {
        console.log('Showing add event modal');
        await this.loadModalData();
        document.getElementById('modal-title').innerHTML = `
            <img src="img/events.png" alt="Мероприятие" class="section-icon">
            Добавление мероприятия
        `;
        document.getElementById('event-form').reset();
        document.getElementById('event-form').dataset.mode = 'add';
        document.getElementById('event-modal').classList.add('active');
    }

    async showEditEventModal() {
        if (!this.selectedEvent) {
            this.showNotification('Выберите мероприятие для редактирования', 'warning');
            return;
        }

        console.log('Showing edit event modal for:', this.selectedEvent.eventId);
        await this.loadModalData();
        document.getElementById('modal-title').innerHTML = `
            <img src="img/editl.png" alt="Редактирование" class="section-icon">
            Редактирование мероприятия
        `;
        document.getElementById('event-form').dataset.mode = 'edit';
        document.getElementById('event-form').dataset.eventId = this.selectedEvent.eventId;
        this.fillEventForm(this.selectedEvent);
        document.getElementById('event-modal').classList.add('active');
    }

    fillEventForm(event) {
        document.querySelector('[name="EventName"]').value = event.eventName || '';
        document.querySelector('[name="Description"]').value = event.description || '';
        document.querySelector('[name="DateTimeStart"]').value = this.formatDateTimeForInput(event.dateTimeStart);
        document.querySelector('[name="DateTimeFinish"]').value = this.formatDateTimeForInput(event.dateTimeFinish);
        document.querySelector('[name="Status"]').value = event.status || '';
        document.querySelector('[name="EstimatedBudget"]').value = event.estimatedBudget || '';
        document.querySelector('[name="MaxNumOfGuests"]').value = event.maxNumOfGuests || '';

        setTimeout(() => {
            if (event.categoryId) {
                document.querySelector('[name="CategoryId"]').value = event.categoryId;
            }
            if (event.venueId) {
                document.querySelector('[name="VenueId"]').value = event.venueId;
            }
        }, 100);
    }

    async loadModalData() {
        console.log('Loading modal data...');
        try {
            const [categoriesResponse, venuesResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/Categories`),
                fetch(`${this.apiBaseUrl}/Venues`)
            ]);

            console.log('Categories response:', categoriesResponse.status, categoriesResponse.ok);
            console.log('Venues response:', venuesResponse.status, venuesResponse.ok);

            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                console.log('Raw categories data:', categories);

                // Нормализуем категории
                this.categories = categories.map(cat => ({
                    categoryId: cat.CategoryId || cat.categoryId,
                    categoryName: cat.CategoryName || cat.categoryName
                }));
                console.log('Normalized categories:', this.categories);

                this.fillSelect('CategoryId', this.categories, 'categoryId', 'categoryName');
            } else {
                console.error('Failed to load categories:', categoriesResponse.status);
            }

            if (venuesResponse.ok) {
                const venues = await venuesResponse.json();
                console.log('Raw venues data:', venues);

                // Нормализуем места
                this.venues = venues.map(venue => ({
                    venueId: venue.VenueId || venue.venueId,
                    venueName: venue.VenueName || venue.venueName,
                    address: venue.Address || venue.address,
                    capacity: venue.Capacity || venue.capacity,
                    description: venue.Description || venue.description
                }));
                console.log('Normalized venues:', this.venues);

                this.fillSelect('VenueId', this.venues, 'venueId', 'venueName');
            } else {
                console.error('Failed to load venues:', venuesResponse.status);
            }

        } catch (error) {
            console.error('Error loading modal data:', error);
            this.showNotification('Ошибка загрузки данных формы', 'error');
        }
    }

    fillSelect(selectName, data, valueField, textField) {
        const select = document.querySelector(`[name="${selectName}"]`);
        if (!select) {
            console.error('Select element not found:', selectName);
            return;
        }

        console.log(`Filling select ${selectName} with data:`, data);
        console.log(`Value field: ${valueField}, Text field: ${textField}`);

        // Сохраняем текущее значение
        const currentValue = select.value;

        select.innerHTML = '<option value="">Выберите...</option>';

        if (!data || !Array.isArray(data)) {
            console.error('Invalid data for select:', data);
            return;
        }

        data.forEach(item => {
            // Пробуем разные варианты имен свойств
            const value = item[valueField] ??
                item[valueField.toLowerCase()] ??
                item[valueField.toUpperCase()] ??
                null;

            const text = item[textField] ??
                item[textField.toLowerCase()] ??
                item[textField.toUpperCase()] ??
                'Не указано';

            if (value !== null && value !== undefined) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                select.appendChild(option);
            }
        });

        // Восстанавливаем значение, если оно было
        if (currentValue) {
            select.value = currentValue;
        }

        console.log(`Select ${selectName} filled successfully with ${select.children.length - 1} options`);
    }

    async handleEventSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const mode = form.dataset.mode;
        const eventId = form.dataset.eventId;

        const eventData = {
            EventName: formData.get('EventName'),
            Description: formData.get('Description'),
            DateTimeStart: formData.get('DateTimeStart'),
            DateTimeFinish: formData.get('DateTimeFinish'),
            CategoryId: parseInt(formData.get('CategoryId')),
            VenueId: parseInt(formData.get('VenueId')),
            Status: formData.get('Status'),
            EstimatedBudget: formData.get('EstimatedBudget') ? parseFloat(formData.get('EstimatedBudget')) : null,
            MaxNumOfGuests: parseInt(formData.get('MaxNumOfGuests')),
            UserId: this.getCurrentUser().userId
        };

        try {
            let response;
            if (mode === 'add') {
                response = await fetch(`${this.apiBaseUrl}/Events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
            } else {
                eventData.EventId = parseInt(eventId);
                response = await fetch(`${this.apiBaseUrl}/Events/${eventId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
            }

            if (response.ok) {
                this.showNotification(`Мероприятие ${mode === 'add' ? 'добавлено' : 'обновлено'} успешно`, 'success');
                this.closeModals();
                this.loadEvents();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    showPanel(panelName) {
        // Скрыть все панели
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Показать выбранную панель
        const targetPanel = document.getElementById(`${panelName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // Обновить заголовок
        const titles = {
            'events': 'Таблица мероприятий',
            'events-cards': 'Мероприятия',
            'profile': 'Личный кабинет'
        };

        const titleElement = document.getElementById('current-panel-title');
        if (titleElement) {
            titleElement.textContent = titles[panelName] || 'Панель';
        }

        // Обновить активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-panel="${panelName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // При переключении на профиль обновляем данные
        if (panelName === 'profile' && window.authManager) {
            window.authManager.loadUserProfileData();
        }

        // При переключении на мероприятия загружаем их
        if ((panelName === 'events' || panelName === 'events-cards') && this.events.length === 0) {
            this.loadEvents();
        }
    }

    // Вспомогательные методы
    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) return null;

        const user = JSON.parse(userData);
        // Нормализуем пользователя тоже
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

    selectEvent(row) {
        document.querySelectorAll('#events-table tr').forEach(tr => {
            tr.classList.remove('selected');
        });

        row.classList.add('selected');

        const eventId = parseInt(row.dataset.eventId);
        this.selectedEvent = this.events.find(event => event.eventId === eventId);
        this.updateEditButton();
    }

    updateEditButton() {
        const editBtn = document.getElementById('edit-event-btn');
        if (editBtn) {
            editBtn.disabled = !this.selectedEvent;
            if (this.selectedEvent) {
                editBtn.innerHTML = `
                    <img src="img/editl.png" alt="Редактировать" class="btn-icon">
                    Редактировать "${this.selectedEvent.eventName}"
                `;
            } else {
                editBtn.innerHTML = `
                    <img src="img/editl.png" alt="Редактировать" class="btn-icon">
                    Редактировать
                `;
            }
        }
    }

    filterEvents(searchTerm) {
        if (!searchTerm) {
            this.displayEvents();
            return;
        }

        const filteredEvents = this.events.filter(event =>
            event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            event.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.displayEvents(filteredEvents);
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    async checkUpcomingEvents() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/Events`);
            if (response.ok) {
                const events = await response.json();
                const normalizedEvents = events.map(event => this.normalizeEventData(event));
                const now = new Date();

                const currentUser = this.getCurrentUser();
                let filteredEvents = normalizedEvents;

                if (currentUser && currentUser.roleName !== 'Администратор') {
                    filteredEvents = normalizedEvents.filter(event => event.userId === currentUser.userId);
                }

                const upcomingEvents = filteredEvents.filter(event => {
                    const eventDate = new Date(event.dateTimeStart);
                    const timeDiff = eventDate - now;
                    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    return daysDiff === 3 || daysDiff === 1;
                });

                if (upcomingEvents.length > 0) {
                    upcomingEvents.forEach(event => {
                        const eventDate = new Date(event.dateTimeStart);
                        const timeDiff = eventDate - now;
                        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                        showEventReminder({
                            eventId: event.eventId,
                            eventName: event.eventName,
                            startTime: event.dateTimeStart,
                            daysLeft: daysLeft,
                            message: `"${event.eventName}" через ${daysLeft} дня!`
                        });
                    });
                    this.showNotification(`Найдено ${upcomingEvents.length} предстоящих мероприятий`, 'info');
                } else {
                    this.showNotification('Ближайшие мероприятия не найдены', 'info');
                }
            }
        } catch (error) {
            console.error('Error checking upcoming events:', error);
            this.showNotification('Ошибка при проверке мероприятий', 'error');
        }
    }

    // Форматирующие методы
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    formatDateTime(dateTime) {
        if (!dateTime) return 'Не указано';
        try {
            return new Date(dateTime).toLocaleString('ru-RU');
        } catch (e) {
            return 'Неверная дата';
        }
    }

    formatDate(dateTime) {
        if (!dateTime) return 'Не указана';
        try {
            return new Date(dateTime).toLocaleDateString('ru-RU');
        } catch (e) {
            return 'Неверная дата';
        }
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return 'Не указан';
        try {
            return new Intl.NumberFormat('ru-RU', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount) + ' ₽';
        } catch (e) {
            return 'Неверная сумма';
        }
    }

    formatDateTimeForInput(dateTime) {
        if (!dateTime) return '';
        try {
            const date = new Date(dateTime);
            return date.toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    }
}

window.EventsManager = EventsManager;
console.log('EventsManager class defined and ready');