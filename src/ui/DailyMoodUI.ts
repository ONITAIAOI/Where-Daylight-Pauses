import { PlayerProfile, savePlayerProfile } from '../firebase/playerData';

export class DailyMoodUI {
    private uid: string;
    private profile: PlayerProfile;
    private onComplete: (mood: string, item: string) => void;
    private overlayContainer: HTMLDivElement | null = null;

    private selectedMood: string = '平安沉靜';
    private selectedItem: string = '暖心熱茶';

    private readonly moodOptions = [
        { name: '平安沉靜', desc: '心如止水，享受小鎮微風慢步調。', icon: '🍵' },
        { name: '些許疲憊', desc: '今天有點累了，找個角落休息。', icon: '🌙' },
        { name: '期待探險', desc: '充滿好奇心，發掘隱藏角落。', icon: '🧭' },
        { name: '悠閒隨性', desc: '沒有目的地，隨處停留。', icon: '🍃' }
    ];

    // ✅ 加入 usage 欄位，讓玩家知道道具用途
    private readonly itemOptions = [
        { 
            id: 'item_51', 
            name: '暖心熱茶', 
            desc: '驅散寒意，帶來溫暖療癒感。',
            usage: '☀️ 恢復 15 點旅人能量 · 🛡️ 提升 3 點心靈韌性'
        },
        { 
            id: 'item_52', 
            name: '舊相機', 
            desc: '捕捉沿途光影與美好瞬間。',
            usage: '👁️ 提升 5 點感知力（裝備後生效）'
        },
        { 
            id: 'item_53', 
            name: '旅行日記', 
            desc: '記錄靈感與心情點滴。',
            usage: '👁️ 提升 3 點感知力 · 🛡️ 提升 2 點心靈韌性'
        },
        { 
            id: 'item_54', 
            name: '懷錶', 
            desc: '提醒自己放慢腳步享受當下。',
            usage: '🗝️ 持有即可進入「迷霧森林」探索（每週三、六、日開放）· 每次進入消耗 1 枚'
        }
    ];

    constructor(uid: string, profile: PlayerProfile, onComplete: (mood: string, item: string) => void) {
        this.uid = uid;
        this.profile = profile;
        this.onComplete = onComplete;

        this.injectGlobalStyles();
        this.render();
    }

    private getTimeGreeting(): { greeting: string; icon: string } {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return { greeting: '早安', icon: '🌅' };
        if (hour >= 11 && hour < 14) return { greeting: '午安', icon: '☀️' };
        if (hour >= 14 && hour < 18) return { greeting: '下午好', icon: '☕' };
        if (hour >= 18 && hour < 23) return { greeting: '晚安', icon: '🌙' };
        return { greeting: '夜深了', icon: '✨' };
    }

    private injectGlobalStyles() {
        if (document.getElementById('daily-mood-styles')) return;
        const style = document.createElement('style');
        style.id = 'daily-mood-styles';
        style.innerHTML = `
            @keyframes modalPopIn {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
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
                transform: translateY(-1px);
            }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .item-usage {
                font-size: 9px;
                color: #8b949e;
                margin-top: 2px;
                letter-spacing: 0.2px;
                opacity: 0.8;
            }

            @media (max-width: 480px) {
                .mood-modal-container {
                    padding: 24px 18px !important;
                    border-radius: 20px !important;
                    max-height: 94dvh !important;
                }
                .mood-grid {
                    gap: 8px !important;
                }
                .mood-card {
                    padding: 10px 10px !important;
                }
                .item-card {
                    padding: 8px 12px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private render() {
        this.remove();
        const timeInfo = this.getTimeGreeting();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(11, 12, 16, 0.85); backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
        `;

        this.overlayContainer.innerHTML = `
            <div id="toast-container" style="position: fixed; top: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;"></div>
            <div class="no-scrollbar mood-modal-container" style="
                background: rgba(22, 27, 34, 0.92);
                border: 1px solid rgba(255, 183, 3, 0.25);
                border-radius: 24px;
                padding: 28px 24px;
                width: 100%;
                max-width: 480px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                color: #f0f6fc;
                text-align: center;
                animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
                max-height: 90dvh;
                overflow-y: auto;
            ">
                <div style="
                    width: 48px; height: 48px; margin: 0 auto 10px auto; border-radius: 50%;
                    background: ${this.profile.avatarColor}22; border: 2px solid ${this.profile.avatarColor};
                    display: flex; align-items: center; justify-content: center; font-size: 22px;
                    box-shadow: 0 0 14px ${this.profile.avatarColor}44;
                ">${timeInfo.icon}</div>

                <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #fff;">${timeInfo.greeting}，${this.profile.nickname}</h2>
                <p style="margin: 0 0 18px 0; font-size: 12px; color: #8b949e;">今天的小鎮時光正要開始，告訴我們你現在的心情與隨身信物吧！</p>

                <div style="text-align: left; display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 11px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 6px;">🌤️ 今日心境</label>
                        <div class="mood-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            ${this.moodOptions.map(m => {
                                const isSel = m.name === this.selectedMood;
                                return `
                                    <div class="mood-card" data-mood="${m.name}" style="
                                        padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease;
                                        background: ${isSel ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)'};
                                        border: 1px solid ${isSel ? '#ffb703' : 'rgba(255,255,255,0.08)'};
                                        box-shadow: ${isSel ? '0 0 10px rgba(255, 183, 3, 0.2)' : 'none'};
                                    ">
                                        <div style="font-size: 16px; margin-bottom: 2px;">${m.icon}</div>
                                        <div style="font-size: 12px; font-weight: ${isSel ? '700' : '600'}; color: ${isSel ? '#ffb703' : '#fff'};">${m.name}</div>
                                        <div style="font-size: 10px; color: #8b949e; margin-top: 2px; line-height: 1.2;">${m.desc}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 11px; font-weight: 600; color: #8b949e; display: block; margin-bottom: 6px;">🎒 今日隨身信物</label>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${this.itemOptions.map(item => {
                                const isSel = item.name === this.selectedItem;
                                return `
                                    <div class="item-card" data-item="${item.name}" style="
                                        padding: 8px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s ease;
                                        background: ${isSel ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)'};
                                        border: 1px solid ${isSel ? '#ffb703' : 'rgba(255,255,255,0.08)'};
                                    ">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-size: 12px; font-weight: ${isSel ? '700' : '500'}; color: ${isSel ? '#ffb703' : '#c9d1d9'};">${item.name}</span>
                                            <span style="font-size: 10px; color: #8b949e;">${item.desc}</span>
                                        </div>
                                        ${item.usage ? `
                                            <div class="item-usage" style="
                                                font-size: 9px; color: #8b949e; margin-top: 2px; 
                                                padding-top: 2px; border-top: 1px solid rgba(255,255,255,0.04);
                                                opacity: ${isSel ? '1' : '0.6'};
                                            ">${item.usage}</div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <button id="mood-btn-submit" style="
                    width: 100%; margin-top: 20px; padding: 12px;
                    background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%);
                    border: none; border-radius: 12px; color: #0d1117;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 6px 16px rgba(255, 183, 3, 0.35); transition: all 0.2s;
                ">開啟今日小鎮時光 ➔</button>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        const updateCardStyles = (selector: string, attr: string, currentVal: string) => {
            document.querySelectorAll(selector).forEach(c => {
                const el = c as HTMLElement;
                const isSel = el.getAttribute(attr) === currentVal;
                el.style.background = isSel ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255,255,255,0.03)';
                el.style.border = isSel ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.08)';
                el.style.boxShadow = selector === '.mood-card' ? (isSel ? '0 0 10px rgba(255, 183, 3, 0.2)' : 'none') : 'none';
                
