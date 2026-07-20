import { PlayerProfile, savePlayerProfile } from '../firebase/playerData';
import { addPlayerItem } from '../utils/inventoryUtils'; // 引入獲得道具工具

export class DailyMoodUI {
    private uid: string;
    private profile: PlayerProfile;
    private onComplete: (mood: string, item: string) => void;
    private overlayContainer: HTMLDivElement | null = null;

    // 預設選取狀態
    private selectedMood: string = '平安沉靜';
    private selectedItem: string = '暖心熱茶';

    // 每日心境選項與對應描述/Buff
    private moodOptions = [
        { name: '平安沉靜', desc: '心如止水，享受小鎮的微風與慢步調。', icon: '🍵' },
        { name: '些許疲憊', desc: '今天有點累了，適合找個安靜角落休息。', icon: '🌙' },
        { name: '期待探險', desc: '充滿好奇心，想發掘小鎮的隱藏角落。', icon: '🧭' },
        { name: '悠閒隨性', desc: '沒有目的地，走到哪裡就停在哪裡。', icon: '🍃' }
    ];

    // 每日隨身信物選項（並對應圖鑑中的正式 ID）
    private itemOptions = [
        { id: 'item_51', name: '暖心熱茶', desc: '驅散寒意，帶來溫暖的療癒感。' },
        { id: 'item_52', name: '舊相機', desc: '捕捉沿途的光影與美好瞬間。' },
        { id: 'item_53', name: '旅行日記', desc: '記錄今天的靈感與心情點滴。' },
        { id: 'item_54', name: '懷錶', desc: '提醒自己放慢腳步，享受當下。' }
    ];

    constructor(uid: string, profile: PlayerProfile, onComplete: (mood: string, item: string) => void) {
        this.uid = uid;
        this.profile = profile;
        this.onComplete = onComplete;

        this.injectGlobalStyles();
        this.render();
    }

