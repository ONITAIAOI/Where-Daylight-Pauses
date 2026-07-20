export class NpcDialogUI {
    private nickname: string;
    private mood: string;
    private item: string;

    private overlay: HTMLDivElement | null = null;
    private activeTab: 'home' | 'weather' | 'quest' | 'item' = 'home';
    private currentChatQuote: string = '';

    private randomQuotes: string[] = [
        "微風吹過月台的時候，總覺得能帶走一些累積在心裡的沉重呢。",
        "你知道嗎？日光停靠站的長椅，隨時都為覺得累了的人留著位置。",
        "今天的茶倒得剛剛好，要不要坐下來喝一口再走？",
        "有時候什麼都不做，只是看著雲慢慢飄過去，也是很棒的休憩。",
        "生活就像火車班次，偶爾也會有誤點的時候，不用太過焦慮哦。",
        "能在這裡遇見你，也是今天這座小鎮很幸運的事呢。",
        "如果覺得前面有點黑，就先看著腳邊這盞小燈吧。",
        "今天路上有看到可愛的花朵嗎？小鎮後山的野花開得很好看呢。",
        "深呼吸一口氣——感受一下，空氣裡有淡淡的光芒氣味喔。",
        "不論你剛剛經歷了什麼，到了這裡，你就可以卸下防備了。"
    ];

    private quests = [
        { id: 1, title: '在月台長椅上靜坐 10 秒', reward: '日光章 x1', completed: false },
        { id: 2, title: '向站長晨曦問聲好', reward: '日光章 x1', completed: true },
        { id: 3, title: '在鎮上撿拾 1 個舊物碎片', reward: '日光章 x2', completed: false }
    ];

    constructor(nickname: string, mood: string, item: string) {
        this.nickname = nickname;
        this.mood = mood;
        this.item = item;

        this.injectGlobalStyles();
        this.getRandomQuote();
        this.showDialog();
    }

    private getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.randomQuotes.length);
        this.currentChatQuote = this.randomQuotes[randomIndex];
    }

    // 🌟 動態注入視窗動畫 CSS
    private injectGlobalStyles() {
        if (!document.getElementById('npc-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'npc-dialog-styles';
            style.innerHTML = `
                @keyframes modalPopIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .npc-dialog-btn:hover {
                    filter: brightness(1.15);
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);
        }
    }

    public showDialog() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.renderContent();
            return;
        }

        // 🌟 創建全螢幕半透明背景遮罩
        this.overlay = document.createElement('div');
        this.overlay.id = 'npc-dialog-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(11, 12, 16, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 20px;
            box-sizing: border-box;
        `;

        document.body.appendChild(this.overlay);
        this.renderContent();
    }

    private renderContent() {
        if (!this.overlay) return;

        const weather = this.getTodayWeather();

        // 🌟 核心對話框卡片
        this.overlay.innerHTML = `
            <div style="
                background: rgba(22, 27, 34, 0.85);
                border: 1px solid rgba(255, 183, 3, 0.25);
                border-radius: 28px;
                padding: 32px 28px 28px 28px;
                width: 100%;
                max-width: 480px;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                position: relative;
                color: #f0f6fc;
                animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            ">
                <!-- 右上角關閉按鈕 -->
                <button id="npc-close-btn" class="npc-dialog-btn" style="
                    position: absolute; top: 20px; right: 20px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 50%; width: 34px; height: 34px;
                    color: #8b949e; font-size: 16px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease;
                ">✕</button>

                <!-- 站長 晨曦 抬頭列 -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 18px;">
                    <div style="
                        width: 56px; height: 56px; border-radius: 50%;
                        background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%);
                        display: flex; justify-content: center; align-items: center; font-size: 28px;
                        box-shadow: 0 6px 20px rgba(255,183,3,0.35);
                        flex-shrink: 0;
                    ">☕</div>
                    <div>
                        <div style="font-weight: 700; font-size: 19px; color: #ffb703; letter-spacing: 0.3px;">站長 晨曦</div>
                        <div style="font-size: 13px; color: #8b949e; margin-top: 2px;">日光停靠站 ｜ 長椅上的傾聽者</div>
                    </div>
                </div>

                <!-- 動態頁籤內容 -->
                <div id="npc-body-content" style="min-height: 180px; font-size: 14px; line-height: 1.6;">
                    ${this.getTabHtml(weather)}
                </div>

                <!-- 底部頁籤選單 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
                    <button id="btn-weather" class="npc-dialog-btn" style="${this.getBtnStyle(this.activeTab === 'weather')}">☀️ 今日氣象</button>
                    <button id="btn-quest" class="npc-dialog-btn" style="${this.getBtnStyle(this.activeTab === 'quest')}">📜 停靠告示</button>
                    <button id="btn-item" class="npc-dialog-btn" style="${this.getBtnStyle(this.activeTab === 'item')}">🧳 鑑賞信物</button>
                    <button id="btn-home" class="npc-dialog-btn" style="${this.getBtnStyle(this.activeTab === 'home')}">💬 站長小語</button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    private getTabHtml(weather: { icon: string; name: string; desc: string; buff: string }) {
        switch (this.activeTab) {
            case 'weather':
                return `
                    <div style="background: rgba(255, 183, 3, 0.06); padding: 18px; border-radius: 16px; border: 1px solid rgba(255, 183, 3, 0.2);">
                        <div style="font-size: 17px; font-weight: 700; color: #ffb703; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                            <span>${weather.icon}</span> ${weather.name}
                        </div>
                        <div style="color: #c9d1d9; margin-bottom: 12px; font-size: 13px;">${weather.desc}</div>
                        <div style="background: rgba(0,0,0,0.3); padding: 12px 14px; border-radius: 10px; border-left: 3px solid #ffb703;">
                            <span style="color: #ffb703; font-weight: 600; font-size: 12px;">✨ 今日停靠加成：</span><br>
                            <span style="color: #fff; font-size: 13px;">${weather.buff}</span>
                        </div>
                    </div>
                `;
            case 'quest':
                return `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="font-weight: 700; color: #ffb703; font-size: 14px;">📜 今日的小站告示板</div>
                        ${this.quests.map((q) => `
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 12px 14px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="color: ${q.completed ? '#6e7681' : '#f0f6fc'}; text-decoration: ${q.completed ? 'line-through' : 'none'}; font-size: 13px;">${q.title}</div>
                                    <div style="font-size: 11px; color: #ffb703; margin-top: 2px;">獎勵: ${q.reward}</div>
                                </div>
                                <button class="quest-claim-btn npc-dialog-btn" data-id="${q.id}" ${q.completed ? 'disabled' : ''} style="
                                    padding: 6px 14px; font-size: 12px; font-weight: 600; border-radius: 8px; border: none;
                                    background: ${q.completed ? 'rgba(255,255,255,0.08)' : '#ffb703'};
                                    color: ${q.completed ? '#6e7681' : '#0d1117'};
                                    cursor: ${q.completed ? 'default' : 'pointer'};
                                    transition: all 0.2s;
                                ">
                                    ${q.completed ? '已完成' : '領取'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 'item':
                return `
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 18px; border-radius: 16px;">
                        <div style="font-weight: 700; color: #ffb703; margin-bottom: 8px; font-size: 15px;">🧳 旅人信物鑑賞</div>
                        <div style="font-size: 14px; color: #f0f6fc;">「你隨身帶著 <span style="color: #ffb703; font-weight: 700;">${this.item}</span> 對吧？」</div>
                        <div style="margin-top: 10px; color: #8b949e; font-style: italic; font-size: 13px; line-height: 1.6;">
                            晨曦仔細看著你的 ${this.item}，溫柔地笑了笑：「這上面留著時間的味道呢... 在日光停靠站，帶著它能讓你獲得專屬稱號『${this.item}的持有者』。」
                        </div>
                    </div>
                `;
            case 'home':
            default:
                return `
                    <div style="background: rgba(255, 183, 3, 0.08); padding: 12px 16px; border-radius: 12px; border-left: 3px solid #ffb703; margin-bottom: 14px; font-size: 13px; color: #c9d1d9;">
                        歡迎回到日光停靠站，<span style="color: #ffb703; font-weight: 700;">${this.nickname}</span>。今天的心情是「${this.mood}」對吧？
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.03); padding: 18px; border-radius: 14px; border: 1px dashed rgba(255, 183, 3, 0.25);">
                        <div style="color: #f0f6fc; font-size: 14px; line-height: 1.7;">
                            「${this.currentChatQuote}」
                        </div>
                        <div style="text-align: right; margin-top: 12px; font-size: 12px; color: #8b949e;">
                            —— 站長 晨曦
                        </div>
                    </div>
                `;
        }
    }

    private bindEvents() {
        // 點擊關閉按鈕
        const closeBtn = document.getElementById('npc-close-btn');
        if (closeBtn) closeBtn.onclick = () => this.hideDialog();

        // 點擊背景遮罩也可以關閉（增加流暢體驗）
        if (this.overlay) {
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) this.hideDialog();
            };
        }

        // 切換頁籤
        document.getElementById('btn-weather')!.onclick = () => { this.activeTab = 'weather'; this.renderContent(); };
        document.getElementById('btn-quest')!.onclick = () => { this.activeTab = 'quest'; this.renderContent(); };
        document.getElementById('btn-item')!.onclick = () => { this.activeTab = 'item'; this.renderContent(); };
        
        document.getElementById('btn-home')!.onclick = () => { 
            this.getRandomQuote();
            this.activeTab = 'home'; 
            this.renderContent(); 
        };

        // 任務領取按鈕
        document.querySelectorAll('.quest-claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
                const q = this.quests.find(item => item.id === id);
                if (q && !q.completed) {
                    q.completed = true;
                    this.renderContent();
                }
            });
        });
    }

    private getTodayWeather() {
        const date = new Date();
        const day = date.getDate();
        
        const weatherList = [
            { icon: '☀️', name: '金黃晴空', desc: '陽光灑滿月台，連微風都帶著微甜的烘焙香氣。', buff: '小鎮移動速度 +20%，探索獲得金幣翻倍' },
            { icon: '🌧️', name: '細雨潤物', desc: '雨點輕叩著屋檐，適合找個安靜的角落歇息。', buff: '長椅休息恢復體力速度 +50%' },
            { icon: '🌫️', name: '晨霧微光', desc: '薄霧籠罩著小鎮街道，隱隱約約能看見平時沒發現的角落。', buff: '尋獲「舊物碎片」與稀有信物機率上升' }
        ];

        return weatherList[day % weatherList.length];
    }

    private getBtnStyle(isActive: boolean) {
        return `
            padding: 12px; font-size: 13px; font-weight: 600; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s ease;
            background: ${isActive ? 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)' : 'rgba(255, 255, 255, 0.05)'};
            color: ${isActive ? '#0d1117' : '#c9d1d9'};
            box-shadow: ${isActive ? '0 4px 14px rgba(255,183,3,0.3)' : 'none'};
        `;
    }

    public hideDialog() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}