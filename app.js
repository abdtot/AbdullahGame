// app.js - النسخة المحسنة الكاملة لأجهزة Android
'use strict';

// تعريف المتغيرات العامة
let db;
let currentStage = 1;
let currentLevel = 1;
let levelPoints = 0;
let totalPoints = 0;
let selectedCard = null;
let userName = "المستخدم";
let userEmail = "";
let playTime = 0;
let playTimer;
let gameMode = "normal";
let gameTimer;
let timeLeft = 60;
let hintCost = 10;
let comboCount = 0;
let comboTimeout;
let culturalPuzzles = [];
let mascotSystem;
let screenHistory = [];
let currentScreenId = 'stages-screen';

// نظام الصوت المحسن باستخدام Howler.js
const audioSystem = {
    sounds: {},
    isEnabled: true,
    volume: 0.7,
    isBackgroundPlaying: false,
    
    init: function() {
        // تهيئة Howler إذا كان متاحاً
        if (typeof Howl !== 'undefined') {
            this.sounds = {
                click: new Howl({ src: ['sounds/click.mp3'], volume: this.volume }),
                flip: new Howl({ src: ['sounds/flip.mp3'], volume: this.volume }),
                success: new Howl({ src: ['sounds/success.mp3'], volume: this.volume }),
                error: new Howl({ src: ['sounds/error.mp3'], volume: this.volume }),
                win: new Howl({ src: ['sounds/win.mp3'], volume: this.volume }),
                notification: new Howl({ src: ['sounds/notification.mp3'], volume: this.volume }),
                levelComplete: new Howl({ src: ['sounds/level-complete.mp3'], volume: this.volume }),
                star: new Howl({ src: ['sounds/star.mp3'], volume: this.volume }),
                hint: new Howl({ src: ['sounds/hint.mp3'], volume: this.volume }),
                unlock: new Howl({ src: ['sounds/unlock.mp3'], volume: this.volume }),
                coin: new Howl({ src: ['sounds/coin.mp3'], volume: this.volume }),
                achievement: new Howl({ src: ['sounds/achievement.mp3'], volume: this.volume }),
                timer: new Howl({ src: ['sounds/timer.mp3'], volume: this.volume }),
                applause: new Howl({ src: ['sounds/applause.mp3'], volume: this.volume }),
                background: new Howl({ 
                    src: ['sounds/background-music.mp3'], 
                    volume: this.volume * 0.3,
                    loop: true,
                    html5: true
                })
            };
        } else {
            // استخدام Audio API العادي إذا لم يكن Howler.js متاحاً
            this.initFallbackAudio();
        }
        
        this.loadSettings();
    },
    
    initFallbackAudio: function() {
        this.sounds = {
            click: new Audio('sounds/click.mp3'),
            flip: new Audio('sounds/flip.mp3'),
            success: new Audio('sounds/success.mp3'),
            error: new Audio('sounds/error.mp3'),
            win: new Audio('sounds/win.mp3'),
            notification: new Audio('sounds/notification.mp3'),
            levelComplete: new Audio('sounds/level-complete.mp3'),
            star: new Audio('sounds/star.mp3'),
            background: new Audio('sounds/background-music.mp3'),
            hint: new Audio('sounds/hint.mp3'),
            unlock: new Audio('sounds/unlock.mp3'),
            coin: new Audio('sounds/coin.mp3'),
            achievement: new Audio('sounds/achievement.mp3'),
            timer: new Audio('sounds/timer.mp3'),
            applause: new Audio('sounds/applause.mp3')
        };
        
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
            sound.preload = 'auto';
        });
        
        this.sounds.background.loop = true;
        this.sounds.background.volume = 0.3;
    },
    
    play: function(soundName) {
        if (!this.isEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                // إعادة تعيين الصوت إذا كان مشغل
                if (typeof Howl !== 'undefined') {
                    sound.stop();
                } else {
                    sound.currentTime = 0;
                }
                
                // تشغيل الصوت
                if (typeof Howl !== 'undefined') {
                    sound.play();
                } else {
                    sound.play().catch(e => {
                        console.log(`Cannot play sound ${soundName}:`, e);
                        this.playFallbackSound(soundName);
                    });
                }
            } catch (error) {
                console.error(`Error playing sound ${soundName}:`, error);
                this.playFallbackSound(soundName);
            }
        }
    },
    
    playFallbackSound: function(soundName) {
        // تشغيل صوت بديل باستخدام Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let frequency = 800;
            let duration = 0.1;
            
            switch(soundName) {
                case 'success':
                    frequency = 1200;
                    duration = 0.3;
                    break;
                case 'error':
                    frequency = 400;
                    duration = 0.2;
                    break;
                case 'click':
                    frequency = 600;
                    break;
            }
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log("Cannot play fallback sound:", e);
        }
    },
    
    playBackgroundMusic: function() {
        if (this.isEnabled && !this.isBackgroundPlaying) {
            try {
                if (typeof Howl !== 'undefined') {
                    this.sounds.background.play();
                } else {
                    this.sounds.background.play().catch(e => {
                        console.log("Cannot play background music:", e);
                    });
                }
                this.isBackgroundPlaying = true;
            } catch (error) {
                console.error("Error playing background music:", error);
            }
        }
    },
    
    stopBackgroundMusic: function() {
        if (this.isBackgroundPlaying) {
            try {
                if (typeof Howl !== 'undefined') {
                    this.sounds.background.stop();
                } else {
                    this.sounds.background.pause();
                    this.sounds.background.currentTime = 0;
                }
                this.isBackgroundPlaying = false;
            } catch (error) {
                console.error("Error stopping background music:", error);
            }
        }
    },
    
    pauseBackgroundMusic: function() {
        if (this.isBackgroundPlaying) {
            try {
                if (typeof Howl !== 'undefined') {
                    this.sounds.background.pause();
                } else {
                    this.sounds.background.pause();
                }
                this.isBackgroundPlaying = false;
            } catch (error) {
                console.error("Error pausing background music:", error);
            }
        }
    },
    
    resumeBackgroundMusic: function() {
        if (this.isEnabled && !this.isBackgroundPlaying) {
            this.playBackgroundMusic();
        }
    },
    
    toggleSound: function() {
        this.isEnabled = !this.isEnabled;
        
        if (this.isEnabled) {
            this.resumeBackgroundMusic();
        } else {
            this.pauseBackgroundMusic();
        }
        
        this.saveSettings();
        return this.isEnabled;
    },
    
    setVolume: function(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (typeof Howl !== 'undefined') {
            Object.values(this.sounds).forEach(sound => {
                sound.volume(this.volume);
            });
            this.sounds.background.volume(this.volume * 0.3);
        } else {
            Object.values(this.sounds).forEach(sound => {
                sound.volume = this.volume;
            });
            this.sounds.background.volume = this.volume * 0.3;
        }
        
        this.saveSettings();
    },
    
    loadSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readonly');
            const settingsStore = transaction.objectStore('settings');
            
            const soundRequest = settingsStore.get('sound');
            const volumeRequest = settingsStore.get('volume');
            
            const [soundResult, volumeResult] = await Promise.all([
                new Promise(resolve => {
                    soundRequest.onsuccess = () => resolve(soundRequest.result);
                    soundRequest.onerror = () => resolve(null);
                }),
                new Promise(resolve => {
                    volumeRequest.onsuccess = () => resolve(volumeRequest.result);
                    volumeRequest.onerror = () => resolve(null);
                })
            ]);
            
            if (soundResult) {
                this.isEnabled = soundResult.value;
                window.soundEnabled = this.isEnabled;
            }
            
            if (volumeResult) {
                this.setVolume(volumeResult.value);
            }
        } catch (error) {
            console.error("Error loading audio settings:", error);
        }
    },
    
    saveSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readwrite');
            const settingsStore = transaction.objectStore('settings');
            
            await Promise.all([
                new Promise(resolve => {
                    const request = settingsStore.put({ id: 'sound', value: this.isEnabled });
                    request.onsuccess = resolve;
                    request.onerror = resolve;
                }),
                new Promise(resolve => {
                    const request = settingsStore.put({ id: 'volume', value: this.volume });
                    request.onsuccess = resolve;
                    request.onerror = resolve;
                })
            ]);
            
            window.soundEnabled = this.isEnabled;
        } catch (error) {
            console.error("Error saving audio settings:", error);
        }
    },
    
    playSequence: function(soundNames, delay = 300) {
        soundNames.forEach((soundName, index) => {
            setTimeout(() => {
                this.play(soundName);
            }, index * delay);
        });
    }
};

// نظام الإشعارات
const notificationSystem = {
    isEnabled: true,
    notifications: [],
    
    show: function(title, message, type = 'info', duration = 3000) {
        if (!this.isEnabled) return;
        
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            duration
        };
        
        this.notifications.push(notification);
        this.displayNotification(notification);
    },
    
    displayNotification: function(notification) {
        const snackbar = document.getElementById('snackbar');
        if (!snackbar) return;
        
        // إضافة فئة النوع
        snackbar.className = 'snackbar';
        snackbar.classList.add(`snackbar-${notification.type}`);
        
        // تعيين المحتوى
        snackbar.innerHTML = `
            <strong>${notification.title}</strong>
            <span>${notification.message}</span>
        `;
        
        // عرض الإشعار
        snackbar.classList.add('show');
        
        // إخفاء الإشعار بعد المدة المحددة
        setTimeout(() => {
            snackbar.classList.remove('show');
            this.removeNotification(notification.id);
        }, notification.duration);
        
        audioSystem.play('notification');
    },
    
    removeNotification: function(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    },
    
    toggle: function() {
        this.isEnabled = !this.isEnabled;
        window.notificationsEnabled = this.isEnabled;
        
        if (this.isEnabled) {
            this.show('تم', 'تم تفعيل الإشعارات', 'success');
        } else {
            this.show('تم', 'تم إيقاف الإشعارات', 'info');
        }
        
        this.saveSettings();
        return this.isEnabled;
    },
    
    saveSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readwrite');
            const settingsStore = transaction.objectStore('settings');
            
            await new Promise(resolve => {
                const request = settingsStore.put({ 
                    id: 'notifications', 
                    value: this.isEnabled 
                });
                request.onsuccess = resolve;
                request.onerror = resolve;
            });
            
            window.notificationsEnabled = this.isEnabled;
        } catch (error) {
            console.error("Error saving notification settings:", error);
        }
    },
    
    loadSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readonly');
            const settingsStore = transaction.objectStore('settings');
            const request = settingsStore.get('notifications');
            
            const result = await new Promise(resolve => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
            
            if (result) {
                this.isEnabled = result.value;
                window.notificationsEnabled = this.isEnabled;
            }
        } catch (error) {
            console.error("Error loading notification settings:", error);
        }
    }
};