    // 根據當前時間取得對應的動態招呼語與問候圖示
    private getTimeGreeting(): { greeting: string; icon: string } {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) {
            return { greeting: '早安', icon: '🌅' };
        } else if (hour >= 11 && hour < 14) {
            return { greeting: '午安', icon: '☀️' };
        } else if (hour >= 14 && hour < 18) {
            return { greeting: '下午好', icon: '☕' };
        } else if (hour >= 18 && hour < 23) {
            return { greeting: '晚安', icon: '🌙' };
        } else {
            return { greeting: '夜深了', icon: '✨' };
        }
    }

    private injectGlobalStyles() {
        if (!document.getElementById('daily-mood-styles')) {
            const style = document.createElement('style');
            style.id = 'daily-mood-styles';
            style.innerHTML = `
                @keyframes modalPopIn {
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
                .mood-card:hover, .item-card:hover {
                    border-color: rgba(255, 183, 3, 0.5) !important;
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }
    }

    private render() {
        this.remove();

        const timeInfo = this.getTimeGreeting();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'daily-mood-overlay';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(11, 12, 16, 0.85); backdrop-filter: blur(16px);
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
                background: rgba(22, 27, 34, 0.9);
                border: 1px solid rgba(255, 183, 3, 0.3);
                border-radius: 28px; padding: 36px 32px; width: 100%; max-width: 520px;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                color: #f0f6fc; text-align: center;
                animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box; max-height: 90vh; overflow-y: auto;
            ">
                <!-- 動態時間招呼語圓形圖示 -->
                <div style="
                    width: 56px; height: 56px; margin: 0 auto 12px auto; border-radius: 50%;
                    background: ${this.profile.avatarColor}22; border: 2px solid ${this.profile.avatarColor};
                    display: flex; align-items: center; justify-content: center; font-size: 24px;
                    box-shadow: 0 0 16px ${this.profile.avatarColor}44;
                ">${timeInfo.icon}</div>

                <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #fff;">${timeInfo.greeting}，${this.profile.nickname}</h2>
                <p style="margin: 0 0 24px 0; font-size: 13px; color: #8b949e;">今天的小鎮時光正要開始，告訴我們你現在的心情與隨身信物吧！</p>

                <div style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
                    <!-- 今日心境選擇 (網格卡片) -->
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 10px;">
                            🌤️ 今日心境
                        </label>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            ${this.moodOptions.map(m => `
                                <div class="mood-card" data-mood="${m.name}" style="
                                    padding: 12px 14px; border-radius: 14px; cursor: pointer; transition: all 0.2s ease;
                                    background: ${m.name === this.selectedMood ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)'};
                                    border: 1px solid ${m.name === this.selectedMood ? '#ffb703' : 'rgba(255,255,255,0.08)'};
                                    box-shadow: ${m.name === this.selectedMood ? '0 0 12px rgba(255, 183, 3, 0.2)' : 'none'};
                                ">
                                    <div style="font-size: 18px; margin-bottom: 4px;">${m.icon}</div>
                                    <div style="font-size: 13px; font-weight: ${m.name === this.selectedMood ? '700' : '600'}; color: ${m.name === this.selectedMood ? '#ffb703' : '#fff'};">${m.name}</div>
                                    <div style="font-size: 11px; color: #8b949e; margin-top: 2px; line-height: 1.3;">${m.desc}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 隨身信物選擇 (橫向清單) -->
                    <div>
                        <label style="font-size: 12px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 10px;">
                            🎒 今日隨身信物
                        </label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${this.itemOptions.map(item => `
                                <div class="item-card" data-item="${item.name}" style="
                                    padding: 10px 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease;
                                    background: ${item.name === this.selectedItem ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)'};
                                    border: 1px solid ${item.name === this.selectedItem ? '#ffb703' : 'rgba(255,255,255,0.08)'};
                                    display: flex; justify-content: space-between; align-items: center;
                                ">
                                    <span style="font-size: 13px; font-weight: ${item.name === this.selectedItem ? '700' : '500'}; color: ${item.name === this.selectedItem ? '#ffb703' : '#c9d1d9'};">${item.name}</span>
                                    <span style="font-size: 11px; color: #8b949e;">${item.desc}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 確認出發按鈕 -->
                <button id="mood-btn-submit" style="
                    width: 100%; margin-top: 28px; padding: 14px;
                    background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%);
                    border: none; border-radius: 12px; color: #0d1117;
                    font-size: 15px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 6px 20px rgba(255, 183, 3, 0.35); transition: all 0.2s;
                ">開啟今日小鎮時光 ➔</button>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        // 點擊心境卡片切換
        document.querySelectorAll('.mood-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                this.selectedMood = target.getAttribute('data-mood') || '平安沉靜';

                document.querySelectorAll('.mood-card').forEach(c => {
                    const el = c as HTMLElement;
                    const name = el.getAttribute('data-mood');
                    const isSelected = name === this.selectedMood;
                    el.style.background = isSelected ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)';
                    el.style.border = isSelected ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.08)';
                    el.style.boxShadow = isSelected ? '0 0 12px rgba(255, 183, 3, 0.2)' : 'none';
                    const titleEl = el.querySelector('div:nth-child(2)') as HTMLElement;
                    if (titleEl) {
                        titleEl.style.fontWeight = isSelected ? '700' : '600';
                        titleEl.style.color = isSelected ? '#ffb703' : '#fff';
                    }
                });
            });
        });

        // 點擊信物卡片切換
        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                this.selectedItem = target.getAttribute('data-item') || '暖心熱茶';

                document.querySelectorAll('.item-card').forEach(c => {
                    const el = c as HTMLElement;
                    const name = el.getAttribute('data-item');
                    const isSelected = name === this.selectedItem;
                    el.style.background = isSelected ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)';
                    el.style.border = isSelected ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.08)';
                    const titleEl = el.querySelector('span:first-child') as HTMLElement;
                    if (titleEl) {
                        titleEl.style.fontWeight = isSelected ? '700' : '500';
                        titleEl.style.color = isSelected ? '#ffb703' : '#c9d1d9';
                    }
                });
            });
        });

        // 提交按鈕
        const submitBtn = document.getElementById('mood-btn-submit') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.onclick = async () => {
                submitBtn.disabled = true;
                submitBtn.innerText = '正在整理行囊...';
                submitBtn.style.opacity = '0.7';

                // 取得今天的日期字串 (YYYY-MM-DD) 作為今日已簽到的憑證
                const todayStr = new Date().toISOString().split('T')[0];

                this.profile.mood = this.selectedMood;
                this.profile.item = this.selectedItem;
                this.profile.lastMoodDate = todayStr; // 寫入今日簽到日期

                try {
                    // 1. 儲存玩家個人檔案
                    await savePlayerProfile(this.uid, this.profile);

                    // 2. 找到選擇的信物所對應的圖鑑 ID 並發放到背包中
                    const selectedObj = this.itemOptions.find(i => i.name === this.selectedItem);
                    if (selectedObj) {
                        await addPlayerItem(this.uid, selectedObj.id, 1);
                    }

                    this.showToast(`✨ 今日心境已記錄，並獲得了 ${this.selectedItem}！`);
                    setTimeout(() => {
                        this.remove();
                        this.onComplete(this.selectedMood, this.selectedItem);
                    }, 600);
                } catch (error) {
                    console.error('儲存今日心境或發放道具失敗:', error);
                    this.showToast('❌ 儲存失敗，請稍後再試');
                    submitBtn.disabled = false;
                    submitBtn.innerText = '開啟今日小鎮時光 ➔';
                    submitBtn.style.opacity = '1';
                }
            };
        }
    }

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
        }, 2200);
    }

    private remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}