                const titleEl = selector === '.mood-card' 
                    ? el.querySelector('div:nth-child(2)') as HTMLElement
                    : el.querySelector('span:first-child') as HTMLElement;
                
                if (titleEl) {
                    titleEl.style.fontWeight = isSel ? '700' : (selector === '.mood-card' ? '600' : '500');
                    titleEl.style.color = isSel ? '#ffb703' : (selector === '.mood-card' ? '#fff' : '#c9d1d9');
                }

                const usageEl = el.querySelector('.item-usage') as HTMLElement;
                if (usageEl) {
                    usageEl.style.opacity = isSel ? '1' : '0.6';
                }
            });
        };

        document.querySelectorAll('.mood-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectedMood = (e.currentTarget as HTMLElement).getAttribute('data-mood') || '平安沉靜';
                updateCardStyles('.mood-card', 'data-mood', this.selectedMood);
            });
        });

        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectedItem = (e.currentTarget as HTMLElement).getAttribute('data-item') || '暖心熱茶';
                updateCardStyles('.item-card', 'data-item', this.selectedItem);
            });
        });

        const submitBtn = document.getElementById('mood-btn-submit') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.onclick = async () => {
                submitBtn.disabled = true;
                submitBtn.innerText = '正在整理行囊...';
                submitBtn.style.opacity = '0.7';

                const todayStr = new Date().toISOString().split('T')[0];
                this.profile.mood = this.selectedMood;
                this.profile.item = this.selectedItem;
                this.profile.lastMoodDate = todayStr;

                try {
                    const selectedObj = this.itemOptions.find(i => i.name === this.selectedItem);
                    const targetId = selectedObj ? selectedObj.id : 'item_51';

                    if (!this.profile.inventory) this.profile.inventory = [];
                    const existingItem = this.profile.inventory.find((i: any) => i.id === targetId);
                    
                    if (existingItem) {
                        existingItem.count = (existingItem.count || 1) + 1;
                    } else {
                        this.profile.inventory.push({ id: targetId, count: 1 });
                    }

                    await savePlayerProfile(this.uid, this.profile);

                    const usageText = selectedObj?.usage ? `\n${selectedObj.usage}` : '';
                    this.showToast(`✨ 今日心境已記錄，並獲得了「${this.selectedItem}」！${usageText}`);
                    
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
            pointer-events: auto; background: rgba(22, 27, 34, 0.95);
            border: 1px solid rgba(255, 183, 3, 0.4); border-left: 4px solid #ffb703;
            border-radius: 12px; padding: 12px 18px; color: #f0f6fc; font-size: 13px;
            font-weight: 500; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px);
            animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            display: flex; align-items: center; gap: 8px;
            white-space: pre-line;
        `;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }

    private remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}