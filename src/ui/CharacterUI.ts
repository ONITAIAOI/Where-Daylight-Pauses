import { PlayerProfile, savePlayerProfile } from '../firebase/playerData';

export class CharacterUI {
    private uid: string;
    private onComplete: (profile: PlayerProfile) => void;
    private overlayContainer: HTMLDivElement | null = null;

    // 預設代表色 state
    private selectedColor: string = '#ffb703';

    // 🎨 10 種質感代表色（搭配 5x2 網格排列）
    private avatarColors = [
        { color: '#ffb703', name: '琥珀金' },
        { color: '#ff758f', name: '櫻花粉' },
        { color: '#4cc9f0', name: '天晴藍' },
        { color: '#8ac926', name: '草木綠' },
        { color: '#9d4edd', name: '夢幻紫' },
        { color: '#f77f00', name: '珊瑚橘' },
        { color: '#4895ef', name: '湛藍海' },
        { color: '#52b788', name: '薄荷綠' },
        { color: '#d4a373', name: '暖奶茶' },
        { color: '#8d99ae', name: '石墨灰' }
    ];

    constructor(uid: string, onComplete: (profile: PlayerProfile) => void) {
        this.uid = uid;
        this.onComplete = onComplete;

        this.injectGlobalStyles();
        this.render();
    }

