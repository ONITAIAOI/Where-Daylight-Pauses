import { PlayerProfile } from '../firebase/playerData';
import { InventoryUI } from './InventoryUI';
import { ChatUI } from './ChatUI';
import { RestHouseUI } from './RestHouseUI';
import { TownMapUI } from './TownMapUI';
import { AlchemistWorkshopUI } from './AlchemistWorkshopUI';
import { getPlayerProfile } from '../firebase/playerData';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// ✨ 溫柔語句庫
const GENTLE_SAYINGS = [
    '陽光穿過樹葉，在地上寫下詩句。',
    '今天不趕時間，風會帶你去該去的地方。',
    '每一杯茶的溫度，都是生活停留的證據。',
    '慢下來，才能聽見時光的聲音。',
    '小鎮的午後，總有值得駐足的光影。',
    '讓日光停留片刻，讓心也跟著沉靜。',
    '有些路，不需要走快，只需要走對。',
    '微風輕輕吹過，日子就溫柔了起來。'
];

export interface MainHUDOptions {
    onOpenTownMap?: () => void;
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
    private townMapUI: TownMapUI | null = null;
    private alchemistWorkshopUI: AlchemistWorkshopUI | null = null;
    private glowParticles: HTMLDivElement[] = [];
    private currentSaying: string = '';

