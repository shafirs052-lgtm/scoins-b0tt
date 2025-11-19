// SCoinS PRO - Конфигурация игры
const CONFIG = {
    // Основные настройки
    VERSION: '2.0.0',
    GAME_NAME: 'SCoinS PRO',
    
    // Настройки баланса
    STARTING_BALANCE: 100,
    MIN_TOPUP_AMOUNT: 15,
    MAX_TOPUP_AMOUNT: 100000,
    
    // Настройки платежей
    PAYMENT_METHODS: {
        STARS: {
            name: 'Telegram Stars',
            rate: 1, // 1 звезда = 1 ⭐
            enabled: true
        },
        TON: {
            name: 'TON',
            rate: 150, // 1 TON = 150 ⭐
            enabled: true
        },
        CRYPTO: {
            name: 'Криптовалюта',
            rate: 'dynamic', // Динамический курс
            enabled: true
        }
    },
    
    // Адреса для платежей (ЗАМЕНИТЕ НА СВОИ!)
    PAYMENT_ADDRESSES: {
        STARS: '@Shafir_052',
        TON: 'UQDuq8KaK8kAjmAQ434CZnqHi-tnJ6FV58zkkFi6jvbah-H5',
        USDT: 'UQDuq8KaK8kAjmAQ434CZnqHi-tnJ6FV58zkkFi6jvbah-H5',
        BTC: 'Soon',
        ETH: 'Soon'
    },
    
    // Настройки рынка
    MARKETPLACE: {
        COMMISSION: 0.05, // 5% комиссия с продаж
        MIN_SELL_PRICE: 1,
        MAX_ITEMS_PER_USER: 10,
        AUTO_REMOVE_DAYS: 30
    },
    
    // Настройки монет
    COINS: [
        {
            id: 1,
            name: "Бронзовый SCoin",
            icon: "🟫",
            price: 5,
            rarity: "common",
            description: "Базовая монета для начала коллекции",
            edition: "Standard"
        },
        {
            id: 2,
            name: "Серебряный SCoin",
            icon: "⚪",
            price: 15,
            rarity: "rare",
            description: "Монета из чистого серебра",
            edition: "Premium"
        },
        {
            id: 3,
            name: "Золотой SCoin",
            icon: "🟡",
            price: 50,
            rarity: "epic",
            description: "Роскошная золотая монета",
            edition: "Deluxe"
        },
        {
            id: 4,
            name: "Платиновый SCoin",
            icon: "🔘",
            price: 100,
            rarity: "legendary",
            description: "Эксклюзивная платиновая монета",
            edition: "Exclusive"
        },
        {
            id: 5,
            name: "Кристальный SCoin",
            icon: "💎",
            price: 200,
            rarity: "legendary",
            description: "Монета из чистого кристалла",
            edition: "Crystal"
        },
        {
            id: 6,
            name: "Древний SCoin",
            icon: "🏺",
            price: 150,
            rarity: "epic",
            description: "Монета древней цивилизации",
            edition: "Ancient"
        },
        {
            id: 7,
            name: "Космический SCoin",
            icon: "🚀",
            price: 300,
            rarity: "legendary",
            description: "Монета с метеоритной пылью",
            edition: "Space"
        },
        {
            id: 8,
            name: "Магический SCoin",
            icon: "🔮",
            price: 250,
            rarity: "epic",
            description: "Монета с магическими свойствами",
            edition: "Magic"
        }
    ],
    
    // Редкости монет
    RARITIES: {
        common: { name: "Обычная", color: "#6b7280", multiplier: 1 },
        rare: { name: "Редкая", color: "#3b82f6", multiplier: 2 },
        epic: { name: "Эпическая", color: "#8b5cf6", multiplier: 3 },
        legendary: { name: "Легендарная", color: "#f59e0b", multiplier: 5 }
    },
    
    // Достижения
    ACHIEVEMENTS: [
        {
            id: 1,
            name: "Начинающий коллекционер",
            description: "Соберите 5 монет",
            icon: "🎯",
            condition: (game) => game.collection.length >= 5
        },
        {
            id: 2,
            name: "Опытный трейдер",
            description: "Продайте 10 монет на рынке",
            icon: "💰",
            condition: (game) => game.stats.totalSold >= 10
        },
        {
            id: 3,
            name: "Миллионер",
            description: "Накопите 1000 ⭐",
            icon: "💎",
            condition: (game) => game.balance >= 1000
        },
        {
            id: 4,
            name: "Легенда рынка",
            description: "Купите 5 монет с рынка",
            icon: "🏆",
            condition: (game) => game.stats.totalBought >= 5
        },
        {
            id: 5,
            name: "Полная коллекция",
            description: "Соберите все виды монет",
            icon: "⭐",
            condition: (game) => {
                const uniqueCoins = new Set(game.collection.map(c => c.id));
                return uniqueCoins.size >= CONFIG.COINS.length;
            }
        }
    ]
};

// Утилиты для работы с конфигурацией
const ConfigUtils = {
    getCoinById(id) {
        return CONFIG.COINS.find(coin => coin.id === id);
    },
    
    getRarityInfo(rarity) {
        return CONFIG.RARITIES[rarity] || CONFIG.RARITIES.common;
    },
    
    validatePaymentAmount(amount) {
        return amount >= CONFIG.MIN_TOPUP_AMOUNT && amount <= CONFIG.MAX_TOPUP_AMOUNT;
    },
    
    calculateMarketPrice(originalPrice, rarity) {
        const rarityMultiplier = CONFIG.RARITIES[rarity].multiplier;
        const minPrice = Math.max(1, Math.floor(originalPrice * 0.5));
        const maxPrice = Math.floor(originalPrice * rarityMultiplier * 3);
        return { minPrice, maxPrice };
    }
};