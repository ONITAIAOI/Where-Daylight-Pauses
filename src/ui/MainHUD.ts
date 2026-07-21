import { PlayerProfile } from '../firebase/playerData';
import { InventoryUI } from './InventoryUI';
import { ChatUI } from './ChatUI';
import { RestHouseUI } from './RestHouseUI';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MainHUDOptions {
    onOpenTownMap: () => void;
    onOpenChat?: () => void;      
    onOpenDiary?: () => void;     
    onOpenSettings?: () => void;  
    onOpenCreateProfile?: () => void; 
}

export class MainHUD {
    private profile: PlayerProfile | null;
    private authUid: string; 
    private options: MainHUDOptions;
    private container: HTMLDivElement | null = null;
    private isToastActive: boolean = false;
    private inventoryUI: InventoryUI | null = null;
    private chatUI: ChatUI | null = null;
    private restHouseUI: RestHouseUI | null = null;

    constructor(profile: PlayerProfile | null, authUid: string, options: MainHUDOptions) {
        this.authUid = authUid;
        this.options = options;

        if (!profile || !profile.nickname) {
            console.warn("⚠️ 偵測到新玩家或無效的 profile，正在導向創角介面...");
            this.handleNewPlayerRedirect();
            return; 
        }

        this.profile = profile;

        // 🌟 初始化時計算離線恢復量
        this.processIdleRecovery();

        // 🌟 綁定跨平台生命週期監聽（手機背景切換、關閉網頁/App）
        this.initCrossPlatformLifecycle();

        this.injectGlobalStyles();
        this.render();
    }

    private handleNewPlayerRedirect() {
        if (typeof this.options.onOpenCreateProfile === 'function') {
            this.options.onOpenCreateProfile();
        } else {
            this.showToast("✨ 歡迎來到小鎮，請先建立您的旅人身分。");
        }
    }

