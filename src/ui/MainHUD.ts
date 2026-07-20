import { PlayerProfile } from '../firebase/playerData';
import { InventoryUI } from './InventoryUI';
import { ChatUI } from './ChatUI';
import { RestHouseUI } from './RestHouseUI';

export interface MainHUDOptions {
    onOpenTownMap: () => void;
    onOpenChat?: () => void;      
    onOpenDiary?: () => void;     
    onOpenSettings?: () => void;  
}

export class MainHUD {
    private profile: PlayerProfile;
    private authUid: string; // 🌟 接收並鎖定真實的 Firebase Auth UID
    private options: MainHUDOptions;
    private container: HTMLDivElement | null = null;
    private isToastActive: boolean = false;
    private inventoryUI: InventoryUI | null = null;
    private chatUI: ChatUI | null = null;
    private restHouseUI: RestHouseUI | null = null;

    constructor(profile: PlayerProfile, authUid: string, options: MainHUDOptions) {
        this.profile = profile;
        this.authUid = authUid;
        this.options = options;

        this.injectGlobalStyles();
        this.render();
    }

    private injectGlobalStyles() {
        if (!document.getElementById('main-hud-styles')) {
            const style = document.createElement('style');
            style.id = 'main-hud-styles';
            style.innerHTML = `
                @keyframes hudFadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes toastFadeInTop {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes toastFadeOutTop {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -15px); }
                }
                .station-card:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.06) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }
            `;
            document.head.appendChild(style);
        }
    }

