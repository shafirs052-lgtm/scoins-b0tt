// SCoinS PRO - Система платежей
class PaymentSystem {
    constructor() {
        this.selectedPayment = 'stars';
        this.selectedAmount = 100;
        this.currentPaymentId = null;
        this.paymentCheckInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadPaymentSettings();
    }
    
    setupEventListeners() {
        // Обработчик кастомной суммы
        const customAmountInput = document.getElementById('customAmount');
        if (customAmountInput) {
            customAmountInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                    this.selectedAmount = value;
                    this.updateAmountButtons();
                }
            });
            
            customAmountInput.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value);
                if (value < CONFIG.MIN_TOPUP_AMOUNT) {
                    e.target.value = CONFIG.MIN_TOPUP_AMOUNT;
                    this.selectedAmount = CONFIG.MIN_TOPUP_AMOUNT;
                }
            });
        }
    }
    
    loadPaymentSettings() {
        // Загрузка сохраненных настроек платежей
        try {
            const saved = localStorage.getItem('scoins_payment_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.selectedPayment = settings.selectedPayment || 'stars';
                this.selectedAmount = settings.selectedAmount || 100;
            }
        } catch (e) {
            console.error('Ошибка загрузки настроек платежей:', e);
        }
        
        this.updatePaymentUI();
    }
    
    savePaymentSettings() {
        const settings = {
            selectedPayment: this.selectedPayment,
            selectedAmount: this.selectedAmount,
            lastUpdated: Date.now()
        };
        
        try {
            localStorage.setItem('scoins_payment_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Ошибка сохранения настроек платежей:', e);
        }
    }
    
    // Выбор способа оплаты
    selectPayment(method) {
        if (!CONFIG.PAYMENT_METHODS[method.toUpperCase()]?.enabled) {
            game.showNotification('Этот способ оплаты временно недоступен', 'error');
            return;
        }
        
        this.selectedPayment = method;
        this.updatePaymentUI();
        this.savePaymentSettings();
    }
    
    // Выбор суммы
    selectAmount(amount) {
        this.selectedAmount = amount;
        document.getElementById('customAmount').value = amount;
        this.updateAmountButtons();
        this.savePaymentSettings();
    }
    
    updatePaymentUI() {
        // Обновление выбранного способа оплаты
        document.querySelectorAll('.payment-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[onclick="paymentSystem.selectPayment('${this.selectedPayment}')"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        this.updateAmountButtons();
    }
    
    updateAmountButtons() {
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`[onclick="paymentSystem.selectAmount(${this.selectedAmount})"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
    
    // Запуск процесса оплаты
    startPayment() {
        const customAmountInput = document.getElementById('customAmount');
        const customAmount = customAmountInput ? parseInt(customAmountInput.value) : this.selectedAmount;
        const amount = customAmount || this.selectedAmount;
        
        // Валидация суммы
        if (!ConfigUtils.validatePaymentAmount(amount)) {
            game.showNotification(
                `Сумма должна быть от ${CONFIG.MIN_TOPUP_AMOUNT} до ${CONFIG.MAX_TOPUP_AMOUNT} ⭐`,
                'error'
            );
            return;
        }
        
        this.currentPaymentId = `payment_${game.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        switch (this.selectedPayment) {
            case 'stars':
                this.processStarsPayment(amount);
                break;
            case 'ton':
                this.processTonPayment(amount);
                break;
            case 'crypto':
                this.processCryptoPayment(amount);
                break;
            default:
                game.showNotification('Неизвестный способ оплаты', 'error');
        }
    }
    
    // Обработка платежа через Telegram Stars
    processStarsPayment(amount) {
        // Демо-режим: мгновенное пополнение
        this.completePayment(amount);
        
        // Реальный код для Telegram Stars (раскомментировать для продакшена):
        /*
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            
            if (tg.openInvoice) {
                const invoice = {
                    title: `Пополнение баланса +${amount} ⭐`,
                    description: `Игровая валюта для ${CONFIG.GAME_NAME}`,
                    payload: this.currentPaymentId,
                    currency: 'XTR',
                    prices: [{ label: `${amount} Stars`, amount: amount * 100 }]
                };
                
                tg.openInvoice(invoice, (status) => {
                    if (status === 'paid') {
                        this.completePayment(amount);
                    } else {
                        this.showManualStarsPayment(amount);
                    }
                });
            } else {
                this.showManualStarsPayment(amount);
            }
        } else {
            this.showManualStarsPayment(amount);
        }
        */
    }
    
    showManualStarsPayment(amount) {
        const paymentAddress = CONFIG.PAYMENT_ADDRESSES.STARS;
        
        const content = `
            <div class="payment-info">
                <h4>⭐ Оплата Telegram Stars</h4>
                <div style="display: grid; gap: 8px; margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Сумма:</span>
                        <strong>${amount} Stars</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Курс:</span>
                        <strong>1 Star = 1 ⭐</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Получите:</span>
                        <strong style="color: #f59e0b;">${amount} ⭐</strong>
                    </div>
                </div>
            </div>
            
            <div class="payment-info">
                <h4>📋 Инструкция по оплате</h4>
                <ol style="margin: 12px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Переведите <strong>${amount} Stars</strong> на аккаунт:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${paymentAddress}')">
                        ${paymentAddress}
                    </div>
                    <li style="margin-bottom: 8px;">В комментарии укажите ваш ID:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${game.userId}')">
                        ${game.userId}
                    </div>
                    <li>Нажмите кнопку "Я оплатил" ниже</li>
                </ol>
            </div>
            
            <div class="checking-payment">
                <div class="spinner"></div>
                <p>Ожидание подтверждения платежа...</p>
                <p style="font-size: 0.9em; color: #6b7280; margin-top: 8px;">
                    Обычно занимает 1-2 минуты
                </p>
            </div>
            
            <div class="modal-actions">
                <button class="btn" onclick="paymentSystem.completePayment(${amount})">
                    ✅ Я оплатил, пополнить баланс
                </button>
                <button class="btn btn-secondary" onclick="paymentSystem.closePaymentModal()">
                    ❌ Отмена
                </button>
            </div>
        `;
        
        this.showPaymentModal('⭐ Оплата Telegram Stars', content);
        this.startPaymentCheck(amount);
    }
    
    // Обработка платежа через TON
    processTonPayment(amount) {
        const tonAmount = (amount / CONFIG.PAYMENT_METHODS.TON.rate).toFixed(3);
        const paymentAddress = CONFIG.PAYMENT_ADDRESSES.TON;
        
        const content = `
            <div class="payment-info">
                <h4>⚡ Оплата TON</h4>
                <div style="display: grid; gap: 8px; margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Сумма:</span>
                        <strong>${tonAmount} TON</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Курс:</span>
                        <strong>1 TON = ${CONFIG.PAYMENT_METHODS.TON.rate} ⭐</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Получите:</span>
                        <strong style="color: #f59e0b;">${amount} ⭐</strong>
                    </div>
                </div>
            </div>
            
            <div class="payment-info">
                <h4>📋 Инструкция по оплате</h4>
                <ol style="margin: 12px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Переведите <strong>${tonAmount} TON</strong> на кошелек:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${paymentAddress}')">
                        ${paymentAddress}
                    </div>
                    <li style="margin-bottom: 8px;">В комментарии укажите ваш ID:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${game.userId}')">
                        ${game.userId}
                    </div>
                    <li>Нажмите кнопку "Я оплатил" ниже</li>
                </ol>
            </div>
            
            <div class="checking-payment">
                <div class="spinner"></div>
                <p>Ожидание подтверждения платежа...</p>
                <p style="font-size: 0.9em; color: #6b7280; margin-top: 8px;">
                    Обычно занимает 2-5 минут
                </p>
            </div>
            
            <div class="modal-actions">
                <button class="btn" onclick="paymentSystem.completePayment(${amount})">
                    ✅ Я оплатил, пополнить баланс
                </button>
                <button class="btn btn-secondary" onclick="paymentSystem.closePaymentModal()">
                    ❌ Отмена
                </button>
            </div>
        `;
        
        this.showPaymentModal('⚡ Оплата TON', content);
        this.startPaymentCheck(amount);
    }
    
    // Обработка платежа через криптовалюту
    processCryptoPayment(amount) {
        const content = `
            <div class="payment-info">
                <h4>₿ Оплата криптовалютой</h4>
                <p>Выберите криптовалюту для оплаты:</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin: 20px 0;">
                <div class="payment-option" onclick="paymentSystem.showCryptoDetails('USDT', ${amount})">
                    <div class="icon">💵</div>
                    <div class="payment-title">USDT (TRC-20)</div>
                    <div class="payment-desc">Tether</div>
                </div>
                
                <div class="payment-option" onclick="paymentSystem.showCryptoDetails('BTC', ${amount})">
                    <div class="icon">₿</div>
                    <div class="payment-title">Bitcoin (BTC)</div>
                    <div class="payment-desc">Bitcoin Network</div>
                </div>
                
                <div class="payment-option" onclick="paymentSystem.showCryptoDetails('ETH', ${amount})">
                    <div class="icon">🔷</div>
                    <div class="payment-title">Ethereum (ETH)</div>
                    <div class="payment-desc">Ethereum Network</div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="paymentSystem.closePaymentModal()">
                    ❌ Отмена
                </button>
            </div>
        `;
        
        this.showPaymentModal('₿ Оплата криптовалютой', content);
    }
    
    showCryptoDetails(crypto, amount) {
        const paymentAddress = CONFIG.PAYMENT_ADDRESSES[crypto];
        const rate = this.getCryptoRate(crypto);
        const cryptoAmount = (amount / rate).toFixed(6);
        
        const content = `
            <div class="payment-info">
                <h4>${this.getCryptoIcon(crypto)} Оплата ${crypto}</h4>
                <div style="display: grid; gap: 8px; margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Сумма:</span>
                        <strong>${cryptoAmount} ${crypto}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Курс:</span>
                        <strong>1 ${crypto} = ${rate} ⭐</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Получите:</span>
                        <strong style="color: #f59e0b;">${amount} ⭐</strong>
                    </div>
                </div>
            </div>
            
            <div class="payment-info">
                <h4>📋 Инструкция по оплате</h4>
                <ol style="margin: 12px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Переведите <strong>${cryptoAmount} ${crypto}</strong> на адрес:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${paymentAddress}')">
                        ${paymentAddress}
                    </div>
                    <li style="margin-bottom: 8px;">В комментарии укажите ваш ID:</li>
                    <div class="address-box" onclick="paymentSystem.copyToClipboard('${game.userId}')">
                        ${game.userId}
                    </div>
                    <li>Нажмите кнопку "Я оплатил" ниже</li>
                </ol>
            </div>
            
            <div class="checking-payment">
                <div class="spinner"></div>
                <p>Ожидание подтверждения платежа...</p>
                <p style="font-size: 0.9em; color: #6b7280; margin-top: 8px;">
                    Подтверждение может занять до 30 минут
                </p>
            </div>
            
            <div class="modal-actions">
                <button class="btn" onclick="paymentSystem.completePayment(${amount})">
                    ✅ Я оплатил, пополнить баланс
                </button>
                <button class="btn btn-secondary" onclick="paymentSystem.closePaymentModal()">
                    ❌ Отмена
                </button>
            </div>
        `;
        
        document.getElementById('paymentContent').innerHTML = content;
        this.startPaymentCheck(amount);
    }
    
    // Завершение платежа
    completePayment(amount) {
        const parsedAmount = parseInt(amount);
        
        if (!ConfigUtils.validatePaymentAmount(parsedAmount)) {
            game.showNotification('Неверная сумма платежа', 'error');
            return;
        }
        
        // Пополнение баланса
        game.balance += parsedAmount;
        game.stats.totalTransactions++;
        
        // Сохранение и обновление
        game.saveGameData();
        game.updateBalance();
        game.calculateStats();
        
        this.closePaymentModal();
        game.showNotification(`✅ Баланс пополнен на ${parsedAmount} ⭐!`);
        
        // Логирование платежа
        this.logPayment(parsedAmount);
    }
    
    // Мониторинг платежа
    startPaymentCheck(amount) {
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
        }
        
        let attempts = 0;
        const maxAttempts = 300; // 5 минут при интервале 1 секунда
        
        this.paymentCheckInterval = setInterval(() => {
            attempts++;
            
            // В демо-режиме автоматически подтверждаем платеж через 3 секунды
            if (attempts >= 3) {
                this.completePayment(amount);
                clearInterval(this.paymentCheckInterval);
            }
            
            // В реальном режиме здесь будет проверка статуса платежа через API
            /*
            this.checkPaymentStatus().then(status => {
                if (status === 'completed') {
                    this.completePayment(amount);
                    clearInterval(this.paymentCheckInterval);
                } else if (status === 'failed' || attempts >= maxAttempts) {
                    this.showPaymentError();
                    clearInterval(this.paymentCheckInterval);
                }
            });
            */
            
        }, 1000);
    }
    
    // Вспомогательные функции
    showPaymentModal(title, content) {
        document.getElementById('paymentTitle').textContent = title;
        document.getElementById('paymentContent').innerHTML = content;
        game.showModal('paymentModal');
    }
    
    closePaymentModal() {
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
            this.paymentCheckInterval = null;
        }
        game.closeModal('paymentModal');
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            game.showNotification('📋 Скопировано в буфер обмена!');
        }).catch(() => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            game.showNotification('📋 Скопировано в буфер обмена!');
        });
    }
    
    getCryptoRate(crypto) {
        // В реальном приложении здесь должен быть API для получения актуальных курсов
        const rates = {
            'USDT': 150,
            'BTC': 45000,
            'ETH': 3000
        };
        return rates[crypto] || 100;
    }
    
    getCryptoIcon(crypto) {
        const icons = {
            'USDT': '💵',
            'BTC': '₿',
            'ETH': '🔷'
        };
        return icons[crypto] || '₿';
    }
    
    logPayment(amount) {
        const paymentLog = {
            id: this.currentPaymentId,
            userId: game.userId,
            amount: amount,
            method: this.selectedPayment,
            timestamp: Date.now(),
            status: 'completed'
        };
        
        try {
            const logs = JSON.parse(localStorage.getItem('scoins_payment_logs') || '[]');
            logs.push(paymentLog);
            localStorage.setItem('scoins_payment_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('Ошибка логирования платежа:', e);
        }
    }
    
    showPaymentError() {
        const content = document.getElementById('paymentContent');
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3em; margin-bottom: 16px;">❌</div>
                    <h4 style="color: #ef4444; margin-bottom: 12px;">Платеж не подтвержден</h4>
                    <p style="color: #6b7280; margin-bottom: 20px;">
                        Мы не получили подтверждение вашего платежа.<br>
                        Пожалуйста, проверьте транзакцию или попробуйте еще раз.
                    </p>
                    <button class="btn" onclick="paymentSystem.closePaymentModal()">
                        Понятно
                    </button>
                </div>
            `;
        }
    }
}

// Создаем глобальный экземпляр системы платежей
const paymentSystem = new PaymentSystem();