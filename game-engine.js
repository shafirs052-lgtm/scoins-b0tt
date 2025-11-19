// SCoinS PRO - Игровой движок
class GameEngine {
    constructor() {
        this.balance = CONFIG.STARTING_BALANCE;
        this.collection = [];
        this.stats = {
            totalCoins: 0,
            totalValue: 0,
            totalSold: 0,
            totalBought: 0,
            totalTransactions: 0,
            achievements: []
        };
        this.userId = this.getUserId();
        this.userName = this.getUserName();
        
        this.init();
    }
    
    init() {
        console.log(`🎮 ${CONFIG.GAME_NAME} v${CONFIG.VERSION} запущен!`);
        
        // Инициализация Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.expand();
            window.Telegram.WebApp.ready();
            this.setupTelegramTheme();
        }
        
        this.loadGameData();
        this.calculateStats();
        this.checkAchievements();
    }
    
    setupTelegramTheme() {
        const tg = window.Telegram.WebApp;
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#667eea');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#1f2937');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#f59e0b');
    }
    
    loadGameData() {
        try {
            const saved = localStorage.getItem('scoins_pro_save');
            if (saved) {
                const data = JSON.parse(saved);
                this.balance = data.balance || CONFIG.STARTING_BALANCE;
                this.collection = data.collection || [];
                this.stats = data.stats || this.stats;
                
                // Миграция старых данных
                if (data.marketplace) {
                    localStorage.setItem('scoins_global_marketplace', JSON.stringify(data.marketplace));
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            this.resetGameData();
        }
    }
    
    saveGameData() {
        const data = {
            balance: this.balance,
            collection: this.collection,
            stats: this.stats,
            version: CONFIG.VERSION,
            lastSave: Date.now()
        };
        
        try {
            localStorage.setItem('scoins_pro_save', JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка сохранения данных:', e);
            this.showNotification('Ошибка сохранения игры', 'error');
        }
    }
    
    resetGameData() {
        this.balance = CONFIG.STARTING_BALANCE;
        this.collection = [];
        this.stats = {
            totalCoins: 0,
            totalValue: 0,
            totalSold: 0,
            totalBought: 0,
            totalTransactions: 0,
            achievements: []
        };
        this.saveGameData();
    }
    
    // Основные игровые функции
    buyCoin(coinId) {
        const coin = CONFIG.COINS.find(c => c.id === coinId);
        if (!coin) {
            this.showNotification('Монета не найдена', 'error');
            return false;
        }
        
        // Проверка, есть ли уже такая монета
        if (this.collection.some(c => c.id === coinId)) {
            this.showNotification('Эта монета уже в коллекции', 'error');
            return false;
        }
        
        // Проверка баланса
        if (this.balance < coin.price) {
            this.showNotification('Недостаточно звезд', 'error');
            return false;
        }
        
        // Покупка монеты
        this.balance -= coin.price;
        
        const purchasedCoin = {
            ...coin,
            purchaseId: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            purchaseDate: Date.now(),
            purchasePrice: coin.price
        };
        
        this.collection.push(purchasedCoin);
        this.stats.totalTransactions++;
        
        this.saveGameData();
        this.calculateStats();
        this.checkAchievements();
        
        this.showNotification(`🎉 Куплено: ${coin.name} за ${coin.price} ⭐!`);
        return true;
    }
    
    searchCoins(query) {
        const grid = document.getElementById('coinsGrid');
        if (!grid) return;
        
        const filteredCoins = CONFIG.COINS.filter(coin => 
            coin.name.toLowerCase().includes(query.toLowerCase()) ||
            coin.rarity.toLowerCase().includes(query.toLowerCase()) ||
            coin.description.toLowerCase().includes(query.toLowerCase())
        );
        
        grid.innerHTML = filteredCoins.map(coin => {
            const owned = this.collection.some(c => c.id === coin.id);
            const canBuy = this.balance >= coin.price && !owned;
            
            return `
                <div class="coin-card" onclick="game.showCoinInfo(${coin.id})">
                    <div class="coin-icon">${coin.icon}</div>
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-rarity rarity-${coin.rarity}">
                        ${ConfigUtils.getRarityInfo(coin.rarity).name}
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
    
    showCoinInfo(coinId) {
        const coin = ConfigUtils.getCoinById(coinId);
        if (!coin) return;
        
        const rarityInfo = ConfigUtils.getRarityInfo(coin.rarity);
        const owned = this.collection.some(c => c.id === coinId);
        
        const content = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 4em; margin-bottom: 16px;">${coin.icon}</div>
                <h3 style="color: #1f2937; margin-bottom: 8px;">${coin.name}</h3>
                <div class="coin-rarity rarity-${coin.rarity}" style="margin-bottom: 12px;">
                    ${rarityInfo.name}
                </div>
                <p style="color: #6b7280; margin-bottom: 16px;">${coin.description}</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Издание:</span>
                        <strong>${coin.edition}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Цена в магазине:</span>
                        <strong style="color: #f59e0b;">${coin.price} ⭐</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>В вашей коллекции:</span>
                        <strong>${owned ? '✅ Есть' : '❌ Нет'}</strong>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                ${!owned ? `
                    <button class="btn" onclick="game.buyCoin(${coin.id}); closeModal('coinInfoModal')">
                        Купить за ${coin.price} ⭐
                    </button>
                ` : `
                    <button class="btn" onclick="showSection('collection'); closeModal('coinInfoModal')">
                        📦 Перейти к коллекции
                    </button>
                `}
                <button class="btn btn-secondary" onclick="closeModal('coinInfoModal')">
                    Закрыть
                </button>
            </div>
        `;
        
        document.getElementById('coinInfoTitle').textContent = coin.name;
        document.getElementById('coinInfoContent').innerHTML = content;
        this.showModal('coinInfoModal');
    }
    
    // Статистика и достижения
    calculateStats() {
        this.stats.totalCoins = this.collection.length;
        this.stats.totalValue = this.collection.reduce((sum, coin) => sum + coin.price, 0);
        this.stats.uniqueCoins = new Set(this.collection.map(c => c.id)).size;
        
        // Обновление UI
        this.updateStatsUI();
    }
    
    updateStatsUI() {
        const elements = {
            'totalCoins': this.stats.totalCoins,
            'totalValue': this.stats.totalValue + ' ⭐',
            'statBalance': this.balance + ' ⭐',
            'statTotalCoins': this.stats.totalCoins,
            'statUniqueCoins': this.stats.uniqueCoins,
            'statTotalValue': this.stats.totalValue + ' ⭐',
            'statSold': this.stats.totalSold,
            'statBought': this.stats.totalBought,
            'statTransactions': this.stats.totalTransactions
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
        
        // Обновление достижений
        this.updateAchievementsUI();
    }
    
    checkAchievements() {
        CONFIG.ACHIEVEMENTS.forEach(achievement => {
            if (!this.stats.achievements.includes(achievement.id) && achievement.condition(this)) {
                this.stats.achievements.push(achievement.id);
                this.showNotification(`🏆 Получено достижение: ${achievement.name}`, 'info');
                this.saveGameData();
            }
        });
    }
    
    updateAchievementsUI() {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        const achieved = CONFIG.ACHIEVEMENTS.filter(a => this.stats.achievements.includes(a.id));
        const notAchieved = CONFIG.ACHIEVEMENTS.filter(a => !this.stats.achievements.includes(a.id));
        
        container.innerHTML = [
            ...achieved.map(a => `
                <div class="stat-item" style="color: #10b981;">
                    <span>${a.icon} ${a.name}</span>
                    <strong>✅</strong>
                </div>
            `),
            ...notAchieved.map(a => `
                <div class="stat-item" style="color: #6b7280; opacity: 0.6;">
                    <span>${a.icon} ${a.name}</span>
                    <strong>🔒</strong>
                </div>
            `)
        ].join('');
    }
    
    // Вспомогательные функции
    getUserId() {
        const tg = window.Telegram?.WebApp;
        return tg?.initDataUnsafe?.user?.id || 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserName() {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;
        if (user) {
            return user.first_name || user.username || 'Аноним';
        }
        return 'Игрок';
    }
    
    getUserRating() {
        // Базовая система рейтинга (можно улучшить)
        const baseRating = 4.5;
        const activityBonus = Math.min(this.stats.totalTransactions * 0.1, 0.5);
        return (baseRating + activityBonus).toFixed(1);
    }
    
    showNotification(message, type = 'success') {
        const notif = document.getElementById('notification');
        if (!notif) return;
        
        notif.textContent = message;
        notif.className = `notification ${type}`;
        notif.style.display = 'block';
        
        setTimeout(() => {
            notif.style.display = 'none';
        }, 5000);
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    }
    
    updateBalance() {
        const balanceElement = document.getElementById('balance');
        if (balanceElement) balanceElement.textContent = this.balance;
    }
    
    // Рендер коллекции
    renderCollection() {
        const grid = document.getElementById('collectionGrid');
        if (!grid) return;
        
        if (this.collection.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <div style="font-size: 3em; margin-bottom: 12px;">🎒</div>
                    <p>Коллекция пуста</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Купите первую монету в магазине!</p>
                    <button class="btn" onclick="showSection('shop')" style="margin-top: 16px;">
                        🏪 Перейти в магазин
                    </button>
                </div>
            `;
            return;
        }
        
        // Группировка по редкости
        const grouped = {};
        this.collection.forEach(coin => {
            if (!grouped[coin.rarity]) grouped[coin.rarity] = [];
            grouped[coin.rarity].push(coin);
        });
        
        let html = '';
        Object.entries(grouped).forEach(([rarity, coins]) => {
            const rarityInfo = ConfigUtils.getRarityInfo(rarity);
            html += `
                <div style="margin-bottom: 24px;">
                    <h3 style="color: ${rarityInfo.color}; margin-bottom: 12px;">
                        ${rarityInfo.name} монеты (${coins.length})
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        ${coins.map((coin, index) => `
                            <div class="coin-card" style="width: 140px;" onclick="game.showCoinInfo(${coin.id})">
                                <div class="coin-icon">${coin.icon}</div>
                                <div style="font-weight: bold; font-size: 0.9em;">${coin.name}</div>
                                <div style="font-size: 0.7em; color: #6b7280;">${coin.edition}</div>
                                <div style="color: #f59e0b; font-weight: bold; margin: 8px 0;">
                                    ${coin.price} ⭐
                                </div>
                                <button class="btn btn-secondary btn-small" 
                                        onclick="event.stopPropagation(); marketplace.sellCoin(${index})">
                                    💰 Продать
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
    }
}

// Создаем глобальный экземпляр игры
const game = new GameEngine();