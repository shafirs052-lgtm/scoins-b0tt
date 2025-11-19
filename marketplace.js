// SCoinS PRO - Система онлайн-рынка
class MarketplaceSystem {
    constructor() {
        this.marketplace = [];
        this.coinToSell = null;
        this.filters = {
            rarity: 'all',
            sort: 'newest'
        };
        
        this.init();
    }
    
    init() {
        this.loadMarketplace();
        setInterval(() => this.cleanupOldItems(), 60000); // Очистка каждую минуту
    }
    
    // Загрузка и синхронизация рынка
    loadMarketplace() {
        try {
            const globalMarket = JSON.parse(localStorage.getItem('scoins_global_marketplace') || '[]');
            const myItems = this.marketplace.filter(item => item.sellerId === game.userId);
            
            // Объединяем глобальные предложения со своими
            this.marketplace = [
                ...globalMarket.filter(item => item.sellerId !== game.userId),
                ...myItems
            ];
            
            this.applyFilters();
        } catch (e) {
            console.error('Ошибка загрузки рынка:', e);
            this.marketplace = [];
        }
    }
    
    saveMarketplace() {
        try {
            // Сохраняем все items в глобальное хранилище
            localStorage.setItem('scoins_global_marketplace', JSON.stringify(this.marketplace));
        } catch (e) {
            console.error('Ошибка сохранения рынка:', e);
        }
    }
    