    constructor(profile: PlayerProfile | null, authUid: string, options: MainHUDOptions) {
        this.authUid = authUid;
        this.options = options;

        if (!profile || !profile.nickname) {
            console.warn("⚠️ 偵測到新玩家或無效的 profile，正在導向創角介面...");
            this.handleNewPlayerRedirect();
            return;
        }

        this.profile = profile;
        this.currentSaying = GENTLE_SAYINGS[Math.floor(Math.random() * GENTLE_SAYINGS.length)];

        this.processIdleRecovery();
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
                    this.showToast(`🌿 旅人在漫長的靜止中獲得了沉澱：\n☀️ 光量 +${gainedEnergy} | 🛡️ 韌性 +${gainedResilience} | 👁️ 感知 +${gainedPerception}`);
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
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes toastFadeInTop {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes toastFadeOutTop {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -15px); }
                }
                @keyframes glowFloat {
                    0% { opacity: 0.15; transform: translateY(0) scale(1); }
                    50% { opacity: 0.5; transform: translateY(-20px) scale(1.2); }
                    100% { opacity: 0.15; transform: translateY(0) scale(1); }
                }
                .glow-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, rgba(234, 179, 8, 0) 70%);
                    pointer-events: none;
                    animation: glowFloat 6s ease-in-out infinite;
                }
                .station-card {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .station-card::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at 30% 30%, rgba(234, 179, 8, 0.03) 0%, transparent 60%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    pointer-events: none;
                }
                .station-card:hover::after {
                    opacity: 1;
                }
                .station-card:hover {
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    background: rgba(234, 179, 8, 0.06) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
                }
                .station-card:active {
                    transform: translateY(0) scale(0.98);
                }

                *::-webkit-scrollbar {
                    display: none !important;
                    width: 0px !important;
                    height: 0px !important;
                }
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                @media (max-width: 480px) {
                    .main-hud-panel {
                        max-width: 100% !important;
                        height: 100dvh !important;
                        max-height: 100dvh !important;
                        border-radius: 0 !important;
                        border: none !important;
                    }
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
            position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
            background: rgba(28, 23, 20, 0.95);
            border: 1px solid rgba(234, 179, 8, 0.5);
            color: #f3f0ea; padding: 12px 22px; border-radius: 14px;
            font-size: 13px; font-weight: 500; letter-spacing: 0.5px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
            z-index: 9999; backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            animation: toastFadeInTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            white-space: pre-line; text-align: center; line-height: 1.5;
            max-width: 90vw; box-sizing: border-box;
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

    private createGlowParticles() {
        const container = this.container;
        if (!container) return;

        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        const panel = container.querySelector('.main-hud-panel');
        if (!panel) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'glow-particle';
            const size = 4 + Math.random() * 8;
            const x = 10 + Math.random() * 80;
            const y = 10 + Math.random() * 80;
            const delay = Math.random() * 6;
            const duration = 5 + Math.random() * 4;

            particle.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x}%; top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.1 + Math.random() * 0.3};
            `;
            panel.appendChild(particle);
            this.glowParticles.push(particle);
        }
    }

    private render() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        const energy = (this.profile as any).energy ?? 100;
        const resilience = (this.profile as any).resilience ?? 10;
        const perception = (this.profile as any).perception ?? 10;
        const energyPercent = Math.min(Math.max((energy / 100) * 100, 0), 100);

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes().toString().padStart(2, '0');
        const timeGreeting = hour < 12 ? '晨光' : hour < 17 ? '午後' : hour < 20 ? '暮色' : '靜夜';
        const timeDisplay = `${timeGreeting} ${hour}:${minute}`;

        const weathers = ['日光正暖', '微風徐徐', '光影斑駁', '天色溫柔', '風很輕', '雲很淡'];
        const currentWeather = weathers[Math.floor(Math.random() * weathers.length)];

        this.container = document.createElement('div');
        this.container.id = 'main-hud-container';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: linear-gradient(160deg, #2a241f 0%, #1a1613 40%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 900; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box; overflow: hidden;
        `;

        this.container.innerHTML = `
            <div class="main-hud-panel" style="
                background: rgba(28, 23, 20, 0.92);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(234, 179, 8, 0.15);
                border-radius: 24px; width: 100%; max-width: 440px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.04);
                color: #f3f0ea; display: flex; flex-direction: column;
                animation: hudFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box; height: 100dvh; max-height: 820px;
                overflow: hidden;
                position: relative;
            ">
                <div style="
                    position: relative; height: clamp(180px, 28vh, 220px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 75%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/main.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px; box-sizing: border-box; flex-shrink: 0;
                    border-radius: 24px 24px 0 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <div style="
                            background: rgba(28, 23, 20, 0.7); 
                            backdrop-filter: blur(8px);
                            -webkit-backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.15);
                            border-radius: 14px;
                            padding: 4px 14px 5px 14px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
                        ">
                            <span style="font-size: 11px; font-weight: 400; color: #f5e6ca; letter-spacing: 0.5px;">
                                ${timeDisplay}
                            </span>
                            <span style="
                                font-size: 9px; 
                                font-weight: 300; 
                                color: #d4c9b8; 
                                letter-spacing: 0.3px;
                                padding-left: 6px;
                                border-left: 1px solid rgba(255,255,255,0.1);
                            ">
                                ${currentWeather}
                            </span>
                        </div>

                        <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                -webkit-backdrop-filter: blur(6px);
                                border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 14px;
                                padding: 2px 10px; display: flex; align-items: center; gap: 3px;
                                font-size: 10px; font-weight: 500; color: #34d399;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            " title="心靈韌性">
                                <span>🛡️</span> <span>${resilience}</span>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                -webkit-backdrop-filter: blur(6px);
                                border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 14px;
                                padding: 2px 10px; display: flex; align-items: center; gap: 3px;
                                font-size: 10px; font-weight: 500; color: #60a5fa;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            " title="感知力">
                                <span>👁️</span> <span>${perception}</span>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                -webkit-backdrop-filter: blur(6px);
                                border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 14px;
                                padding: 2px 10px; display: flex; align-items: center; gap: 3px;
                                font-size: 10px; font-weight: 500; color: #fde047;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            " title="暖陽幣">
                                <span>☀️</span> <span>${(this.profile as any).sunCoins ?? 100}</span>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                -webkit-backdrop-filter: blur(6px);
                                border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 14px;
                                padding: 2px 10px; display: flex; align-items: center; gap: 3px;
                                font-size: 10px; font-weight: 500; color: #d8b4fe;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            " title="紀念代幣">
                                <span>🌟</span> <span>${(this.profile as any).memorialTokens ?? 10}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="font-size: 9px; font-weight: 500; color: #eab308; letter-spacing: 1.5px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                                    WHERE DAYLIGHT PAUSES
                                </div>
                                <h1 style="margin: 0; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6);">
                                    ${this.profile.nickname}
                                </h1>
                            </div>
                            <div style="
                                background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                                -webkit-backdrop-filter: blur(6px);
                                border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 8px;
                                padding: 2px 10px; text-align: right;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            ">
                                <div style="font-size: 8px; color: #a89f91; letter-spacing: 0.5px;">今日心境</div>
                                <div style="font-size: 10px; font-weight: 600; color: #eab308;">${(this.profile as any).mood || '平安沉靜'}</div>
                            </div>
                        </div>

                        <div style="
                            background: rgba(18, 16, 14, 0.75); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px;
                            padding: 5px 12px; display: flex; flex-direction: column; gap: 3px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                                <span style="color: #d4c9b8; display: flex; align-items: center; gap: 4px;">
                                    <span>☀️</span> 今日光量
                                </span>
                                <span style="color: #fbbf24; font-weight: 600;">${energy} / 100</span>
                            </div>
                            <div style="
                                width: 100%; height: 4px; background: rgba(255, 255, 255, 0.08);
                                border-radius: 2px; overflow: hidden; position: relative;
                            ">
                                <div style="
                                    width: ${energyPercent}%; height: 100%;
                                    background: linear-gradient(90deg, #eab308 0%, #fbbf24 50%, #fde047 100%);
                                    border-radius: 2px; box-shadow: 0 0 12px rgba(251, 191, 36, 0.25);
                                    transition: width 0.6s ease;
                                "></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="
                    padding: 10px 18px 6px 18px;
                    background: rgba(234, 179, 8, 0.04);
                    border-bottom: 1px solid rgba(234, 179, 8, 0.08);
                    flex-shrink: 0;
                ">
                    <div style="
                        font-size: 11px; color: #d4c9b8; text-align: center;
                        font-style: italic; font-weight: 300; letter-spacing: 0.3px;
                        line-height: 1.5;
                    ">
                        ✦ ${this.currentSaying} ✦
                    </div>
                </div>

                <div style="padding: 12px 18px 18px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: rgba(28, 23, 20, 0.6); flex: 1;">
                    <div style="font-size: 9px; font-weight: 500; color: #8a7a5a; margin-bottom: 2px; letter-spacing: 0.8px; text-transform: uppercase;">
                        停靠站 · 散步去
                    </div>

                    <div class="station-card" id="btn-town-map" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 16px; color: #eab308; background: rgba(234,179,8,0.08); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                🧭
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 1px;">探索小鎮地圖</div>
                                <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">漫步咖啡館、噴泉與巷弄</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #eab308; font-weight: 400; flex-shrink: 0; padding-left: 8px; letter-spacing: 0.5px;">散步去 ✦</div>
                    </div>

                    <div class="station-card" id="btn-chat" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 16px; color: #60a5fa; background: rgba(96,165,250,0.08); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                💬
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 1px;">鎮民廣場</div>
                                <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">與歇腳的旅人聊聊天</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #60a5fa; font-weight: 400; flex-shrink: 0; padding-left: 8px; letter-spacing: 0.5px;">坐下來 ☕</div>
                    </div>

                    <div class="station-card" id="btn-inventory" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 16px; color: #34d399; background: rgba(52,211,153,0.08); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                🎒
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 1px;">旅人行囊</div>
                                <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">隨身信物與收集的紀念</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #34d399; font-weight: 400; flex-shrink: 0; padding-left: 8px; letter-spacing: 0.5px;">翻開 🍃</div>
                    </div>

                    <div class="station-card" id="btn-settings" style="
                        background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 10px 14px; cursor: pointer;
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 16px; color: #c084fc; background: rgba(192,132,252,0.08); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                🍵
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 1px;">心境小屋</div>
                                <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">沉澱片刻，累積暖陽</div>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: #c084fc; font-weight: 400; flex-shrink: 0; padding-left: 8px; letter-spacing: 0.5px;">沉澱 🌙</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.createGlowParticles();
        this.bindEvents();
    }

    private bindEvents() {
        // 🗺️ 地圖按鈕
        document.getElementById('btn-town-map')?.addEventListener('click', () => {
            if (!this.profile) return;

            const restingUntil = (this.profile as any)?.restingUntil ? new Date((this.profile as any).restingUntil).getTime() : 0;
            const now = Date.now();

            if (restingUntil > now) {
                const remaining = restingUntil - now;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                this.showToast(`💤 旅人正在心境小屋深度休息中...\n還需等待 ${hours}小時${minutes}分 再散步吧！`);
                return;
            }

            if (restingUntil > 0 && restingUntil <= now) {
                this.showToast(`✨ 休息已完成！記得去「心境小屋」領取暖陽喔！`);
            }

            if (this.townMapUI) {
                this.townMapUI.remove();
                this.townMapUI = null;
            }

            const userId = this.authUid || (this.profile as any)?.uid || 'default_user';

            this.townMapUI = new TownMapUI(
                (locationId: string) => {
                    console.log(`📍 選擇地點: ${locationId}`);

                    if (this.townMapUI) {
                        this.townMapUI.remove();
                        this.townMapUI = null;
                    }

                    switch (locationId) {
                        case 'alchemist': {
                            if (this.alchemistWorkshopUI) {
                                this.alchemistWorkshopUI.remove();
                                this.alchemistWorkshopUI = null;
                            }
                            this.alchemistWorkshopUI = new AlchemistWorkshopUI(
                                userId,
                                (recipeId, refreshUI) => {
                                    console.log(`⚗️ 合成配方: ${recipeId}`);
                                    if (refreshUI) refreshUI();
                                },
                                () => {
                                    if (this.alchemistWorkshopUI) {
                                        this.alchemistWorkshopUI.remove();
                                        this.alchemistWorkshopUI = null;
                                    }
                                    this.openTownMap();
                                }
                            );
                            break;
                        }
                        case 'blacksmith':
                            console.log('🔨 鐵匠鋪（後續擴充）');
                            break;
                        case 'guild':
                            console.log('⚔️ 冒險者公會（後續擴充）');
                            break;
                        default:
                            console.warn(`未知地點: ${locationId}`);
                            break;
                    }
                },
                () => {
                    if (this.townMapUI) {
                        this.townMapUI.remove();
                        this.townMapUI = null;
                    }
                }
            );

            if (this.options.onOpenTownMap) {
                this.options.onOpenTownMap();
            }
        });

        // 🎒 行囊按鈕
        document.getElementById('btn-inventory')?.addEventListener('click', () => {
            if (this.inventoryUI) {
                this.inventoryUI.remove();
            }
            const userId = this.authUid || (this.profile as any)?.uid;
            this.inventoryUI = new InventoryUI(userId, () => {
                this.inventoryUI = null;
            });
        });

        // 💬 鎮民廣場按鈕
        document.getElementById('btn-chat')?.addEventListener('click', () => {
            if (this.chatUI) {
                this.chatUI.remove();
                this.chatUI = null;
            }

            const userId = this.authUid || (this.profile as any)?.uid;
            if (this.profile) {
                this.chatUI = new ChatUI(
                    userId,
                    this.profile,
                    () => {
                        this.chatUI = null;
                    }
                );
            }

            if (this.options.onOpenChat) {
                this.options.onOpenChat();
            }
        });

        // 🍵 心境小屋按鈕
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            // ✅ 關閉已打開的 ChatUI（因為它使用舊的 Profile）
            if (this.chatUI) {
                this.chatUI.remove();
                this.chatUI = null;
            }

            if (this.restHouseUI) {
                this.restHouseUI = null;
            }
            const userId = this.authUid || (this.profile as any)?.uid || 'default_user';
            this.restHouseUI = new RestHouseUI(userId, async () => {
                // ✅ 心境小屋關閉時，重新載入最新的 Profile
                const updatedProfile = await getPlayerProfile(this.authUid);
                if (updatedProfile) {
                    this.profile = updatedProfile;
                    // ✅ 如果有 ChatUI，更新它的 Profile
                    if (this.chatUI) {
                        this.chatUI.updateProfile(updatedProfile);
                    }
                    // ✅ 更新 MainHUD 顯示
                    this.render();
                }
                this.restHouseUI = null;
            });

            if (this.options.onOpenSettings) {
                this.options.onOpenSettings();
            }
        });
    }

    private openTownMap() {
        if (!this.profile) return;

        if (this.townMapUI) {
            console.log('🗺️ 地圖已存在，直接顯示');
            return;
        }

        const userId = this.authUid || (this.profile as any)?.uid || 'default_user';

        this.townMapUI = new TownMapUI(
            (locationId: string) => {
                console.log(`📍 選擇地點: ${locationId}`);

                if (this.townMapUI) {
                    this.townMapUI.remove();
                    this.townMapUI = null;
                }

                switch (locationId) {
                    case 'alchemist': {
                        if (this.alchemistWorkshopUI) {
                            this.alchemistWorkshopUI.remove();
                            this.alchemistWorkshopUI = null;
                        }
                        this.alchemistWorkshopUI = new AlchemistWorkshopUI(
                            userId,
                            (recipeId, refreshUI) => {
                                console.log(`⚗️ 合成配方: ${recipeId}`);
                                if (refreshUI) refreshUI();
                            },
                            () => {
                                if (this.alchemistWorkshopUI) {
                                    this.alchemistWorkshopUI.remove();
                                    this.alchemistWorkshopUI = null;
                                }
                                this.openTownMap();
                            }
                        );
                        break;
                    }
                    case 'blacksmith':
                        console.log('🔨 鐵匠鋪（後續擴充）');
                        break;
                    case 'guild':
                        console.log('⚔️ 冒險者公會（後續擴充）');
                        break;
                    default:
                        console.warn(`未知地點: ${locationId}`);
                        break;
                }
            },
            () => {
                if (this.townMapUI) {
                    this.townMapUI.remove();
                    this.townMapUI = null;
                }
            }
        );
    }

    // ✅ 新增：更新 Profile（供外部調用）
    public updateProfile(newProfile: PlayerProfile) {
        this.profile = newProfile;
        this.render();
        // 如果有 ChatUI，也更新它的 Profile
        if (this.chatUI) {
            this.chatUI.updateProfile(newProfile);
        }
    }

    public remove() {
        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        if (this.inventoryUI) {
            this.inventoryUI.remove();
            this.inventoryUI = null;
        }
        if (this.chatUI) {
            this.chatUI.remove();
            this.chatUI = null;
        }
        if (this.townMapUI) {
            this.townMapUI.remove();
            this.townMapUI = null;
        }
        if (this.alchemistWorkshopUI) {
            this.alchemistWorkshopUI.remove();
            this.alchemistWorkshopUI = null;
        }
        this.restHouseUI = null;

        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}