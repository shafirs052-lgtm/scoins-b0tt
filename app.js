// SCoinS PRO - Основной скрипт приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Инициализация всех систем
    initializeUI();
    initializeEventListeners();
    renderInitialData();
    
    console.log(`🚀 ${CONFIG.GAME_NAME} v${CONFIG.VERSION} полностью загружен!`);
}

function initializeUI() {
    // Установка начального активного раздела
    showSection('shop');
    
    // Рендер начальных данных
    renderShop();
    game.renderCollection();
    marketplace.renderMarketplace();
    game.calculateStats();
    
    // Обновление баланса
    game.updateBalance();
}

function initializeEventListeners() {
    // Глобальные обработчики событий
    document.addEventListener('click', function(e) {
        // Закрытие модальных окон при клике вне контента
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Обработка клавиши Escape для закрытия модальных окон
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Обработка изменений в фильтрах
    const rarityFilter = document.getElementById('rarityFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (rarityFilter) {
        rarityFilter.addEventListener('change', () => marketplace.filterMarketplace());
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', () => marketplace.filterMarketplace());
    }
}

function renderInitialData() {
    // Рендер магазина
    renderShop();
    
    // Загрузка и рендер дополнительных данных
    setTimeout(() => {
        game.calculateStats();
        marketplace.applyFilters();
    }, 100);
}

function renderShop() {
    const grid = document.getElementById('coinsGrid');
    if (!grid) return;
    
    grid.innerHTML = CONFIG.COINS.map(coin => {
        const owned = game.collection.some(c => c.id === coin.id);
        const canBuy = game.balance >= coin.price && !owned;
        const rarityInfo = ConfigUtils.getRarityInfo(coin.rarity);
        
        return `
            <div class="coin-card" onclick="game.showCoinInfo(${coin.id})">
                <div class="coin-icon">${coin.icon}</div>
                <div class="coin-name">${coin.name}</div>
                <div class="coin-rarity rarity-${coin.rarity}">
                    ${rarityInfo.name}
                </div>
                <div class="coin-price">${coin.price} ⭐</div>
                <button class="btn" onclick="event.stopPropagation(); game.buyCoin(${coin.id})" 
                        ${!canBuy ? 'disabled' : ''}>
                    ${owned ? '✅ В коллекции' : canBuy ? 'Купить' : 'Недостаточно'}
                </button>
            </div>
        `;
    }).join('');
}

// Глобальные функции для навигации
function showSection(sectionId) {
    // Скрыть все разделы
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Убрать активность со всех кнопок меню
    document.querySelectorAll('.menu-btn').forEach(b => {
        b.classList.remove('active');
    });
    
    // Показать выбранный раздел
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Найти и активировать соответствующую кнопку меню
    const menuButton = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (menuButton) {
        menuButton.classList.add('active');
    }
    
    // Дополнительные действия при переключении разделов
    onSectionChange(sectionId);
}

function onSectionChange(sectionId) {
    switch (sectionId) {
        case 'shop':
            renderShop();
            break;
        case 'collection':
            game.renderCollection();
            game.calculateStats();
            break;
        case 'marketplace':
            marketplace.loadMarketplace();
            marketplace.renderMarketplace();
            break;
        case 'stats':
            game.calculateStats();
            break;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Глобальные утилиты
function formatNumber(number) {
    return new Intl.NumberFormat('ru-RU').format(number);
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} д. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (minutes > 0) return `${minutes} мин. назад`;
    return 'только что';
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    game.showNotification('Произошла ошибка в приложении', 'error');
});

// Сохранение при закрытии
window.addEventListener('beforeunload', function() {
    game.saveGameData();
    marketplace.saveMarketplace();
});

// API для Telegram Bot
window.TelegramWebApp = {
    // Методы для взаимодействия с ботом
    showAlert: function(message) {
        game.showNotification(message, 'info');
    },
    
    getUserId: function() {
        return game.userId;
    },
    
    getUserData: function() {
        return {
            userId: game.userId,
            userName: game.userName,
            balance: game.balance,
            collectionSize: game.collection.length,
            totalValue: game.stats.totalValue
        };
    },
    
    // Метод для обработки глубоких ссылок
    processDeepLink: function(params) {
        if (params.section) {
            showSection(params.section);
        }
        if (params.coinId) {
            game.showCoinInfo(parseInt(params.coinId));
        }
    }
};

// Инициализация при полной загрузке страницы
window.onload = function() {
    // Проверка поддержки localStorage
    if (!isLocalStorageSupported()) {
        game.showNotification('Ваш браузер не поддерживает сохранение данных', 'error');
        return;
    }
    
    // Проверка версии данных
    checkDataVersion();
    
    // Запуск периодического автосохранения
    setInterval(() => {
        game.saveGameData();
        marketplace.saveMarketplace();
    }, 30000); // Каждые 30 секунд
};

function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function checkDataVersion() {
    try {
        const saved = localStorage.getItem('scoins_pro_save');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.version !== CONFIG.VERSION) {
                console.log(`Обновление данных с версии ${data.version} на ${CONFIG.VERSION}`);
                // Здесь можно добавить миграцию данных при обновлении
            }
        }
    } catch (e) {
        console.error('Ошибка проверки версии данных:', e);
    }
}

// Экспорт глобальных объектов для отладки
if (typeof window !== 'undefined') {
    window.SCoinS = {
        game,
        marketplace,
        paymentSystem,
        config: CONFIG,
        utils: {
            formatNumber,
            getTimeAgo,
            showSection,
            closeModal
        }
    };
}