// نظام الاهتزاز
const vibrationSystem = {
    isEnabled: true,
    
    vibrate: function(pattern = 50) {
        if (!this.isEnabled || !navigator.vibrate) return;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.error("Error vibrating:", error);
        }
    },
    
    toggle: function() {
        this.isEnabled = !this.isEnabled;
        window.vibrationEnabled = this.isEnabled;
        
        if (this.isEnabled) {
            this.vibrate(100);
            notificationSystem.show('تم', 'تم تفعيل الاهتزاز', 'success');
        } else {
            notificationSystem.show('تم', 'تم إيقاف الاهتزاز', 'info');
        }
        
        this.saveSettings();
        return this.isEnabled;
    },
    
    saveSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readwrite');
            const settingsStore = transaction.objectStore('settings');
            
            await new Promise(resolve => {
                const request = settingsStore.put({ 
                    id: 'vibration', 
                    value: this.isEnabled 
                });
                request.onsuccess = resolve;
                request.onerror = resolve;
            });
            
            window.vibrationEnabled = this.isEnabled;
        } catch (error) {
            console.error("Error saving vibration settings:", error);
        }
    },
    
    loadSettings: async function() {
        if (!db) return;
        
        try {
            const transaction = db.transaction(['settings'], 'readonly');
            const settingsStore = transaction.objectStore('settings');
            const request = settingsStore.get('vibration');
            
            const result = await new Promise(resolve => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
            
            if (result) {
                this.isEnabled = result.value;
                window.vibrationEnabled = this.isEnabled;
            }
        } catch (error) {
            console.error("Error loading vibration settings:", error);
        }
    }
};

// نظام التصفح والتاريخ
const navigationSystem = {
    history: [],
    currentScreen: 'stages-screen',
    
    navigateTo: function(screenId, direction = 'auto') {
        // حفظ الشاشة الحالية في التاريخ
        if (this.currentScreen !== screenId) {
            this.history.push({
                screen: this.currentScreen,
                data: this.getCurrentScreenData()
            });
            
            // الحفاظ على حجم معقول للتاريخ
            if (this.history.length > 10) {
                this.history.shift();
            }
        }
        
        // تحديث الشاشة الحالية
        this.currentScreen = screenId;
        currentScreenId = screenId;
        
        // تحديث زر العودة
        this.updateBackButton();
        
        // الانتقال للشاشة
        showScreen(screenId, direction);
    },
    
    goBack: function() {
        if (this.history.length === 0) {
            // إذا لم يكن هناك تاريخ، العودة للرئيسية
            this.navigateTo('stages-screen', 'right');
            return;
        }
        
        const previousScreen = this.history.pop();
        this.currentScreen = previousScreen.screen;
        currentScreenId = previousScreen.screen;
        
        // تحديث زر العودة
        this.updateBackButton();
        
        // استعادة بيانات الشاشة السابقة
        this.restoreScreenData(previousScreen);
        
        // العودة للشاشة السابقة
        showScreen(previousScreen.screen, 'right');
    },
    
    getCurrentScreenData: function() {
        const data = {
            screen: this.currentScreen
        };
        
        switch(this.currentScreen) {
            case 'levels-screen':
                data.stage = currentStage;
                break;
            case 'game-screen':
                data.stage = currentStage;
                data.level = currentLevel;
                data.mode = gameMode;
                break;
        }
        
        return data;
    },
    
    restoreScreenData: function(screenData) {
        switch(screenData.screen) {
            case 'levels-screen':
                if (screenData.data && screenData.data.stage) {
                    currentStage = screenData.data.stage;
                    loadLevels(currentStage);
                }
                break;
            case 'game-screen':
                if (screenData.data) {
                    currentStage = screenData.data.stage || currentStage;
                    currentLevel = screenData.data.level || currentLevel;
                    gameMode = screenData.data.mode || gameMode;
                    
                    const levelData = levelsData.find(l => l.id === currentLevel);
                    if (levelData) {
                        setupGameScreen(levelData);
                    }
                }
                break;
        }
    },
    
    updateBackButton: function() {
        const backButton = document.getElementById('back-button');
        if (!backButton) return;
        
        // إظهار زر العودة فقط إذا لم نكن في الشاشة الرئيسية
        if (this.currentScreen !== 'stages-screen' && this.history.length > 0) {
            backButton.classList.add('show');
        } else {
            backButton.classList.remove('show');
        }
    },
    
    clearHistory: function() {
        this.history = [];
        this.updateBackButton();
    }
};

// نظام الكومبو
const comboSystem = {
    count: 0,
    multiplier: 1,
    timeout: null,
    
    start: function() {
        this.count = 0;
        this.multiplier = 1;
        this.updateDisplay();
    },
    
    add: function() {
        this.count++;
        
        // حساب المضاعف بناءً على عدد الكومبو
        if (this.count >= 10) {
            this.multiplier = 3;
        } else if (this.count >= 5) {
            this.multiplier = 2;
        } else {
            this.multiplier = 1;
        }
        
        this.updateDisplay();
        this.resetTimeout();
        
        // تشغيل صوت الكومبو
        if (this.count > 1) {
            audioSystem.play('star');
        }
        
        // اهتزاز للكومبو العالي
        if (this.count >= 5) {
            vibrationSystem.vibrate(100);
        }
        
        return this.multiplier;
    },
    
    reset: function() {
        if (this.count > 1) {
            notificationSystem.show(
                'كومبو انتهى', 
                `لقد حصلت على ${this.count} كومبو!`, 
                'info'
            );
        }
        
        this.count = 0;
        this.multiplier = 1;
        this.updateDisplay();
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    },
    
    resetTimeout: function() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        this.timeout = setTimeout(() => {
            this.reset();
        }, 3000); // الكومبو ينتهي بعد 3 ثوان من عدم النشاط
    },
    
    updateDisplay: function() {
        const comboCounter = document.getElementById('combo-counter');
        const comboCount = document.getElementById('combo-count');
        
        if (comboCounter && comboCount) {
            comboCount.textContent = this.count;
            
            if (this.count > 1) {
                comboCounter.classList.add('active');
                comboCounter.style.display = 'flex';
                
                // تأثيرات بصرية للكومبو العالي
                if (this.count >= 5) {
                    comboCounter.style.background = 'var(--gradient-warning)';
                }
                
                // إعادة تشغيل animation
                comboCounter.style.animation = 'none';
                setTimeout(() => {
                    comboCounter.style.animation = 'comboPulse 0.5s ease-in-out';
                }, 10);
            } else {
                comboCounter.classList.remove('active');
                comboCounter.style.background = '';
            }
        }
    },
    
    getBonusPoints: function(basePoints) {
        return basePoints * this.multiplier;
    }
};

// بيانات التطبيق
const stagesData = [
    {
        id: 1,
        title: "غابة البداية",
        background: 'backgrounds/stage-1.jpg',
        requiredPoints: 0,
        levels: 23,
        position: { x: 10, y: 50 },
        description: "ابدأ رحلتك في هذه الغابة الغامضة",
        color: '#00b894'
    },
    {
        id: 2,
        title: "جبال التحدي",
        background: 'backgrounds/stage-2.jpg',
        requiredPoints: 69,
        levels: 25,
        position: { x: 30, y: 20 },
        description: "تسلق جبال التحدي الصعبة",
        color: '#fd79a8'
    },
    {
        id: 3,
        title: "وادي الألغاز",
        background: 'backgrounds/stage-3.jpg',
        requiredPoints: 144,
        levels: 30,
        position: { x: 50, y: 70 },
        description: "حل ألغاز الوادي العجيبة",
        color: '#6c5ce7'
    },
    {
        id: 4,
        title: "قلعة الحكمة",
        background: 'backgrounds/stage-4.jpg',
        requiredPoints: 234,
        levels: 42,
        position: { x: 70, y: 30 },
        description: "ادخل قلعة الحكمة القديمة",
        color: '#fdcb6e'
    },
    {
        id: 5,
        title: "قمة البطولة",
        background: 'backgrounds/stage-5.jpg',
        requiredPoints: 360,
        levels: 50,
        position: { x: 90, y: 50 },
        description: "وصل إلى قمة البطولة النهائية",
        color: '#0984e3'
    }
];

const levelsData = [];
const achievementsData = [];
const shopItemsData = [];

// إنشاء بيانات المستويات
let levelCounter = 1;
for (let stage = 1; stage <= stagesData.length; stage++) {
    const stageInfo = stagesData[stage-1];
    
    for (let level = 1; level <= stageInfo.levels; level++) {
        const cards = [];
        
        for (let j = 1; j <= 3; j++) {
            cards.push({ 
                id: `${levelCounter}-${j}`, 
                type: 'puzzle', 
                path: `img/stage-${stage}/puzzle-${level}-${j}.jpg` 
            });
            cards.push({ 
                id: `${levelCounter}-${j}`, 
                type: 'solution', 
                path: `img/stage-${stage}/solution-${level}-${j}.jpg` 
            });
        }
        
        levelsData.push({
            id: levelCounter,
            stage: stage,
            level: level,
            cards: cards,
            background: `backgrounds/level-${levelCounter}.jpg`,
            requiredPoints: (levelCounter > 1) ? (levelCounter-1) * 3 : 0,
            difficulty: Math.min(5, Math.ceil(levelCounter / 20))
        });
        
        levelCounter++;
    }
}

// نظام شخصية المرشد المحسن
class MascotSystem {
    constructor() {
        this.messages = [
            "مرحباً! أنا روبو، مرشدك في رحلة البطولة!",
            "حل الألغاز الثقافية يكسبك نقاطاً إضافية!",
            "استخدم التلميحات بحكمة، فهي تكلف نقاطاً!",
            "استمر في السلسلة لتحصل على نقاط كومبو مضاعفة!",
            "أكمل 5 مستويات لتحصل على إنجاز البطل المبتدئ!",
            "التحدي اليومي يتجدد كل 24 ساعة، لا تفوته!",
            "شاهد النقاط تزداد وأنت تتقدم في الرحلة!",
            "كل مرحلة هي مغامرة جديدة مليئة بالتحديات!",
            "استخدم زر العودة للرجوع للصفحة السابقة!",
            "لا تنسَ زيارة المتجر للحصول على تعزيزات مفيدة!"
        ];
        
        this.currentMessageIndex = 0;
        this.isVisible = true;
        this.lastInteraction = Date.now();
        this.interactionInterval = 30000; // 30 ثانية
        
        // رسائل تلقائية
        this.autoMessages = [
            "أرى أنك تتقدم بشكل رائع! تابع العمل الجيد!",
            "هل تحتاج مساعدة؟ انقر عليّ للحصول على تلميحات!",
            "لا تستسلم، كل تحدي يقويك أكثر!",
            "تذكر أن المتجر به تعزيزات رائعة لمساعدتك!",
            "حاول إكمال السلسلة لتحصل على نقاط إضافية!"
        ];
    }
    