    private injectGlobalStyles() {
        if (!document.getElementById('character-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'character-ui-styles';
            style.innerHTML = `
                @keyframes characterPopIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes toastSlideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
                .char-color-dot:hover {
                    transform: scale(1.15) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    private render() {
        this.remove();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'character-creation-overlay';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(11, 12, 16, 0.8); backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px; box-sizing: border-box;
        `;

        this.overlayContainer.innerHTML = `
            <!-- 右上角 Toast 提示容器 -->
            <div id="toast-container" style="
                position: fixed; top: 24px; right: 24px; z-index: 2000;
                display: flex; flex-direction: column; gap: 10px; pointer-events: none;
            "></div>

            <div style="
                background: rgba(22, 27, 34, 0.85);
                border: 1px solid rgba(255, 183, 3, 0.25);
                border-radius: 28px; padding: 36px 32px; width: 100%; max-width: 440px;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                color: #f0f6fc; text-align: center;
                animation: characterPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            ">
                <!-- 預覽大頭像 -->
                <div id="char-avatar-preview" style="
                    font-size: 48px; width: 84px; height: 84px; margin: 0 auto 18px auto;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.05); border: 2px solid ${this.selectedColor};
                    box-shadow: 0 0 22px ${this.selectedColor}44; transition: all 0.3s ease;
                ">☀️</div>

                <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #fff;">創建旅人名片</h2>
                <p style="margin: 0 0 28px 0; font-size: 13px; color: #8b949e;">歡迎停靠小鎮，請設定你的專屬個人名片。</p>

                <div style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
                    <!-- 暱稱輸入 -->
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 8px;">
                            旅人暱稱 <span style="color: #ff4d4f;">*</span>
                        </label>
                        <input id="char-input-nickname" type="text" placeholder="請輸入你的暱稱..." style="
                            width: 100%; padding: 12px 16px; border-radius: 12px;
                            background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.12);
                            color: #fff; font-size: 14px; outline: none; box-sizing: border-box;
                            transition: border-color 0.2s;
                        " />
                    </div>

                    <!-- 光暈主題色選擇 (改用 CSS Grid 固定為完美的 5x2 網格排列) -->
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 12px;">專屬代表色</label>
                        <div style="
                            display: grid; 
                            grid-template-columns: repeat(5, 1fr); 
                            gap: 12px; 
                            justify-items: center; 
                            align-items: center; 
                            padding: 4px 0;
                        ">
                            ${this.avatarColors.map(item => `
                                <div class="char-color-dot" data-color="${item.color}" title="${item.name}" style="
                                    width: 34px; height: 34px; border-radius: 50%; background: ${item.color};
                                    cursor: pointer; transition: all 0.2s ease;
                                    border: ${item.color === this.selectedColor ? '2px solid #fff' : '2px solid transparent'};
                                    box-shadow: ${item.color === this.selectedColor ? `0 0 12px ${item.color}` : 'none'};
                                    transform: ${item.color === this.selectedColor ? 'scale(1.15)' : 'scale(1)'};
                                "></div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 確認建立按鈕 -->
                <button id="char-btn-submit" style="
                    width: 100%; margin-top: 32px; padding: 14px;
                    background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%);
                    border: none; border-radius: 12px; color: #0d1117;
                    font-size: 15px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 6px 20px rgba(255, 183, 3, 0.35); transition: all 0.2s;
                ">開啟停靠之旅 ➔</button>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        const nicknameInput = document.getElementById('char-input-nickname') as HTMLInputElement;

        // 輸入框 Focus 邊框高亮
        if (nicknameInput) {
            nicknameInput.onfocus = () => { nicknameInput.style.borderColor = '#ffb703'; };
            nicknameInput.onblur = () => { nicknameInput.style.borderColor = 'rgba(255, 255, 255, 0.12)'; };
        }

        // 點擊顏色選擇：僅動態更新 DOM 與大頭像光暈，不全頁重新渲染
        document.querySelectorAll('.char-color-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                this.selectedColor = target.getAttribute('data-color') || '#ffb703';

                // 更新顏色點點高亮
                document.querySelectorAll('.char-color-dot').forEach(d => {
                    const el = d as HTMLElement;
                    const c = el.getAttribute('data-color');
                    const isSelected = c === this.selectedColor;
                    el.style.border = isSelected ? '2px solid #fff' : '2px solid transparent';
                    el.style.boxShadow = isSelected ? `0 0 12px ${c}` : 'none';
                    el.style.transform = isSelected ? 'scale(1.15)' : 'scale(1)';
                });

                // 即時更新頭像外框與光暈
                const avatar = document.getElementById('char-avatar-preview');
                if (avatar) {
                    avatar.style.borderColor = this.selectedColor;
                    avatar.style.boxShadow = `0 0 22px ${this.selectedColor}44`;
                }
            });
        });

        // 提交按鈕
        const submitBtn = document.getElementById('char-btn-submit') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.onclick = async () => {
                const nickname = nicknameInput.value.trim();

                // 驗證：若暱稱未填寫，觸發 Toast 提示與紅框警告
                if (!nickname) {
                    nicknameInput.style.borderColor = '#ff4d4f';
                    nicknameInput.focus();
                    this.showToast('⚠️ 請先輸入你的旅人暱稱，才能開啟旅程喔！');
                    return;
                }

                // 鎖定按鈕防止重複點擊
                submitBtn.disabled = true;
                submitBtn.innerText = '正在建立名片...';
                submitBtn.style.opacity = '0.7';

                const profile: PlayerProfile = {
                    nickname: nickname,
                    avatarColor: this.selectedColor,
                    mood: '平安沉靜',
                    item: '暖心熱茶',
                    sunCoins: 100,         // ☀️ 初始暖陽幣
                    memorialTokens: 10,     // 🌟 初始紀念章
                    createdAt: new Date().toISOString()
                };

                try {
                    // 儲存至 Firebase
                    await savePlayerProfile(this.uid, profile);

                    // 關閉創角介面並進入遊戲
                    this.remove();
                    this.onComplete(profile);
                } catch (error) {
                    console.error('儲存旅人資料失敗:', error);
                    this.showToast('❌ 儲存資料時發生錯誤，請稍後再試');
                    submitBtn.disabled = false;
                    submitBtn.innerText = '開啟停靠之旅 ➔';
                    submitBtn.style.opacity = '1';
                }
            };
        }
    }

    // 右上角滑出 Toast 提示
    private showToast(message: string) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.style.cssText = `
            pointer-events: auto;
            background: rgba(22, 27, 34, 0.95);
            border: 1px solid rgba(255, 183, 3, 0.4);
            border-left: 4px solid #ffb703;
            border-radius: 12px;
            padding: 12px 18px;
            color: #f0f6fc;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            display: flex; align-items: center; gap: 8px;
        `;
        toast.innerHTML = `<span>${message}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2800);
    }

    private remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}