    private initCrossPlatformLifecycle() {
        if (!this.profile || !this.authUid) return;

        const updateLastActiveTime = async () => {
            const nowIso = new Date().toISOString();
            if (this.profile) {
                (this.profile as any).lastActiveTime = nowIso;
            }

            try {
                const docRef = doc(db, 'players', this.authUid);
                await setDoc(docRef, { lastActiveTime: nowIso }, { merge: true });
            } catch (error) {
                console.error("更新最後活躍時間失敗:", error);
            }
        };

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                updateLastActiveTime();
            }
        });

        window.addEventListener('pagehide', () => {
            updateLastActiveTime();
        });
    }

    private processIdleRecovery() {
        if (!this.profile) return;

        const now = Date.now();
        const lastActive = (this.profile as any).lastActiveTime ? new Date((this.profile as any).lastActiveTime).getTime() : now;
        
        const diffMs = now - lastActive;
        const tenMinutesMs = 10 * 60 * 1000;

        if (diffMs > tenMinutesMs) {
            const intervals = Math.floor(diffMs / tenMinutesMs); 

            let currentEnergy = (this.profile as any).energy ?? 100;
            let currentResilience = (this.profile as any).resilience ?? 10;
            let currentPerception = (this.profile as any).perception ?? 10;

            const oldEnergy = currentEnergy;
            const oldResilience = currentResilience;
            const oldPerception = currentPerception;

            currentEnergy = Math.min(100, currentEnergy + intervals * 1);
            currentResilience = Math.min(50, currentResilience + intervals * 1);
            currentPerception = Math.min(50, currentPerception + intervals * 1);

            (this.profile as any).energy = currentEnergy;
            (this.profile as any).resilience = currentResilience;
            (this.profile as any).perception = currentPerception;
            
            const currentIso = new Date(now).toISOString();
            (this.profile as any).lastActiveTime = currentIso;

            if (this.authUid) {
                const docRef = doc(db, 'players', this.authUid);
                setDoc(docRef, { 
                    energy: currentEnergy, 
                    resilience: currentResilience, 
                    perception: currentPerception, 
                    lastActiveTime: currentIso 
                }, { merge: true }).catch(err => console.error("同步離線恢復資料失敗:", err));
            }

            const gainedEnergy = currentEnergy - oldEnergy;
            const gainedResilience = currentResilience - oldResilience;
            const gainedPerception = currentPerception - oldPerception;

            if (gainedEnergy > 0 || gainedResilience > 0 || gainedPerception > 0) {
                setTimeout(() => {
                    this.showToast(`🌿 旅人在漫長的靜止中獲得了沉澱：\n能量 +${gainedEnergy} | 心靈韌性 +${gainedResilience} | 感知力 +${gainedPerception}`);
                }, 600);
            }
        } else {
            const currentIso = new Date(now).toISOString();
            (this.profile as any).lastActiveTime = currentIso;
            if (this.authUid) {
                const docRef = doc(db, 'players', this.authUid);
                setDoc(docRef, { lastActiveTime: currentIso }, { merge: true }).catch(err => console.error("更新最後活躍時間失敗:", err));
            }
        }
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
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    background: rgba(234, 179, 8, 0.05) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                /* 🌟 徹底隱藏全域與所有元素的醜醜捲動軸柱子（支援 Chrome, Safari, Firefox, WebView） */
                *::-webkit-scrollbar {
                    display: none !important;
                    width: 0px !important;
                    height: 0px !important;
                }
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
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
        if (!this.profile) return;
        this.remove();

        const energy = (this.profile as any).energy ?? 100;
        const resilience = (this.profile as any).resilience ?? 10;
        const perception = (this.profile as any).perception ?? 10;
        const energyPercent = Math.min(Math.max((energy / 100) * 100, 0), 100);

        this.container = document.createElement('div');
        this.container.id = 'main-hud-container';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #1f1a17 0%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 900; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
        `;

        this.container.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 24px; width: 100%; max-width: 480px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea; overflow: hidden;
                animation: hudFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box; display: flex; flex-direction: column;
                max-height: 92vh;
            ">
                <!-- 🌟 輕量化 BANNER 區塊 -->
                <div style="
                    position: relative; height: 250px;
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 50%, rgba(28, 23, 20, 0.9) 85%, #1c1714 100%), 
                                url('./assets/images/main.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px; box-sizing: border-box;
                    overflow: hidden;
                    border-top-left-radius: 24px;
                    border-top-right-radius: 24px;
                ">
                    <!-- 頂部精簡膠囊資訊列 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; z-index: 1;">
                        <div style="display: flex; gap: 6px;">
                            <div style="
                                background: rgba(18, 16, 14, 0.65); backdrop-filter: blur(6px);
                                border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 16px;
                                padding: 3px 8px; display: flex; align-items: center; gap: 4px;
                                font-size: 10px; font-weight: 600; color: #34d399;
                            " title="心靈韌性">
                                <span>🛡️</span> <span>${resilience}</span>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.65); backdrop-filter: blur(6px);
                                border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 16px;
                                padding: 3px 8px; display: flex; align-items: center; gap: 4px;
                                font-size: 10px; font-weight: 600; color: #60a5fa;
                            " title="感知力">
                                <span>👁️</span> <span>${perception}</span>
                            </div>
                        </div>

                        <div style="display: flex; gap: 6px;">
                            <div style="
                                background: rgba(18, 16, 14, 0.65); backdrop-filter: blur(6px);
                                border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 16px;
                                padding: 3px 8px; display: flex; align-items: center; gap: 4px;
                                font-size: 10px; font-weight: 600; color: #fde047;
                            ">
                                <span>☀️</span> <span>${(this.profile as any).sunCoins ?? 100}</span>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.65); backdrop-filter: blur(6px);
                                border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px;
                                padding: 3px 8px; display: flex; align-items: center; gap: 4px;
                                font-size: 10px; font-weight: 600; color: #d8b4fe;
                            ">
                                <span>🌟</span> <span>${(this.profile as any).memorialTokens ?? 10}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 底部標題與能量條 -->
                    <div style="display: flex; flex-direction: column; gap: 8px; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="font-size: 9px; font-weight: 600; color: #eab308; letter-spacing: 1.2px; margin-bottom: 1px;">
                                    WHERE DAYLIGHT PAUSES
                                </div>
                                <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">
                                    ${this.profile.nickname}
                                </h1>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 8px;
                                padding: 3px 8px; text-align: right;
                            ">
                                <div style="font-size: 8px; color: #a89f91;">今日心境</div>
                                <div style="font-size: 10px; font-weight: 600; color: #eab308;">${(this.profile as any).mood || '平安沉靜'}</div>
                            </div>
                        </div>

                        <!-- 簡約能量條 -->
                        <div style="
                            background: rgba(18, 16, 14, 0.75); backdrop-filter: blur(6px);
                            border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px;
                            padding: 6px 10px; display: flex; flex-direction: column; gap: 4px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                                <span style="color: #a89f91; display: flex; align-items: center; gap: 3px;">
                                    <span>⚡</span> 旅人能量
                                </span>
                                <span style="color: #fbbf24; font-weight: 600;">${energy} / 100</span>
                            </div>
                            <div style="
                                width: 100%; height: 5px; background: rgba(255, 255, 255, 0.1);
                                border-radius: 2.5px; overflow: hidden; position: relative;
                            ">
                                <div style="
                                    width: ${energyPercent}%; height: 100%;
                                    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
                                    border-radius: 2.5px; box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
                                    transition: width 0.4s ease;
                                "></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 下方選單列表 -->
                <div style="padding: 14px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #1c1714;">
                    <div style="font-size: 10px; font-weight: 600; color: #a89f91; margin-bottom: -2px; letter-spacing: 0.5px;">
                        停靠站選單
                    </div>

                    <div class="station-card" id="btn-town-map" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 12px; font-weight: 600; color: #eab308; background: rgba(234,179,8,0.1); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🧭
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff;">探索小鎮地圖</div>
                                <div style="font-size: 10px; color: #a89f91;">漫步咖啡館、噴泉與巷弄，尋找日常事件</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #eab308; font-weight: 500;">前往 ➔</div>
                    </div>

                    <div class="station-card" id="btn-chat" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 12px; font-weight: 600; color: #60a5fa; background: rgba(96,165,250,0.1); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                💬
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff;">鎮民廣場</div>
                                <div style="font-size: 10px; color: #a89f91;">與其他在小鎮歇腳的旅人聊聊天</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #60a5fa; font-weight: 500;">入席 ➔</div>
                    </div>

                    <div class="station-card" id="btn-inventory" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 12px; font-weight: 600; color: #34d399; background: rgba(52,211,153,0.1); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🎒
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff;">旅人行囊</div>
                                <div style="font-size: 10px; color: #a89f91;">查看隨身信物與收集的紀念</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #34d399; font-weight: 500;">打開 ➔</div>
                    </div>

                    <div class="station-card" id="btn-settings" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s ease;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 12px; font-weight: 600; color: #c084fc; background: rgba(192,132,252,0.1); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                🍵
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff;">心境小屋</div>
                                <div style="font-size: 10px; color: #a89f91;">進入小屋深度休息，沉澱並累積暖陽幣</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #c084fc; font-weight: 500;">休憩 ➔</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }

    private bindEvents() {
        document.getElementById('btn-town-map')?.addEventListener('click', () => {
            if (!this.profile) return;
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
                this.showToast(`✨ 你的 8 小時休息已完成！記得去「心境小屋」領取獎勵喔！`);
            }

            this.options.onOpenTownMap();
        });

        document.getElementById('btn-inventory')?.addEventListener('click', () => {
            if (this.inventoryUI) {
                this.inventoryUI.remove();
            }
            const userId = this.authUid || (this.profile as any)?.uid;
            this.inventoryUI = new InventoryUI(userId, () => {
                this.inventoryUI = null;
            });
        });

        document.getElementById('btn-chat')?.addEventListener('click', () => {
            if (this.options.onOpenChat) {
                this.options.onOpenChat();
                return;
            }

            if (this.chatUI) {
                this.chatUI.remove();
            }

            const userId = this.authUid || (this.profile as any)?.uid;
            if (this.profile) {
                this.chatUI = new ChatUI(
                    userId,
                    this.profile, 
                    () => { this.chatUI = null; }
                );
            }
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            if (this.options.onOpenSettings) {
                this.options.onOpenSettings();
                return;
            }

            if (this.restHouseUI) {
                this.restHouseUI = null;
            }
            const userId = this.authUid || (this.profile as any)?.uid || 'default_user';
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