    showMessage(message = null, auto = false) {
        if (!message) {
            message = this.messages[this.currentMessageIndex];
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        }
        
        const dialog = document.getElementById('mascot-dialog');
        const messageElement = document.getElementById('mascot-message');
        
        if (!dialog || !messageElement) return;
        
        messageElement.textContent = message;
        dialog.classList.add('show');
        
        // تحديث وقت التفاعل الأخير
        this.lastInteraction = Date.now();
        
        // تشغيل صوت الإشعار
        audioSystem.play('notification');
        
        // إخفاء الرسالة تلقائياً بعد 5 ثوان (إذا كانت تلقائية)
        const hideDelay = auto ? 3000 : 5000;
        setTimeout(() => {
            this.hideMessage();
        }, hideDelay);
    }
    
    hideMessage() {
        const dialog = document.getElementById('mascot-dialog');
        if (dialog) {
            dialog.classList.remove('show');
        }
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const mascot = document.getElementById('mascot');
        if (mascot) {
            mascot.style.display = this.isVisible ? 'flex' : 'none';
            audioSystem.play('click');
        }
    }
    
    startAutoMessages() {
        // عرض رسائل تلقائية كل فترة
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastInteraction = now - this.lastInteraction;
            
            // إذا مرت فترة طويلة دون تفاعل، عرض رسالة تلقائية
            if (timeSinceLastInteraction > this.interactionInterval) {
                const randomMessage = this.autoMessages[
                    Math.floor(Math.random() * this.autoMessages.length)
                ];
                this.showMessage(randomMessage, true);
            }
        }, 60000); // التحقق كل دقيقة
    }
    
    // رسائل خاصة بناءً على الأحداث
    showEventMessage(event) {
        let message = '';
        
        switch(event) {
            case 'level_complete':
                message = "أحسنت! لقد أتممت المستوى بنجاح!";
                break;
            case 'combo':
                message = "رائع! استمر في السلسلة!";
                break;
            case 'achievement':
                message = "مبارك! لقد حققت إنجازاً جديداً!";
                break;
            case 'hint_used':
                message = "تلميح جيد! استخدمه بحكمة في المرات القادمة!";
                break;
            case 'new_stage':
                message = "مرحلة جديدة! مغامرة جديدة تنتظرك!";
                break;
        }
        
        if (message) {
            this.showMessage(message);
        }
    }
}

// === التأثيرات البصرية ===

// تأثير الغبار السحري
function createMagicDust(x, y, color = null) {
    const dustContainer = document.createElement('div');
    dustContainer.className = 'magic-dust';
    dustContainer.style.left = x + 'px';
    dustContainer.style.top = y + 'px';
    
    const particleCount = 15;
    const colors = color ? [color] : [
        '#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#a29bfe', '#0984e3'
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'magic-particle';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        const size = Math.random() * 8 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = color;
        
        // إعداد خصائص CSS للحركة
        particle.style.setProperty('--tx', `${Math.cos(angle) * speed}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * speed}px`);
        
        dustContainer.appendChild(particle);
    }
    
    document.body.appendChild(dustContainer);
    
    // إزالة الحاوية بعد انتهاء التأثير
    setTimeout(() => {
        if (dustContainer.parentNode) {
            dustContainer.remove();
        }
    }, 1200);
}

// تأثير النجوم في الخلفية
function createStarsBackground() {
    const starsCount = 50;
    const container = document.body;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        const duration = Math.random() * 4 + 2;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        star.style.background = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
        star.style.boxShadow = `0 0 ${size * 2}px rgba(255, 255, 255, 0.5)`;
        
        container.appendChild(star);
    }
}

// تأثير Confetti محسن
function createEnhancedConfetti(type = 'celebration') {
    // استخدام مكتبة canvas-confetti إذا كانت متاحة
    if (typeof confetti === 'function') {
        const config = {
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#a29bfe', '#0984e3']
        };
        
        if (type === 'achievement') {
            config.particleCount = 200;
            config.spread = 100;
            config.colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#6c5ce7'];
        }
        
        confetti(config);
        
        // تأثير إضافي بعد فترة
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: config.colors
            });
            
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: config.colors
                });
            }, 100);
        }, 150);
    }
    
    // تأثيرات إضافية مع emojis
    createEmojiConfetti(type);
    
    // تشغيل صوت التصفيق
    audioSystem.play('applause');
    
    // تأثير اهتزاز للشاشة
    if (type === 'achievement') {
        gsap.to('body', {
            y: -10,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: "power1.inOut"
        });
    }
}

function createEmojiConfetti(type = 'celebration') {
    const emojis = {
        celebration: ['🎉', '🎊', '✨', '🌟', '⭐', '💫'],
        achievement: ['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎯'],
        level: ['🎮', '👑', '💎', '🔥', '🚀', '💪']
    };
    
    const selectedEmojis = emojis[type] || emojis.celebration;
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = 'confetti-emoji';
            emoji.textContent = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
            emoji.style.left = Math.random() * 100 + '%';
            emoji.style.fontSize = Math.random() * 30 + 20 + 'px';
            
            // دوران عشوائي
            const rotation = Math.random() * 720 - 360;
            emoji.style.transform = `rotate(${rotation}deg)`;
            
            document.body.appendChild(emoji);
            
            setTimeout(() => {
                if (emoji.parentNode) {
                    emoji.remove();
                }
            }, 2000);
        }, i * 50);
    }
}

// === نظام الخريطة التفاعلية ===

function createStagesMap() {
    const mapContainer = document.getElementById('stages-map');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '';
    
    stagesData.forEach((stage, index) => {
        // إنشاء نقطة المرحلة
        const stagePoint = document.createElement('div');
        stagePoint.className = 'stage-point';
        stagePoint.style.left = `${stage.position.x}%`;
        stagePoint.style.top = `${stage.position.y}%`;
        stagePoint.dataset.stage = stage.id;
        stagePoint.dataset.title = stage.title;
        stagePoint.dataset.description = stage.description;
        
        // إضافة خطوط الاتصال بين المراحل
        if (index > 0) {
            const prevStage = stagesData[index - 1];
            createConnectionLine(prevStage.position, stage.position, prevStage.color, stage.color);
        }
        
        // إنشاء العناصر داخل نقطة المرحلة
        const icon = document.createElement('i');
        icon.className = getStageIcon(stage.id);
        
        const number = document.createElement('span');
        number.textContent = stage.id;
        
        stagePoint.appendChild(icon);
        stagePoint.appendChild(number);
        
        // إضافة tooltip
        stagePoint.setAttribute('title', `${stage.title}\n${stage.description}\n${stage.levels} مستوى`);
        
        // تحديث حالة المرحلة
        updateStageStatus(stagePoint, stage);
        
        // إضافة مستمعي الأحداث
        setupStagePointEvents(stagePoint, stage);
        
        mapContainer.appendChild(stagePoint);
    });
    
    // إضافة علامات إضافية للمراحل المميزة
    addStageDecorations();
}

function createConnectionLine(start, end, startColor, endColor) {
    const line = document.createElement('div');
    line.className = 'stage-connection';
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    line.style.width = `${length}%`;
    line.style.left = `${start.x}%`;
    line.style.top = `${start.y}%`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    
    // تدرج لوني بين لوني المرحلتين
    if (startColor && endColor) {
        line.style.background = `linear-gradient(90deg, ${startColor}40, ${endColor}40)`;
    }
    
    document.getElementById('stages-map').appendChild(line);
}

function getStageIcon(stageId) {
    const icons = [
        'fas fa-seedling',
        'fas fa-mountain',
        'fas fa-tree',
        'fas fa-fort-awesome',
        'fas fa-crown'
    ];
    return icons[stageId - 1] || 'fas fa-map-marker';
}

function updateStageStatus(stagePoint, stage) {
    stagePoint.classList.remove('completed', 'available', 'locked');
    
    if (stage.id === 1) {
        stagePoint.classList.add('available');
        return;
    }
    
    // التحقق من قاعدة البيانات
    if (db) {
        const transaction = db.transaction(['stages'], 'readonly');
        const stagesStore = transaction.objectStore('stages');
        const request = stagesStore.get(stage.id);
        
        request.onsuccess = (event) => {
            if (request.result) {
                if (request.result.completed) {
                    stagePoint.classList.add('completed');
                } else if (totalPoints >= stage.requiredPoints) {
                    stagePoint.classList.add('available');
                } else {
                    stagePoint.classList.add('locked');
                }
            } else {
                // إذا لم تكن المرحلة مسجلة في قاعدة البيانات
                if (totalPoints >= stage.requiredPoints) {
                    stagePoint.classList.add('available');
                } else {
                    stagePoint.classList.add('locked');
                }
            }
        };
    } else {
        // بدون قاعدة البيانات، نعتمد فقط على النقاط
        if (totalPoints >= stage.requiredPoints) {
            stagePoint.classList.add('available');
        } else {
            stagePoint.classList.add('locked');
        }
    }
}

function setupStagePointEvents(stagePoint, stage) {
    // حدث النقر
    stagePoint.addEventListener('click', () => {
        if (!stagePoint.classList.contains('locked')) {
            handleStageClick(stagePoint, stage);
        } else {
            handleLockedStageClick(stage);
        }
    });
    
    // أحداث hover باستخدام GSAP
    stagePoint.addEventListener('mouseenter', () => {
        if (!stagePoint.classList.contains('locked')) {
            gsap.to(stagePoint, {
                scale: 1.15,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
        }
    });
    
    stagePoint.addEventListener('mouseleave', () => {
        gsap.to(stagePoint, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    });
    
    // أحداث اللمس لأجهزة Android
    stagePoint.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!stagePoint.classList.contains('locked')) {
            gsap.to(stagePoint, {
                scale: 0.95,
                duration: 0.1
            });
        }
    });
    
    stagePoint.addEventListener('touchend', (e) => {
        e.preventDefault();
        gsap.to(stagePoint, {
            scale: 1,
            duration: 0.1
        });
        
        if (!stagePoint.classList.contains('locked')) {
            handleStageClick(stagePoint, stage);
        }
    });
}

function handleStageClick(stagePoint, stage) {
    // تأثيرات النقر
    vibrationSystem.vibrate(50);
    audioSystem.play('click');
    
    // تأثير الغبار
    const rect = stagePoint.getBoundingClientRect();
    createMagicDust(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        stage.color || '#6c5ce7'
    );
    
    // رسالة من المرشد
    if (mascotSystem) {
        mascotSystem.showEventMessage('new_stage');
    }
    
    // الانتقال لشاشة المستويات
    navigationSystem.navigateTo('levels-screen');
    showLevelsScreen(stage.id);
}