    // Продажа монет
    sellCoin(collectionIndex) {
        if (collectionIndex < 0 || collectionIndex >= game.collection.length) {
            game.showNotification('Монета не найдена', 'error');
            return;
        }
        
        this.coinToSell = game.collection[collectionIndex];
        
        const priceRange = ConfigUtils.calculateMarketPrice(
            this.coinToSell.price, 
            this.coinToSell.rarity
        );
        
        const content = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3em;">${this.coinToSell.icon}</div>
                <div style="font-weight: bold; font-size: 1.2em;">${this.coinToSell.name}</div>
                <div style="color: #6b7280;">${this.coinToSell.description}</div>
                <div style="margin-top: 12px; color: #f59e0b; font-weight: bold;">
                    Исходная цена: ${this.coinToSell.price} ⭐
                </div>
                <div style="font-size: 0.9em; color: #6b7280; margin-top: 8px;">
                    Рекомендуемая цена: ${priceRange.minPrice} - ${priceRange.maxPrice} ⭐
                </div>
            </div>
        `;
        
        document.getElementById('sellCoinInfo').innerHTML = content;
        document.getElementById('sellPrice').value = Math.max(
            CONFIG.MARKETPLACE.MIN_SELL_PRICE,
            Math.floor(this.coinToSell.price * 1.2)
        );
        document.getElementById('sellPrice').focus();
        
        game.showModal('sellModal');
    }
    
    confirmSell() {
        if (!this.coinToSell) {
            game.showNotification('Монета не выбрана', 'error');
            return;
        }
        
        const priceInput = document.getElementById('sellPrice');
        const price = parseInt(priceInput.value);
        
        if (isNaN(price) || price < CONFIG.MARKETPLACE.MIN_SELL_PRICE) {
            game.showNotification(`Минимальная цена: ${CONFIG.MARKETPLACE.MIN_SELL_PRICE} ⭐`, 'error');
            return;
        }
        
        // Проверка лимита предложений
        const userItemsCount = this.marketplace.filter(item => 
            item.sellerId === game.userId
        ).length;
        
        if (userItemsCount >= CONFIG.MARKETPLACE.MAX_ITEMS_PER_USER) {
            game.showNotification(`Лимит предложений: ${CONFIG.MARKETPLACE.MAX_ITEMS_PER_USER}`, 'error');
            return;
        }
        
        // Находим индекс монеты в коллекции
        const collectionIndex = game.collection.findIndex(coin => 
            coin.id === this.coinToSell.id && 
            coin.purchaseId === this.coinToSell.purchaseId
        );
        
        if (collectionIndex === -1) {
            game.showNotification('Монета не найдена в коллекции', 'error');
            return;
        }
        
        // Создаем рыночное предложение
        const marketplaceItem = {
            coin: { ...this.coinToSell },
            price: price,
            sellerId: game.userId,
            sellerName: game.userName,
            sellerRating: game.getUserRating(),
            timestamp: Date.now(),
            globalId: `global_${game.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Добавляем на рынок
        this.marketplace.push(marketplaceItem);
        
        // Удаляем из коллекции
        game.collection.splice(collectionIndex, 1);
        
        // Сохраняем изменения
        game.saveGameData();
        this.saveMarketplace();
        
        // Обновляем UI
        game.renderCollection();
        this.renderMarketplace();
        game.calculateStats();
        
        game.closeModal('sellModal');
        game.showNotification('✅ Монета выставлена на продажу!');
        
        this.coinToSell = null;
    }
    
    // Покупка с рынка
    buyFromMarketplace(marketIndex) {
        if (marketIndex < 0 || marketIndex >= this.marketplace.length) {
            game.showNotification('Предложение не найдено', 'error');
            return;
        }
        
        const item = this.marketplace[marketIndex];
        
        if (!item) {
            game.showNotification('Предложение не найдено', 'error');
            return;
        }
        
        if (item.sellerId === game.userId) {
            game.showNotification('Нельзя купить свою же монету', 'error');
            return;
        }
        
        if (game.balance < item.price) {
            game.showNotification('Недостаточно звезд', 'error');
            return;
        }
        
        // Расчет комиссии
        const commission = Math.floor(item.price * CONFIG.MARKETPLACE.COMMISSION);
        const sellerGets = item.price - commission;
        
        // Покупка
        game.balance -= item.price;
        game.stats.totalBought++;
        game.stats.totalTransactions++;
        
        // Добавляем в коллекцию
        const purchasedCoin = {
            ...item.coin,
            purchaseId: `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            purchasedFrom: item.sellerName,
            purchasePrice: item.price,
            purchaseDate: Date.now()
        };
        
        game.collection.push(purchasedCoin);
        
        // Удаляем с рынка
        this.marketplace.splice(marketIndex, 1);
        
        // Сохраняем изменения
        game.saveGameData();
        this.saveMarketplace();
        
        // Обновляем UI
        game.updateBalance();
        game.renderCollection();
        this.renderMarketplace();
        game.calculateStats();
        
        game.showNotification(
            `🎉 Куплено: ${item.coin.name} за ${item.price} ⭐! ` +
            `(комиссия: ${commission} ⭐)`
        );
    }
    
    // Отмена продажи
    cancelSale(marketIndex) {
        if (marketIndex < 0 || marketIndex >= this.marketplace.length) {
            game.showNotification('Предложение не найдено', 'error');
            return;
        }
        
        const item = this.marketplace[marketIndex];
        
        if (item.sellerId === game.userId) {
            // Возвращаем монету в коллекцию
            game.collection.push(item.coin);
            
            // Удаляем с рынка
            this.marketplace.splice(marketIndex, 1);
            
            // Сохраняем изменения
            game.saveGameData();
            this.saveMarketplace();
            
            // Обновляем UI
            game.renderCollection();
            this.renderMarketplace();
            game.calculateStats();
            
            game.showNotification('✅ Продажа отменена, монета возвращена в коллекцию');
        }
    }
    
    // Фильтрация и сортировка
    filterMarketplace() {
        const rarityFilter = document.getElementById('rarityFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (rarityFilter) this.filters.rarity = rarityFilter.value;
        if (sortFilter) this.filters.sort = sortFilter.value;
        
        this.applyFilters();
    }
    
    applyFilters() {
        let filtered = [...this.marketplace];
        
        // Фильтрация по редкости
        if (this.filters.rarity !== 'all') {
            filtered = filtered.filter(item => 
                item.coin.rarity === this.filters.rarity
            );
        }
        
        // Сортировка
        switch (this.filters.sort) {
            case 'cheapest':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'expensive':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => b.timestamp - a.timestamp);
                break;
        }
        
        this.renderMarketplace(filtered);
    }
    
    // Рендер рынка
    renderMarketplace(items = null) {
        const content = document.getElementById('marketplaceContent');
        if (!content) return;
        
        const displayItems = items || this.marketplace;
        
        if (displayItems.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <div style="font-size: 3em; margin-bottom: 12px;">🔄</div>
                    <p>На рынке пока нет предложений</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Будьте первым, кто выставит монету на продажу!</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = displayItems.map((item, index) => {
            const isOwnItem = item.sellerId === game.userId;
            const canBuy = game.balance >= item.price && !isOwnItem;
            const rarityInfo = ConfigUtils.getRarityInfo(item.coin.rarity);
            const timeAgo = this.getTimeAgo(item.timestamp);
            
            return `
                <div class="marketplace-item">
                    <div style="font-size: 2.5em; cursor: pointer;" 
                         onclick="game.showCoinInfo(${item.coin.id})">
                        ${item.coin.icon}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 1.1em; cursor: pointer;"
                             onclick="game.showCoinInfo(${item.coin.id})">
                            ${item.coin.name}
                        </div>
                        <div style="color: #6b7280; font-size: 0.9em;">
                            <span class="coin-rarity rarity-${item.coin.rarity}" 
                                  style="font-size: 0.8em; padding: 2px 8px;">
                                ${rarityInfo.name}
                            </span>
                            • ${item.coin.edition}
                        </div>
                        <div class="seller-info">
                            <div class="seller-avatar">${item.sellerName.charAt(0)}</div>
                            <span>${item.sellerName}</span>
                            <span class="user-rating">⭐ ${item.sellerRating}</span>
                            <span style="color: #9ca3af; font-size: 0.8em;">• ${timeAgo}</span>
                        </div>
                        <div style="color: #f59e0b; font-weight: bold; font-size: 1.2em; margin-top: 4px;">
                            ${item.price} ⭐
                        </div>
                    </div>
                    <div class="marketplace-actions">
                        ${isOwnItem ? `
                            <button class="btn btn-secondary btn-small" 
                                    onclick="marketplace.cancelSale(${index})">
                                ❌ Снять
                            </button>
                        ` : `
                            <button class="btn btn-small" 
                                    onclick="marketplace.buyFromMarketplace(${index})" 
                                    ${!canBuy ? 'disabled' : ''}>
                                Купить
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Вспомогательные функции
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} д. назад`;
        if (hours > 0) return `${hours} ч. назад`;
        if (minutes > 0) return `${minutes} мин. назад`;
        return 'только что';
    }
    
    cleanupOldItems() {
        const now = Date.now();
        const maxAge = CONFIG.MARKETPLACE.AUTO_REMOVE_DAYS * 24 * 60 * 60 * 1000;
        
        const initialLength = this.marketplace.length;
        this.marketplace = this.marketplace.filter(item => 
            (now - item.timestamp) < maxAge
        );
        
        if (this.marketplace.length !== initialLength) {
            this.saveMarketplace();
            this.renderMarketplace();
        }
    }
    
    // Статистика рынка
    getMarketplaceStats() {
        const totalItems = this.marketplace.length;
        const totalValue = this.marketplace.reduce((sum, item) => sum + item.price, 0);
        const myItems = this.marketplace.filter(item => item.sellerId === game.userId).length;
        
        return {
            totalItems,
            totalValue,
            myItems,
            averagePrice: totalItems > 0 ? Math.floor(totalValue / totalItems) : 0
        };
    }
}

// Создаем глобальный экземпляр рынка
const marketplace = new MarketplaceSystem();