    private showToast(message: string) {
        if (this.isToastActive) return; 
        this.isToastActive = true;

        const oldToast = document.getElementById('station-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.id = 'station-toast';
        toast.style.cssText = `
            position: fixed; top: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(28, 23, 20, 0.95);
            border: 1px solid rgba(234, 179, 8, 0.5);
            color: #f3f0ea; padding: 14px 26px; border-radius: 14px;
            font-size: 13px; font-weight: 500; letter-spacing: 0.5px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
            z-index: 9999; backdrop-filter: blur(8px);
            animation: toastFadeInTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            white-space: pre-line; text-align: center; line-height: 1.5;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOutTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => {
                toast.remove();
                this.isToastActive = false; 
            }, 300);
        }, 3500);
    }

    private render() {
        this.remove();

        this.container = document.createElement('div');
        this.container.id = 'main-hud-container';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #1f1a17 0%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 900; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px; box-sizing: border-box;
        `;

        this.container.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 24px; width: 100%; max-width: 500px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea; overflow: hidden;
                animation: hudFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box; display: flex; flex-direction: column;
                max-height: 92vh;
            ">
                <!-- 🌅 上方主視覺 Banner 區域 -->
                <div style="
                    position: relative; height: 200px;
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.2) 0%, rgba(28, 23, 20, 0.4) 50%, #1c1714 100%), 
                                url('./assets/images/main.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 20px 24px; box-sizing: border-box;
                    overflow: hidden;
                    border-top-left-radius: 24px;
                    border-top-right-radius: 24px;
                ">
                    <!-- 💰 上排：幣值顯示列 -->
                    <div style="display: flex; justify-content: flex-end; gap: 10px; z-index: 1;">
                        <div style="
                            background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 20px;
                            padding: 4px 12px; display: flex; align-items: center; gap: 6px;
                            font-size: 12px; font-weight: 600; color: #fde047;
                        ">
                            <span>☀️</span> <span>${(this.profile as any).sunCoins ?? 100}</span>
                        </div>
                        <div style="
                            background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                            border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 20px;
                            padding: 4px 12px; display: flex; align-items: center; gap: 6px;
                            font-size: 12px; font-weight: 600; color: #d8b4fe;
                        ">
                            <span>🌟</span> <span>${(this.profile as any).memorialTokens ?? 10}</span>
                        </div>
                    </div>

                    <!-- 下排：玩家稱號與今日心境 -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 1;">
                        <div>
                            <div style="font-size: 11px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                                WHERE DAYLIGHT PAUSES
                            </div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                ${this.profile.nickname}
                            </h1>
                        </div>
                        <div style="
                            background: rgba(28, 23, 20, 0.7); backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 10px;
                            padding: 6px 10px; text-align: right;
                        ">
                            <div style="font-size: 10px; color: #a89f91;">今日心境</div>
                            <div style="font-size: 12px; font-weight: 600; color: #eab308;">${(this.profile as any).mood || '平安沉靜'}</div>
                        </div>
                    </div>
                </div>

                <!-- ☕ 下方小鎮功能選單 -->
                <div style="padding: 20px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #1c1714;">
                    <div style="font-size: 12px; font-weight: 600; color: #a89f91; margin-bottom: -2px; letter-spacing: 0.5px;">
                        停靠站選單
                    </div>

                    <!-- 1. 探索小鎮地圖 -->
                    <div class="station-card" id="btn-town-map" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 13px 16px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="font-size: 13px; font-weight: 600; color: #eab308; background: rgba(234,179,8,0.1); width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🧭
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">探索小鎮地圖</div>
                                <div style="font-size: 12px; color: #a89f91;">漫步咖啡館、噴泉與巷弄，尋找日常事件</div>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #eab308; font-weight: 500;">前往 ➔</div>
                    </div>

                    <!-- 2. 鎮民廣場 -->
                    <div class="station-card" id="btn-chat" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 13px 16px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="font-size: 13px; font-weight: 600; color: #60a5fa; background: rgba(96,165,250,0.1); width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                💬
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">鎮民廣場</div>
                                <div style="font-size: 12px; color: #a89f91;">與其他在小鎮歇腳的旅人聊聊天</div>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #60a5fa; font-weight: 500;">入席 ➔</div>
                    </div>

                    <!-- 3. 旅人行囊 -->
                    <div class="station-card" id="btn-inventory" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 13px 16px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="font-size: 13px; font-weight: 600; color: #34d399; background: rgba(52,211,153,0.1); width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🎒
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">旅人行囊</div>
                                <div style="font-size: 12px; color: #a89f91;">查看隨身信物 (${(this.profile as any).item || '無'}) 與收集的紀念</div>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #34d399; font-weight: 500;">打開 ➔</div>
                    </div>

                    <!-- 4. 心境小屋 -->
                    <div class="station-card" id="btn-settings" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 13px 16px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="font-size: 13px; font-weight: 600; color: #c084fc; background: rgba(192,132,252,0.1); width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🍵
                            </div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">心境小屋</div>
                                <div style="font-size: 12px; color: #a89f91;">進入小屋深度休息，沉澱並累積暖陽幣</div>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #c084fc; font-weight: 500;">休憩 ➔</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }

    private bindEvents() {
        // 1. 探索小鎮地圖
        document.getElementById('btn-town-map')?.addEventListener('click', () => {
            const restingUntil = (this.profile as any)?.restingUntil ? new Date((this.profile as any).restingUntil).getTime() : 0;
            const now = Date.now();

            if (restingUntil > now) {
                const remaining = restingUntil - now;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                this.showToast(`💤 旅人正在心境小屋深度休息中...\n還需等待 ${hours}小時${minutes}分 進行小鎮探索喔！`);
                return;
            }

            if (restingUntil > 0 && restingUntil <= now) {
                this.showToast(`✨ 你的 8 小時休息已完成！\n請進入「心境小屋」領取 500 暖陽幣獎勵後再行探索。`);
                return;
            }

            this.options.onOpenTownMap();
        });

        // 2. 旅人行囊
        document.getElementById('btn-inventory')?.addEventListener('click', () => {
            if (this.inventoryUI) {
                this.inventoryUI.remove();
            }
            this.inventoryUI = new InventoryUI(this.profile as any, () => {
                this.inventoryUI = null;
            });
        });

        // 3. 鎮民廣場 (精確傳入正確的 authUid 作為唯一身分識別)
        document.getElementById('btn-chat')?.addEventListener('click', () => {
            if (this.options.onOpenChat) {
                this.options.onOpenChat();
                return;
            }

            if (this.chatUI) {
                this.chatUI.remove();
            }

            // 🌟 嚴格使用從主程式綁定的真實 authUid，徹底根絕匿名分身錯亂與重複發送問題
            const userId = this.authUid || (this.profile as any).uid;

            console.log(`💬 正在開啟鎮民廣場，本次的身分 UID 鎖定為: [${userId}]`);

            this.chatUI = new ChatUI(
                userId,
                this.profile, 
                () => { this.chatUI = null; }
            );
        });

        // 4. 心境小屋
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            if (this.options.onOpenSettings) {
                this.options.onOpenSettings();
                return;
            }

            if (this.restHouseUI) {
                this.restHouseUI = null;
            }
            const userId = this.authUid || (this.profile as any).uid || 'default_user';
            this.restHouseUI = new RestHouseUI(userId, () => {
                this.restHouseUI = null;
            });
        });
    }

    public remove() {
        if (this.inventoryUI) {
            this.inventoryUI.remove();
            this.inventoryUI = null;
        }
        if (this.chatUI) {
            this.chatUI.remove();
            this.chatUI = null;
        }
        this.restHouseUI = null;

        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}