function handleLockedStageClick(stage) {
    vibrationSystem.vibrate(100);
    audioSystem.play('error');
    
    notificationSystem.show(
        'مرحلة مقفلة',
        `تحتاج ${stage.requiredPoints} نقطة لفتح هذه المرحلة`,
        'warning'
    );
}

function addStageDecorations() {
    // إضافة تأثيرات إضافية للمراحل المميزة
    stagesData.forEach((stage, index) => {
        if (index === 0 || index === stagesData.length - 1) {
            const stagePoint = document.querySelector(`.stage-point[data-stage="${stage.id}"]`);
            if (stagePoint) {
                // إضافة توهج خاص
                const glow = document.createElement('div');
                glow.className = 'stage-glow';
                glow.style.cssText = `
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle, ${stage.color}40, transparent 70%);
                    animation: pulse 2s infinite;
                    z-index: -1;
                `;
                stagePoint.appendChild(glow);
            }
        }
    });
}

// === نظام التصفح بين الشاشات ===

function showScreen(screenId, direction = 'auto') {
    const currentScreen = document.querySelector('.screen.active');
    const targetScreen = document.getElementById(screenId);
    
    if (!targetScreen || (currentScreen && currentScreen.id === screenId)) {
        return;
    }
    
    // تحديد اتجاه الانتقال
    if (direction === 'auto') {
        direction = getTransitionDirection(screenId);
    }
    
    // إعداد فئات الانتقال
    const transitionClasses = {
        left: { current: 'slide-left', target: 'slide-right' },
        right: { current: 'slide-right', target: 'slide-left' },
        fade: { current: 'fade-out', target: 'fade-in' }
    };
    
    const transition = transitionClasses[direction] || transitionClasses.left;
    
    // تطبيق الانتقال
    if (currentScreen) {
        currentScreen.classList.add(transition.current);
    }
    
    targetScreen.classList.add(transition.target);
    
    setTimeout(() => {
        if (currentScreen) {
            currentScreen.classList.remove('active', transition.current);
        }
        targetScreen.classList.remove(transition.target);
        targetScreen.classList.add('active');
        
        // تحديث شريط التنقل السفلي
        updateBottomNav(screenId);
        
        // تشغيل صوت الانتقال
        audioSystem.play('click');
        
        // تأثيرات خاصة لكل شاشة
        handleScreenTransitionEffects(screenId);
    }, 400);
}

function getTransitionDirection(targetScreen) {
    const screensOrder = [
        'stages-screen',
        'levels-screen',
        'game-screen',
        'profile-screen',
        'achievements-screen',
        'shop-screen',
        'leaderboard-screen',
        'settings-screen',
        'help-screen'
    ];
    
    const currentIndex = screensOrder.indexOf(currentScreenId);
    const targetIndex = screensOrder.indexOf(targetScreen);
    
    if (currentIndex === -1 || targetIndex === -1) {
        return 'left';
    }
    
    return targetIndex > currentIndex ? 'left' : 'right';
}

function updateBottomNav(screenId) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        
        const target = item.getAttribute('data-target');
        if (target === screenId) {
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
        }
    });
}

function handleScreenTransitionEffects(screenId) {
    switch(screenId) {
        case 'stages-screen':
            createStagesMap();
            updateStagesMap();
            break;
            
        case 'levels-screen':
            loadLevels(currentStage);
            break;
            
        case 'game-screen':
            // تأثيرات دخول شاشة اللعبة
            gsap.from('#app-cards .card, #player-cards .player-card', {
                y: 50,
                opacity: 0,
                stagger: 0.1,
                duration: 0.5,
                ease: "back.out(1.7)"
            });
            break;
            
        case 'achievements-screen':
            loadAchievements();
            break;
            
        case 'shop-screen':
            loadShopItems();
            break;
            
        case 'leaderboard-screen':
            loadLeaderboard();
            break;
    }
}

// === الدوال الأساسية للعبة ===

async function initApp() {
    try {
        // إخفاء شاشة التحميل
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
        
        // تهيئة الأنظمة
        createStarsBackground();
        await initializeDB();
        
        // تهيئة الأنظمة الصوتية
        audioSystem.init();
        await notificationSystem.loadSettings();
        await vibrationSystem.loadSettings();
        
        // تهيئة أنظمة أخرى
        mascotSystem = new MascotSystem();
        comboSystem.start();
        
        // تحميل البيانات
        await loadCulturalPuzzles();
        await loadGameData();
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
        
        // التحقق من المرة الأولى
        checkFirstTime();
        
        // إعداد Service Worker
        setupServiceWorker();
        
        // بدء المؤقتات
        startPlayTimer();
        mascotSystem.startAutoMessages();
        
        // تحميل الشاشات المنفصلة
        loadProfileScreen();
        loadSettingsScreen();
        
        // عرض رسالة ترحيبية
        setTimeout(() => {
            mascotSystem.showMessage();
            audioSystem.playBackgroundMusic();
        }, 1500);
        
        console.log('التطبيق جاهز للاستخدام!');
        
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        showToast('حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.');
    }
}

async function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CardGameDB', 11);
        
        request.onerror = (event) => {
            console.error('فشل في فتح قاعدة البيانات', event);
            reject(event);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            
            // تحديث الإصدار إذا لزم الأمر
            if (event.target.result.version < 11) {
                const newRequest = indexedDB.open('CardGameDB', 11);
                newRequest.onupgradeneeded = handleUpgrade;
                newRequest.onsuccess = (e) => {
                    db = e.target.result;
                    resolve();
                };
                newRequest.onerror = reject;
            } else {
                resolve();
            }
        };
        
        request.onupgradeneeded = handleUpgrade;
        
        function handleUpgrade(event) {
            db = event.target.result;
            const oldVersion = event.oldVersion;
            
            // إنشاء/تحديث مخازن البيانات
            createObjectStores(db, oldVersion);
        }
    });
}

function createObjectStores(db, oldVersion) {
    // مخزن المستويات
    if (!db.objectStoreNames.contains('levels')) {
        const levelsStore = db.createObjectStore('levels', { keyPath: 'id' });
        levelsStore.createIndex('completed', 'completed', { unique: false });
        levelsStore.createIndex('points', 'points', { unique: false });
        levelsStore.createIndex('stage', 'stage', { unique: false });
    }
    
    // مخزن الإحصائيات
    if (!db.objectStoreNames.contains('stats')) {
        const statsStore = db.createObjectStore('stats', { keyPath: 'id' });
        statsStore.add({ id: 'puzzlesSolved', value: 0 });
        statsStore.add({ id: 'totalPoints', value: 0 });
        statsStore.add({ id: 'totalPlayTime', value: 0 });
        statsStore.add({ id: 'levelsCompleted', value: 0 });
        statsStore.add({ id: 'highestCombo', value: 0 });
    }
    
    // مخزن الإعدادات
    if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
        settingsStore.add({ id: 'vibration', value: true });
        settingsStore.add({ id: 'sound', value: true });
        settingsStore.add({ id: 'notifications', value: true });
        settingsStore.add({ id: 'volume', value: 0.7 });
        settingsStore.add({ id: 'theme', value: 'default' });
        settingsStore.add({ id: 'language', value: 'ar' });
    }
    
    // مخزن المستخدم
    if (!db.objectStoreNames.contains('user')) {
        const userStore = db.createObjectStore('user', { keyPath: 'id' });
        userStore.add({ 
            id: 'profile', 
            name: 'المستخدم',
            email: '',
            playTime: 0,
            totalPoints: 0,
            completedLevels: 0,
            currentStage: 1,
            level: 1,
            experience: 0
        });
    }
    
    // مخزن الصور
    if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'path' });
    }
    
    // مخزن الإنجازات
    if (!db.objectStoreNames.contains('achievements')) {
        const achievementsStore = db.createObjectStore('achievements', { keyPath: 'id' });
        // سيتم تحميل الإنجازات من ملف خارجي
    }
    
    // مخزن المراحل
    if (!db.objectStoreNames.contains('stages')) {
        const stagesStore = db.createObjectStore('stages', { keyPath: 'id' });
        stagesData.forEach(stage => {
            stagesStore.add({
                id: stage.id,
                title: stage.title,
                completed: false,
                completedLevels: 0,
                totalLevels: stage.levels,
                unlockedAt: stage.id === 1 ? Date.now() : null
            });
        });
    }
    
    // مخزن التحدي اليومي
    if (!db.objectStoreNames.contains('dailyChallenge')) {
        const dailyStore = db.createObjectStore('dailyChallenge', { keyPath: 'date' });
    }
    
    // مخزن تحديات الوقت
    if (!db.objectStoreNames.contains('timedChallenges')) {
        db.createObjectStore('timedChallenges', { keyPath: 'id' });
    }
    
    // مخزن متعدد اللاعبين
    if (!db.objectStoreNames.contains('multiplayer')) {
        const multiplayerStore = db.createObjectStore('multiplayer', { keyPath: 'matchId' });
        multiplayerStore.createIndex('status', 'status', { unique: false });
        multiplayerStore.createIndex('playerId', 'playerId', { unique: false });
    }
    
    // مخزن المتجر
    if (!db.objectStoreNames.contains('shop')) {
        const shopStore = db.createObjectStore('shop', { keyPath: 'id' });
        shopStore.createIndex('category', 'category', { unique: false });
        shopStore.createIndex('purchased', 'purchased', { unique: false });
    }
}

async function loadGameData() {
    if (!db) return;
    
    try {
        const transaction = db.transaction(['stats', 'user', 'settings'], 'readonly');
        const statsStore = transaction.objectStore('stats');
        const userStore = transaction.objectStore('user');
        
        // تحميل النقاط
        const pointsRequest = statsStore.get('totalPoints');
        pointsRequest.onsuccess = (event) => {
            if (pointsRequest.result) {
                totalPoints = pointsRequest.result.value;
                updatePointsDisplay();
            }
        };
        
        // تحميل بيانات المستخدم
        const userRequest = userStore.get('profile');
        userRequest.onsuccess = (event) => {
            if (userRequest.result) {
                userName = userRequest.result.name;
                userEmail = userRequest.result.email;
                playTime = userRequest.result.playTime || 0;
                currentStage = userRequest.result.currentStage || 1;
                
                // تحديث عرض اسم المستخدم
                const nameElements = document.querySelectorAll('#user-name-display, #menu-user-name');
                nameElements.forEach(el => {
                    if (el) el.textContent = userName;
                });
            }
        };
        
        // تحديث الخريطة
        updateStagesMap();
        
    } catch (error) {
        console.error("Error loading game data:", error);
    }
}

async function loadCulturalPuzzles() {
    try {
        const response = await fetch('cultural-puzzles.json');
        const data = await response.json();
        culturalPuzzles = data.puzzles;
    } catch (error) {
        console.error('فشل في تحميل الألغاز الثقافية:', error);
        // بيانات افتراضية
        culturalPuzzles = getDefaultPuzzles();
    }
}

function getDefaultPuzzles() {
    return [
        {
            id: 1,
            question: "ما هي عاصمة المملكة العربية السعودية؟",
            options: ["الرياض", "جدة", "مكة", "الدمام"],
            correctAnswer: 0,
            category: "جغرافيا",
            difficulty: 1
        },
        {
            id: 2,
            question: "من هو مؤلف كتاب 'ديوان المتنبي'؟",
            options: ["أبو تمام", "المتنبي", "أبو فراس الحمداني", "البحتري"],
            correctAnswer: 1,
            category: "أدب",
            difficulty: 2
        },
        {
            id: 3,
            question: "ما هو أطول نهر في العالم؟",
            options: ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"],
            correctAnswer: 0,
            category: "جغرافيا",
            difficulty: 2
        },
        {
            id: 4,
            question: "من هو صاحب لوحة الموناليزا؟",
            options: ["ليوناردو دافنشي", "بابلو بيكاسو", "فان جوخ", "ميكيلانجيلو"],
            correctAnswer: 0,
            category: "فن",
            difficulty: 2
        },
        {
            id: 5,
            question: "ما هي اللغة الرسمية في البرازيل؟",
            options: ["البرتغالية", "الإسبانية", "الإنجليزية", "الفرنسية"],
            correctAnswer: 0,
            category: "ثقافة عامة",
            difficulty: 1
        }
    ];
}

function showLevelsScreen(stageId) {
    currentStage = stageId;
    const stageData = stagesData.find(s => s.id === stageId);
    
    if (stageData) {
        document.getElementById('stage-title').textContent = stageData.title;
        document.getElementById('stage-levels-count').textContent = `${stageData.levels} مستوى`;
    }
    
    navigationSystem.navigateTo('levels-screen');
    loadLevels(stageId);
}

async function loadLevels(stageId) {
    const levelsContainer = document.getElementById('levels-container');
    if (!levelsContainer) return;
    
    levelsContainer.innerHTML = '<div class="loading-levels">جاري تحميل المستويات...</div>';
    
    const stageLevels = levelsData.filter(level => level.stage === stageId);
    let stagePoints = 0;
    
    try {
        // حساب نقاط المرحلة من قاعدة البيانات
        if (db) {
            const transaction = db.transaction(['levels'], 'readonly');
            const levelsStore = transaction.objectStore('levels');
            
            const levelPromises = stageLevels.map(level => {
                return new Promise(resolve => {
                    const request = levelsStore.get(level.id);
                    request.onsuccess = () => {
                        if (request.result) {
                            stagePoints += request.result.points || 0;
                        }
                        resolve();
                    };
                    request.onerror = () => resolve();
                });
            });
            
            await Promise.all(levelPromises);
        }
        
        // تحديث عرض النقاط
        document.getElementById('stage-points').textContent = stagePoints;
        updateProgress('stage-progress', stagePoints, stageLevels.length * 3);
        
        // إنشاء بطاقات المستويات
        levelsContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        for (const levelData of stageLevels) {
            const levelCard = createLevelCard(levelData);
            fragment.appendChild(levelCard);
        }
        
        levelsContainer.appendChild(fragment);
        
        // تحميل الصور بطريقة lazy
        lazyLoadImages();
        
    } catch (error) {
        console.error("Error loading levels:", error);
        levelsContainer.innerHTML = '<div class="error-message">خطأ في تحميل المستويات</div>';
    }
}

function createLevelCard(levelData) {
    const levelCard = document.createElement('div');
    levelCard.className = 'level-card glass-effect';
    levelCard.dataset.level = levelData.id;
    
    const levelBg = document.createElement('div');
    levelBg.className = 'level-bg';
    levelBg.style.backgroundImage = `url(${levelData.background})`;
    
    const levelNumber = document.createElement('div');
    levelNumber.className = 'level-number';
    levelNumber.innerHTML = `<i class="fas fa-${levelData.id === 1 ? 'play' : 'hashtag'}"></i> ${levelData.level}`;
    
    const levelStatus = document.createElement('div');
    levelStatus.className = 'level-status';
    
    // شارة الصعوبة
    if (levelData.difficulty >= 4) {
        const difficultyBadge = document.createElement('div');
        difficultyBadge.className = 'difficulty-badge';
        difficultyBadge.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
        levelCard.appendChild(difficultyBadge);
    }
    
    levelCard.appendChild(levelBg);
    levelCard.appendChild(levelNumber);
    levelCard.appendChild(levelStatus);
    
    // تحديث حالة المستوى
    updateLevelCardStatus(levelCard, levelData);
    
    // إضافة أحداث النقر
    setupLevelCardEvents(levelCard, levelData);
    
    return levelCard;
}

async function updateLevelCardStatus(levelCard, levelData) {
    const levelStatus = levelCard.querySelector('.level-status');
    
    if (!db) {
        levelStatus.innerHTML = '<i class="fas fa-star"></i> 0/3';
        if (levelData.id > 1) {
            levelCard.classList.add('locked');
            levelStatus.innerHTML = '<i class="fas fa-lock"></i> مقفل';
        }
        return;
    }
    
    try {
        const transaction = db.transaction(['levels'], 'readonly');
        const levelsStore = transaction.objectStore('levels');
        const request = levelsStore.get(levelData.id);
        
        request.onsuccess = async () => {
            if (request.result) {
                // المستوى مكتمل
                levelCard.classList.add('completed');
                levelStatus.innerHTML = `<i class="fas fa-star"></i> ${request.result.points || 0}/3`;
            } else {
                // المستوى غير مكتمل
                if (levelData.id === 1) {
                    levelStatus.innerHTML = '<i class="fas fa-play"></i> ابدأ';
                } else {
                    // التحقق من المتطلبات
                    const isUnlocked = await checkLevelUnlock(levelData);
                    if (isUnlocked) {
                        levelStatus.innerHTML = '<i class="fas fa-play"></i> ابدأ';
                    } else {
                        levelCard.classList.add('locked');
                        levelStatus.innerHTML = `<i class="fas fa-lock"></i> ${levelData.requiredPoints} نقطة`;
                    }
                }
            }
        };
    } catch (error) {
        console.error("Error updating level card status:", error);
    }
}

async function checkLevelUnlock(levelData) {
    if (totalPoints < levelData.requiredPoints) {
        return false;
    }
    
    if (levelData.id === 1) {
        return true;
    }
    
    try {
        const transaction = db.transaction(['levels'], 'readonly');
        const levelsStore = transaction.objectStore('levels');
        const prevRequest = levelsStore.get(levelData.id - 1);
        
        return new Promise(resolve => {
            prevRequest.onsuccess = () => {
                resolve(prevRequest.result && prevRequest.result.completed);
            };
            prevRequest.onerror = () => resolve(false);
        });
    } catch (error) {
        console.error("Error checking level unlock:", error);
        return false;
    }
}

function setupLevelCardEvents(levelCard, levelData) {
    levelCard.addEventListener('click', async () => {
        if (levelCard.classList.contains('locked')) {
            handleLockedLevelClick(levelData);
            return;
        }
        
        // التأثيرات
        vibrationSystem.vibrate(50);
        audioSystem.play('click');
        createMagicDust(
            levelCard.getBoundingClientRect().left + levelCard.offsetWidth / 2,
            levelCard.getBoundingClientRect().top + levelCard.offsetHeight / 2
        );
        
        // بدء المستوى
        await startLevel(levelData.id);
    });
    
    // تأثيرات hover
    levelCard.addEventListener('mouseenter', () => {
        if (!levelCard.classList.contains('locked')) {
            gsap.to(levelCard, {
                scale: 1.05,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
        }
    });
    
    levelCard.addEventListener('mouseleave', () => {
        gsap.to(levelCard, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    });
}

function handleLockedLevelClick(levelData) {
    vibrationSystem.vibrate(100);
    audioSystem.play('error');
    
    notificationSystem.show(
        'مستوى مقفل',
        `تحتاج ${levelData.requiredPoints} نقطة لفتح هذا المستوى`,
        'warning'
    );
}

async function startLevel(levelId) {
    currentLevel = levelId;
    levelPoints = 0;
    comboSystem.reset();
    
    const levelData = levelsData.find(l => l.id === levelId);
    if (!levelData) return;
    
    currentStage = levelData.stage;
    
    // عرض لغز ثقافي قبل المستوى (20% من الوقت)
    if (Math.random() < 0.2 && culturalPuzzles.length > 0) {
        await showCulturalPuzzle(levelData);
    } else {
        setupGameScreen(levelData);
    }
}

async function showCulturalPuzzle(levelData) {
    const puzzle = getRandomPuzzle();
    
    return new Promise((resolve) => {
        // إنشاء واجهة اللغز
        const puzzleHTML = `
            <div class="cultural-puzzle-overlay active">
                <div class="cultural-puzzle-container glass-effect">
                    <div class="puzzle-header">
                        <h2><i class="fas fa-brain"></i> لغز ثقافي</h2>
                        <span class="puzzle-category">${puzzle.category}</span>
                        <p class="puzzle-instruction">حل هذا اللغز لربح نقاط إضافية!</p>
                    </div>
                    <div class="puzzle-question">${puzzle.question}</div>
                    <div class="puzzle-options">
                        ${puzzle.options.map((option, index) => `
                            <button class="puzzle-option glass-effect-light" data-index="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                    <div class="puzzle-result" id="puzzle-result"></div>
                    <button class="btn puzzle-continue-btn" id="puzzle-continue-btn" style="display: none;">
                        <i class="fas fa-arrow-left"></i> متابعة إلى اللعبة
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', puzzleHTML);
        
        // تشغيل صوت اللغز
        audioSystem.play('culturalPuzzle');
        
        // إعداد أحداث الخيارات
        const options = document.querySelectorAll('.puzzle-option');
        const resultElement = document.getElementById('puzzle-result');
        const continueBtn = document.getElementById('puzzle-continue-btn');
        
        options.forEach(option => {
            option.addEventListener('click', function() {
                const selectedIndex = parseInt(this.dataset.index);
                
                // تعطيل جميع الخيارات
                options.forEach(opt => {
                    opt.disabled = true;
                    opt.style.pointerEvents = 'none';
                });
                
                if (selectedIndex === puzzle.correctAnswer) {
                    // الإجابة الصحيحة
                    this.classList.add('correct');
                    resultElement.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <strong>إجابة صحيحة!</strong>
                        <p>لقد ربحت 3 نقاط إضافية!</p>
                    `;
                    resultElement.className = 'puzzle-result correct';
                    
                    audioSystem.play('success');
                    vibrationSystem.vibrate([100, 50, 100]);
                    
                    // منح نقاط إضافية
                    totalPoints += 3;
                    updatePointsInDatabase();
                    
                } else {
                    // الإجابة الخاطئة
                    this.classList.add('incorrect');
                    options[puzzle.correctAnswer].classList.add('correct');
                    resultElement.innerHTML = `
                        <i class="fas fa-times-circle"></i>
                        <strong>إجابة خاطئة</strong>
                        <p>الإجابة الصحيحة: ${puzzle.options[puzzle.correctAnswer]}</p>
                    `;
                    resultElement.className = 'puzzle-result incorrect';
                    
                    audioSystem.play('error');
                    vibrationSystem.vibrate(200);
                }
                
                // إظهار زر المتابعة
                continueBtn.style.display = 'block';
            });
        });
        
        // حدث زر المتابعة
        continueBtn.addEventListener('click', () => {
            audioSystem.play('click');
            document.querySelector('.cultural-puzzle-overlay').remove();
            setupGameScreen(levelData);
            resolve();
        });
    });
}

function getRandomPuzzle() {
    const randomIndex = Math.floor(Math.random() * culturalPuzzles.length);
    return culturalPuzzles[randomIndex];
}

function setupGameScreen(levelData) {
    navigationSystem.navigateTo('game-screen');
    
    // تحديث معلومات المستوى
    document.getElementById('current-stage').textContent = currentStage;
    document.getElementById('current-level').textContent = levelData.level;
    document.getElementById('level-points').textContent = '0';
    document.getElementById('game-mode-badge').textContent = 
        gameMode === 'normal' ? 'عادي' : 
        gameMode === 'timed' ? 'محدد بالوقت' : 
        gameMode === 'daily' ? 'يومي' : 'متعدد';
    
    updateProgress('level-progress', 0, 3);
    
    // إعداد المؤقت (إذا كان نمط الوقت المحدد)
    if (gameMode === "timed") {
        timeLeft = 60;
        const timerContainer = document.getElementById('timer-container');
        const timerDisplay = document.getElementById('timer');
        
        if (timerContainer && timerDisplay) {
            timerContainer.style.display = 'flex';
            timerDisplay.textContent = timeLeft;
            startGameTimer();
        }
    } else {
        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) {
            timerContainer.style.display = 'none';
        }
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
    }
    
    // إعادة تعيين التلميحات
    const hintText = document.getElementById('hint-text');
    if (hintText) {
        hintText.style.display = 'none';
        hintText.innerHTML = '';
    }
    
    document.getElementById('hint-cost').textContent = hintCost;
    
    // إنشاء البطاقات
    createCards(levelData.id);
    
    // إخفاء زر المستوى التالي
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.style.display = 'none';
    }
}

function createCards(levelId) {
    const appCardsContainer = document.getElementById('app-cards');
    const playerCardsContainer = document.getElementById('player-cards');
    
    if (!appCardsContainer || !playerCardsContainer) return;
    
    appCardsContainer.innerHTML = '';
    playerCardsContainer.innerHTML = '';
    
    const levelData = levelsData.find(l => l.id === levelId);
    if (!levelData) return;
    
    const puzzleCards = levelData.cards.filter(card => card.type === 'puzzle');
    const solutionCards = levelData.cards.filter(card => card.type === 'solution');
    
    // خلط بطاقات الحل
    shuffleArray(solutionCards);
    
    // إنشاء بطاقات الألغاز
    puzzleCards.forEach(card => {
        const cardElement = createAppCardElement(card);
        appCardsContainer.appendChild(cardElement);
    });
    
    // إنشاء بطاقات الحلول
    solutionCards.forEach(card => {
        const cardElement = createPlayerCardElement(card);
        playerCardsContainer.appendChild(cardElement);
    });
    
    // تحميل الصور بطريقة lazy
    lazyLoadImages();
    
    // تأثيرات ظهور البطاقات
    animateCardsEntrance();
}

function createAppCardElement(cardData) {
    const card = document.createElement('div');
    card.className = 'card ripple';
    card.dataset.id = cardData.id;
    
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    
    const cardImage = document.createElement('img');
    cardImage.className = 'card-image loading';
    cardImage.dataset.src = cardData.path;
    cardImage.alt = 'لغز';
    cardImage.loading = 'lazy';
    
    cardFront.appendChild(cardImage);
    
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    
    // تصميم مختلف حسب نمط اللعبة
    if (gameMode === "daily") {
        cardBack.style.background = "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)";
        cardBack.innerHTML = '<div class="pattern daily">☀️</div><div>تحدي اليوم</div>';
    } else if (gameMode === "timed") {
        cardBack.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
        cardBack.innerHTML = '<div class="pattern timed">⏱️</div><div>تحدي الوقت</div>';
    } else {
        cardBack.innerHTML = '<div class="pattern">❖</div><div>؟</div>';
    }
    
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);
    
    // أحداث النقر
    card.addEventListener('click', () => {
        if (!selectedCard) {
            flipCard(card);
        }
    });
    
    return card;
}

function createPlayerCardElement(cardData) {
    const card = document.createElement('div');
    card.className = 'player-card ripple';
    card.dataset.id = cardData.id;
    
    if (gameMode === "daily") {
        card.classList.add('daily-card');
    } else if (gameMode === "timed") {
        card.classList.add('timed-card');
    }
    
    const cardImage = document.createElement('img');
    cardImage.className = 'card-image loading';
    cardImage.dataset.src = cardData.path;
    cardImage.alt = 'حل';
    cardImage.loading = 'lazy';
    
    card.appendChild(cardImage);
    
    card.addEventListener('click', () => {
        selectCard(card);
    });
    
    return card;
}

function animateCardsEntrance() {
    const cards = document.querySelectorAll('.card, .player-card');
    
    gsap.from(cards, {
        y: 100,
        opacity: 0,
        stagger: 0.05,
        duration: 0.6,
        ease: "back.out(1.7)",
        delay: 0.2
    });
}

function flipCard(card) {
    if (selectedCard || card.classList.contains('flipped')) return;
    
    card.classList.add('flipped');
    selectedCard = card;
    
    audioSystem.play('flip');
    vibrationSystem.vibrate(30);
    
    // قلب البطاقة باستخدام GSAP
    gsap.to(card.querySelector('.card-inner'), {
        rotationY: 180,
        duration: 0.6,
        ease: "power2.inOut"
    });
    
    // إعادة البطاقة تلقائياً بعد 3 ثوان
    setTimeout(() => {
        if (card.classList.contains('flipped') && selectedCard === card) {
            unflipCard(card);
        }
    }, 3000);
}

function unflipCard(card) {
    if (!card.classList.contains('flipped')) return;
    
    card.classList.remove('flipped');
    if (selectedCard === card) {
        selectedCard = null;
    }
    
    gsap.to(card.querySelector('.card-inner'), {
        rotationY: 0,
        duration: 0.6,
        ease: "power2.inOut"
    });
}

async function selectCard(card) {
    if (!selectedCard) {
        notificationSystem.show('تنبيه', 'اختر بطاقة لغز أولاً', 'info');
        vibrationSystem.vibrate(100);
        return;
    }
    
    if (selectedCard.dataset.id === card.dataset.id) {
        // الإجابة الصحيحة
        await handleCorrectAnswer(card);
    } else {
        // الإجابة الخاطئة
        await handleWrongAnswer(card);
    }
}

async function handleCorrectAnswer(card) {
    // إخفاء البطاقتين
    selectedCard.style.visibility = 'hidden';
    card.style.visibility = 'hidden';
    
    // تحديث النقاط مع الكومبو
    const comboMultiplier = comboSystem.add();
    levelPoints += comboMultiplier;
    
    // تحديث العرض
    document.getElementById('level-points').textContent = levelPoints;
    updateProgress('level-progress', levelPoints, 3);
    
    // التأثيرات
    audioSystem.play('success');
    vibrationSystem.vibrate([50, 30, 50]);
    
    // تأثير غبار النجاح
    const rect = card.getBoundingClientRect();
    createMagicDust(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        '#00b894'
    );
    
    // إشعار النجاح
    if (comboMultiplier > 1) {
        notificationSystem.show(
            'إجابة صحيحة!',
            `كومبو ×${comboMultiplier}! +${comboMultiplier} نقطة`,
            'success'
        );
    }
    
    selectedCard = null;
    
    // التحقق من إكمال المستوى
    if (levelPoints >= 3) {
        await completeLevel();
    }
}

async function handleWrongAnswer(card) {
    audioSystem.play('error');
    vibrationSystem.vibrate(200);
    
    // إعادة تعيين الكومبو
    comboSystem.reset();
    
    // خصم النقاط إذا كانت متاحة
    if (totalPoints >= 2) {
        totalPoints -= 2;
        updatePointsInDatabase();
        
        notificationSystem.show(
            'إجابة خاطئة',
            'تم خصم نقطتين',
            'warning'
        );
        
        audioSystem.play('coin');
    }
    
    // إعادة بطاقة اللغز
    if (selectedCard) {
        unflipCard(selectedCard);
    }
    
    // تأثير اهتزاز للبطاقة الخاطئة
    card.classList.add('shake');
    setTimeout(() => {
        card.classList.remove('shake');
    }, 800);
    
    selectedCard = null;
}

async function completeLevel() {
    // حساب النقاط النهائية مع الكومبو
    const finalPoints = levelPoints;
    
    // تحديث قاعدة البيانات
    try {
        const transaction = db.transaction(['levels', 'stats', 'user', 'stages'], 'readwrite');
        
        // تحديث المستوى
        const levelsStore = transaction.objectStore('levels');
        await new Promise(resolve => {
            const request = levelsStore.put({
                id: currentLevel,
                completed: true,
                points: finalPoints,
                stage: currentStage,
                completedAt: Date.now()
            });
            request.onsuccess = resolve;
            request.onerror = resolve;
        });
        
        // تحديث النقاط الإجمالية
        totalPoints += finalPoints;
        const statsStore = transaction.objectStore('stats');
        await Promise.all([
            new Promise(resolve => {
                const request = statsStore.put({ 
                    id: 'totalPoints', 
                    value: totalPoints 
                });
                request.onsuccess = resolve;
                request.onerror = resolve;
            }),
            new Promise(resolve => {
                const request = statsStore.get('highestCombo');
                request.onsuccess = () => {
                    const currentHighest = request.result ? request.result.value : 0;
                    if (comboSystem.count > currentHighest) {
                        statsStore.put({ 
                            id: 'highestCombo', 
                            value: comboSystem.count 
                        });
                    }
                    resolve();
                };
                request.onerror = resolve;
            })
        ]);
        
        // تحديث المرحلة
        const stagesStore = transaction.objectStore('stages');
        const stageRequest = stagesStore.get(currentStage);
        
        stageRequest.onsuccess = async () => {
            const stage = stageRequest.result;
            if (stage) {
                stage.completedLevels = (stage.completedLevels || 0) + 1;
                
                // التحقق من إكمال المرحلة
                if (stage.completedLevels >= stage.totalLevels) {
                    stage.completed = true;
                    stage.completedAt = Date.now();
                    
                    // فتح المرحلة التالية
                    if (currentStage < stagesData.length) {
                        const nextStageId = currentStage + 1;
                        const nextStageRequest = stagesStore.get(nextStageId);
                        
                        nextStageRequest.onsuccess = () => {
                            const nextStage = nextStageRequest.result;
                            if (nextStage) {
                                nextStage.unlockedAt = Date.now();
                                stagesStore.put(nextStage);
                            }
                        };
                    }
                }
                
                stagesStore.put(stage);
            }
        };
        
        // تحديث بيانات المستخدم
        const userStore = transaction.objectStore('user');
        const userRequest = userStore.get('profile');
        
        userRequest.onsuccess = () => {
            const user = userRequest.result;
            if (user) {
                user.completedLevels = (user.completedLevels || 0) + 1;
                user.totalPoints = totalPoints;
                user.currentStage = currentStage;
                user.experience = (user.experience || 0) + finalPoints * 10;
                
                // ترقية المستوى كل 1000 خبرة
                const newLevel = Math.floor(user.experience / 1000) + 1;
                if (newLevel > user.level) {
                    user.level = newLevel;
                    showLevelUpNotification(newLevel);
                }
                
                userStore.put(user);
            }
        };
        
        transaction.oncomplete = () => {
            onLevelCompleteSuccess(finalPoints);
        };
        
    } catch (error) {
        console.error("Error completing level:", error);
        onLevelCompleteSuccess(finalPoints);
    }
}

function onLevelCompleteSuccess(finalPoints) {
    // إيقاف المؤقت
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // تأثيرات الفوز
    createEnhancedConfetti('level');
    audioSystem.playSequence(['win', 'levelComplete', 'applause']);
    
    // رسالة التهنئة
    showMessage(
        'تهانينا!',
        `لقد أكملت المستوى ${currentLevel} بنجاح!<br>+${finalPoints} نقطة`,
        true
    );
    
    // تحديث العرض
    document.getElementById('total-points').textContent = totalPoints;
    updatePointsDisplay();
    updateStagesMap();
    
    // إظهار زر المستوى التالي
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.style.display = 'block';
    }
    
    // رسالة من المرشد
    if (mascotSystem) {
        mascotSystem.showEventMessage('level_complete');
    }
    
    // التحقق من الإنجازات
    checkAchievements();
}

function showLevelUpNotification(newLevel) {
    notificationSystem.show(
        'ترقية مستوى!',
        `تهانينا! لقد وصلت للمستوى ${newLevel}`,
        'success'
    );
    
    createEnhancedConfetti('achievement');
    audioSystem.play('achievement');
}

function checkAchievements() {
    // هنا يمكن إضافة منطق التحقق من الإنجازات
    // مثل: إكمال أول مستوى، إكمال 5 مستويات، إكمال 10 مستويات، إلخ.
}

// === دوال المساعدة ===

function updatePointsDisplay() {
    const elements = document.querySelectorAll('#total-points, #total-points-stages, #total-points-levels');
    elements.forEach(el => {
        if (el) el.textContent = totalPoints;
    });
    
    updateProgress('total-progress', totalPoints, getMaxPoints());
}

function getMaxPoints() {
    return levelsData.length * 3;
}

function updateProgress(progressBarId, current, max) {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) {
        const percentage = Math.min(100, (current / max) * 100);
        progressBar.style.width = `${percentage}%`;
    }
}

async function updatePointsInDatabase() {
    if (!db) return;
    
    try {
        const transaction = db.transaction(['stats'], 'readwrite');
        const statsStore = transaction.objectStore('stats');
        
        await new Promise(resolve => {
            const request = statsStore.put({ 
                id: 'totalPoints', 
                value: totalPoints 
            });
            request.onsuccess = resolve;
            request.onerror = resolve;
        });
        
        updatePointsDisplay();
        updateStagesMap();
    } catch (error) {
        console.error("Error updating points in database:", error);
    }
}

function updateStagesMap() {
    const stagePoints = document.querySelectorAll('.stage-point');
    stagePoints.forEach(point => {
        const stageId = parseInt(point.dataset.stage);
        const stage = stagesData.find(s => s.id === stageId);
        if (stage) {
            updateStageStatus(point, stage);
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showMessage(title, text, isLevelComplete = false) {
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    
    if (!messageOverlay || !messageTitle || !messageText) return;
    
    messageTitle.textContent = title;
    messageText.innerHTML = text;
    messageOverlay.classList.add('active');
    
    audioSystem.play('notification');
    
    // إعداد الأزرار
    const okBtn = document.getElementById('message-btn-ok');
    const cancelBtn = document.getElementById('message-btn-cancel');
    
    if (okBtn) {
        okBtn.onclick = () => {
            messageOverlay.classList.remove('active');
            audioSystem.play('click');
            
            if (isLevelComplete) {
                handleLevelCompleteClose();
            }
        };
    }
    
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => {
            messageOverlay.classList.remove('active');
            audioSystem.play('click');
        };
    } else {
        if (cancelBtn) cancelBtn.style.display = 'none';
    }
}

function handleLevelCompleteClose() {
    if (gameMode === "daily" || gameMode === "timed") {
        navigationSystem.navigateTo('stages-screen');
    } else {
        navigationSystem.goBack();
    }
}

function showToast(message, type = 'info') {
    if (typeof Toastify === 'function') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "center",
            backgroundColor: type === 'success' ? '#00b894' : 
                           type === 'error' ? '#d63031' : 
                           type === 'warning' ? '#fdcb6e' : 
                           type === 'info' ? '#0984e3' : '#6c5ce7',
            stopOnFocus: true
        }).showToast();
    }
    audioSystem.play('notification');
}

function startPlayTimer() {
    playTimer = setInterval(() => {
        playTime++;
        
        // تحديث في قاعدة البيانات كل دقيقة
        if (playTime % 60 === 0 && db) {
            const transaction = db.transaction(['user', 'stats'], 'readwrite');
            const userStore = transaction.objectStore('user');
            const statsStore = transaction.objectStore('stats');
            
            const userRequest = userStore.get('profile');
            userRequest.onsuccess = () => {
                const user = userRequest.result;
                if (user) {
                    user.playTime = (user.playTime || 0) + 1;
                    userStore.put(user);
                }
            };
            
            const statsRequest = statsStore.get('totalPlayTime');
            statsRequest.onsuccess = () => {
                const stat = statsRequest.result;
                if (stat) {
                    stat.value = (stat.value || 0) + 1;
                    statsStore.put(stat);
                }
            };
        }
    }, 1000);
}

function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        timeLeft--;
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = timeLeft;
        }
        
        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) {
            if (timeLeft <= 10) {
                timerContainer.classList.add('warning');
                if (timeLeft <= 5) {
                    audioSystem.play('timer');
                }
            }
            
            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                audioSystem.play('error');
                showMessage('انتهى الوقت', 'لقد انتهى الوقت المخصص لهذا المستوى');
            }
        }
    }, 1000);
}

function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
                
                // التحقق من التحديثات
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            notificationSystem.show(
                                'تحديث جديد',
                                'تحديث جديد متاح، يرجى تحديث الصفحة',
                                'info'
                            );
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

function checkFirstTime() {
    const isFirstTime = !localStorage.getItem('firstTime');
    
    if (isFirstTime) {
        setTimeout(() => {
            notificationSystem.show(
                'مرحباً بك!',
                'مرحباً بك في أبطال البطاقات! استمتع باللعبة',
                'info'
            );
            localStorage.setItem('firstTime', 'true');
        }, 2000);
    }
}

// === تحميل الصور بطريقة Lazy ===

function lazyLoadImages() {
    const images = document.querySelectorAll('.card-image[data-src]');
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px'
    });
    
    images.forEach(img => observer.observe(img));
}

async function loadImage(imgElement) {
    const src = imgElement.dataset.src;
    
    if (!src) return;
    
    try {
        // التحقق من التخزين المؤقت
        if (db) {
            const transaction = db.transaction(['images'], 'readonly');
            const imagesStore = transaction.objectStore('images');
            const request = imagesStore.get(src);
            
            request.onsuccess = () => {
                if (request.result) {
                    // الصورة موجودة في التخزين المؤقت
                    imgElement.src = request.result.data;
                    imgElement.classList.remove('loading');
                } else {
                    // تحميل الصورة من الشبكة
                    fetchAndCacheImage(src, imgElement);
                }
            };
        } else {
            fetchAndCacheImage(src, imgElement);
        }
    } catch (error) {
        console.error("Error loading image:", error);
        imgElement.classList.remove('loading');
        imgElement.classList.add('error');
        imgElement.alt = 'خطأ في تحميل الصورة';
    }
}

async function fetchAndCacheImage(src, imgElement) {
    try {
        const response = await fetch(src);
        const blob = await response.blob();
        
        // تحويل إلى base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = () => {
            const base64data = reader.result;
            
            // تخزين في قاعدة البيانات
            if (db) {
                const transaction = db.transaction(['images'], 'readwrite');
                const imagesStore = transaction.objectStore('images');
                imagesStore.put({ path: src, data: base64data });
            }
            
            // تعيين مصدر الصورة
            imgElement.src = base64data;
            imgElement.classList.remove('loading');
        };
    } catch (error) {
        console.error(`Failed to load image: ${src}`, error);
        imgElement.classList.remove('loading');
        imgElement.classList.add('error');
        imgElement.alt = 'خطأ في تحميل الصورة';
    }
}

// === إعداد مستمعي الأحداث ===

function setupEventListeners() {
    // زر العودة العام
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            audioSystem.play('click');
            navigationSystem.goBack();
        });
    }
    
    // زر القائمة
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sideMenu = document.getElementById('side-menu');
    
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            audioSystem.play('click');
        });
    }
    
    if (menuClose && sideMenu) {
        menuClose.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            audioSystem.play('click');
        });
    }
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (sideMenu && sideMenu.classList.contains('active')) {
            if (!e.target.closest('.side-menu') && !e.target.closest('.btn-menu')) {
                sideMenu.classList.remove('active');
            }
        }
    });
    
    // عناصر القائمة
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreen = item.getAttribute('data-target');
            if (targetScreen) {
                sideMenu.classList.remove('active');
                navigationSystem.navigateTo(targetScreen);
            }
        });
    });
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                // مسح بيانات الجلسة
                localStorage.clear();
                sessionStorage.clear();
                
                // إعادة تحميل الصفحة
                window.location.reload();
            }
        });
    }
    
    // الأزرار السفلية للتنقل
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreen = item.getAttribute('data-target');
            if (targetScreen) {
                navigationSystem.navigateTo(targetScreen);
            }
        });
    });
    
    // زر اللعب السريع
    const quickPlayBtn = document.getElementById('quick-play-btn');
    if (quickPlayBtn) {
        quickPlayBtn.addEventListener('click', () => {
            startQuickPlay();
        });
    }
    
    // زر العودة من المستويات
    const backFromLevelsBtn = document.getElementById('back-from-levels-btn');
    if (backFromLevelsBtn) {
        backFromLevelsBtn.addEventListener('click', () => {
            navigationSystem.goBack();
        });
    }
    
    // زر العودة من اللعبة
    const backFromGameBtn = document.getElementById('back-from-game-btn');
    if (backFromGameBtn) {
        backFromGameBtn.addEventListener('click', () => {
            // تأكيد الخروج
            if (confirm('هل تريد الخروج من المستوى الحالي؟')) {
                navigationSystem.goBack();
            }
        });
    }
    
    // زر إعادة المحاولة
    const restartLevelBtn = document.getElementById('restart-level-btn');
    if (restartLevelBtn) {
        restartLevelBtn.addEventListener('click', () => {
            if (confirm('هل تريد إعادة تشغيل المستوى؟')) {
                audioSystem.play('click');
                startLevel(currentLevel);
            }
        });
    }
    
    // زر تخطي المستوى
    const skipLevelBtn = document.getElementById('skip-level-btn');
    if (skipLevelBtn) {
        skipLevelBtn.addEventListener('click', () => {
            if (confirm('هل تريد تخطي هذا المستوى؟ (سيتم خصم 50 نقطة)')) {
                if (totalPoints >= 50) {
                    totalPoints -= 50;
                    updatePointsInDatabase();
                    
                    // الانتقال للمستوى التالي
                    const nextLevel = levelsData.find(l => l.id === currentLevel + 1);
                    if (nextLevel) {
                        startLevel(nextLevel.id);
                    } else {
                        navigationSystem.goBack();
                    }
                } else {
                    notificationSystem.show('نقاط غير كافية', 'تحتاج 50 نقطة لتخطي المستوى', 'warning');
                }
            }
        });
    }
    
    // زر المستوى التالي
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            const nextLevel = levelsData.find(l => l.id === currentLevel + 1);
            if (nextLevel) {
                startLevel(nextLevel.id);
            } else {
                notificationSystem.show('تهانينا!', 'لقد أتممت جميع مستويات هذه المرحلة', 'success');
                navigationSystem.goBack();
            }
        });
    }
    
    // التلميحات
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.addEventListener('click', useHint);
    }
    
    // أنواع التلميحات
    document.querySelectorAll('.hint-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const hintType = this.dataset.hint;
            useSpecificHint(hintType);
        });
    });
    
    // الأنماط التبويبية
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const mode = this.dataset.mode;
            changeGameMode(mode);
        });
    });
    
    // المرشد
    const mascot = document.getElementById('mascot');
    const mascotClose = document.getElementById('mascot-close');
    
    if (mascot) {
        mascot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mascotSystem) mascotSystem.showMessage();
        });
    }
    
    if (mascotClose) {
        mascotClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mascotSystem) mascotSystem.hideMessage();
        });
    }
    
    // إغلاق حوار المرشد عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (mascotSystem) {
            if (!e.target.closest('.mascot') && !e.target.closest('.mascot-dialog')) {
                mascotSystem.hideMessage();
            }
        }
    });
    
    // أدوات اللعبة
    const pauseBtn = document.getElementById('pause-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const vibrationToggle = document.getElementById('vibration-toggle');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }
    
    if (vibrationToggle) {
        vibrationToggle.addEventListener('click', toggleVibration);
    }
    
    if (fullscreenToggle) {
        fullscreenToggle.addEventListener('click', toggleFullscreen);
    }
    
    // منع التكبير/التصغير على أجهزة Android
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // منع النقر المزدوج للتكبير
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // التعامل مع زر العودة في Android
    document.addEventListener('backbutton', () => {
        navigationSystem.goBack();
    }, false);
    
    // تحديث حجم الشاشة عند تغيير التوجه
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
}

function startQuickPlay() {
    // البحث عن مستوى متاح عشوائي
    const availableLevels = levelsData.filter(level => {
        return totalPoints >= level.requiredPoints;
    });
    
    if (availableLevels.length > 0) {
        const randomLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];
        startLevel(randomLevel.id);
    } else {
        notificationSystem.show('لا توجد مستويات متاحة', 'اكسب المزيد من النقاط لفتح المستويات', 'warning');
    }
}

function useHint() {
    if (totalPoints < hintCost) {
        notificationSystem.show('نقاط غير كافية', `تحتاج ${hintCost} نقاط لاستخدام التلميح`, 'warning');
        return;
    }
    
    if (!selectedCard) {
        notificationSystem.show('اختر بطاقة', 'اختر بطاقة لغز أولاً', 'info');
        return;
    }
    
    totalPoints -= hintCost;
    updatePointsInDatabase();
    
    const hintText = document.getElementById('hint-text');
    if (hintText) {
        hintText.style.display = 'block';
        hintText.innerHTML = `
            <strong>تلميح:</strong>
            <p>البطاقة الصحيحة هي إحدى البطاقات الثلاث المتاحة. حاول التركيز على التفاصيل!</p>
        `;
    }
    
    audioSystem.play('hint');
    vibrationSystem.vibrate(100);
    
    notificationSystem.show('تم استخدام تلميح', `تم خصم ${hintCost} نقاط`, 'info');
    
    if (mascotSystem) {
        mascotSystem.showEventMessage('hint_used');
    }
}

function useSpecificHint(hintType) {
    const costs = {
        'reveal-one': 15,
        'shuffle': 10,
        'extra-time': 20
    };
    
    const cost = costs[hintType] || 10;
    
    if (totalPoints < cost) {
        notificationSystem.show('نقاط غير كافية', `تحتاج ${cost} نقاط لاستخدام هذا التلميح`, 'warning');
        return;
    }
    
    switch(hintType) {
        case 'reveal-one':
            revealOneCard();
            break;
        case 'shuffle':
            shufflePlayerCards();
            break;
        case 'extra-time':
            addExtraTime();
            break;
    }
    
    totalPoints -= cost;
    updatePointsInDatabase();
    audioSystem.play('hint');
}

function revealOneCard() {
    const playerCards = document.querySelectorAll('.player-card');
    if (playerCards.length > 0) {
        const randomCard = playerCards[Math.floor(Math.random() * playerCards.length)];
        
        // تأثير إظهار البطاقة
        gsap.to(randomCard, {
            scale: 1.2,
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
        
        notificationSystem.show('تم كشف بطاقة', 'تم تسليط الضوء على إحدى البطاقات', 'info');
    }
}

function shufflePlayerCards() {
    const playerCardsContainer = document.getElementById('player-cards');
    if (!playerCardsContainer) return;
    
    const cards = Array.from(playerCardsContainer.children);
    shuffleArray(cards);
    
    cards.forEach((card, index) => {
        gsap.to(card, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.5,
            delay: index * 0.1,
            ease: "back.out(1.7)"
        });
        playerCardsContainer.appendChild(card);
    });
    
    notificationSystem.show('تم خلط البطاقات', 'تم إعادة ترتيب بطاقات الحل', 'info');
}

function addExtraTime() {
    if (gameMode === "timed" && gameTimer) {
        timeLeft += 30;
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = timeLeft;
        }
        notificationSystem.show('تم إضافة وقت', '+30 ثانية إضافية', 'success');
    } else {
        notificationSystem.show('غير متاح', 'هذا التلميح متاح فقط في وضع الوقت المحدد', 'warning');
    }
}

function changeGameMode(mode) {
    gameMode = mode;
    
    // تحديث التبويبات النشطة
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    const activeTab = document.querySelector(`.mode-tab[data-mode="${mode}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
    
    // تحديث محتويات التبويب
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        panel.hidden = true;
    });
    
    const activePanel = document.getElementById(`${mode}-levels`) || 
                       document.getElementById(`${mode}-challenges`) || 
                       document.getElementById(`${mode}-modes`);
    
    if (activePanel) {
        activePanel.hidden = false;
    }
    
    // تحميل المحتوى المناسب
    switch(mode) {
        case "normal":
            loadLevels(currentStage);
            break;
        case "daily":
            loadDailyChallenges();
            break;
        case "timed":
            loadTimedChallenges();
            break;
        case "multiplayer":
            loadMultiplayerModes();
            break;
    }
    
    audioSystem.play('click');
}

function togglePause() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (!pauseOverlay) return;
    
    if (pauseOverlay.classList.contains('active')) {
        // استئناف اللعبة
        pauseOverlay.classList.remove('active');
        audioSystem.resumeBackgroundMusic();
        
        if (gameMode === "timed" && gameTimer) {
            startGameTimer();
        }
    } else {
        // إيقاف اللعبة
        pauseOverlay.classList.add('active');
        audioSystem.pauseBackgroundMusic();
        
        if (gameTimer) {
            clearInterval(gameTimer);
        }
    }
    
    audioSystem.play('click');
}

function toggleSound() {
    const isEnabled = audioSystem.toggleSound();
    const icon = document.querySelector('#sound-toggle i');
    
    if (icon) {
        icon.className = isEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
    
    notificationSystem.show(
        'الصوت',
        isEnabled ? 'تم تشغيل الصوت' : 'تم إيقاف الصوت',
        isEnabled ? 'success' : 'info'
    );
}

function toggleVibration() {
    const isEnabled = vibrationSystem.toggle();
    const icon = document.querySelector('#vibration-toggle i');
    
    if (icon) {
        icon.className = isEnabled ? 'fas fa-vibrate' : 'fas fa-bell-slash';
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    
    audioSystem.play('click');
}

function handleResize() {
    // إعادة حساب أحجام العناصر عند تغيير حجم الشاشة
    if (window.innerWidth < 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// منع سلوك الافتراضي للروابط
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href') === '#') {
        e.preventDefault();
    }
});

// تحسين الأداء على أجهزة Android
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

// إضافة فئة للجهاز
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.body.classList.add('mobile-device');
}

// التحقق من دعم PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // إظهار زر التثبيت
    const installBtn = document.getElementById('install-app');
    if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.addEventListener('click', async () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    audioSystem.play('success');
                } else {
                    console.log('User dismissed the install prompt');
                }
                window.deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });
    }
});
