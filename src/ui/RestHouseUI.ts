import { PlayerProfile, savePlayerProfile, getPlayerProfile } from '../firebase/playerData';
import { CHAT_SKINS, ChatSkinConfig } from '../config/chatSkinsConfig';

export class RestHouseUI {
    private uid: string;
    private container: HTMLDivElement | null = null;
    private modalBackdrop: HTMLDivElement | null = null;
    private timerInterval: any = null;
    private onBackToMain: () => void;
    private activeTab: 'rest' | 'wardrobe' = 'rest';
    private glowParticles: HTMLDivElement[] = [];

    constructor(uid: string, onBackToMain: () => void) {
        this.uid = uid;
        this.onBackToMain = onBackToMain;
        this.injectStyles();
        this.createModalBackdrop();
        this.initLayout();
    }

    private injectStyles() {
        if (!document.getElementById('rest-house-styles')) {
            const style = document.createElement('style');
            style.id = 'rest-house-styles';
            style.innerHTML = `
                @keyframes restFadeIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes glowFloat {
                    0% { opacity: 0.1; transform: translateY(0) scale(1); }
                    50% { opacity: 0.4; transform: translateY(-18px) scale(1.2); }
                    100% { opacity: 0.1; transform: translateY(0) scale(1); }
                }
                @keyframes moonPhase {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.05); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                @keyframes rewardBurst {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }

                // ✨ 複製 ChatUI 的皮膚動畫（讓預覽也能顯示）
                @keyframes skinGlowPulse {
                    0%, 100% { filter: brightness(1); transform: scale(1); }
                    50% { filter: brightness(1.2); transform: scale(1.02); }
                }
                @keyframes borderFlow {
                    0% { border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
                    50% { border-color: rgba(254, 240, 138, 1); box-shadow: 0 0 35px rgba(234, 179, 8, 0.9); }
                    100% { border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
                }
                @keyframes auroraFlow {
                    0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
                    50% { background-position: 100% 50%; filter: hue-rotate(15deg); }
                    100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
                }
                @keyframes cosmicSpin {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes cherryFall {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.1); box-shadow: 0 0 30px rgba(255, 182, 193, 0.5); }
                }
                @keyframes enchantedGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.7), 0 0 60px rgba(236, 72, 153, 0.3); }
                }
                @keyframes magmaFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes cyberGlitch {
                    0%, 100% { filter: hue-rotate(0deg) brightness(1); }
                    50% { filter: hue-rotate(30deg) brightness(1.2); box-shadow: 0 0 25px rgba(45, 212, 191, 0.8), inset 0 0 12px rgba(168, 85, 247, 0.6); }
                }
                @keyframes crystalShimmer {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.03); text-shadow: 0 0 20px rgba(255,255,255,0.5); }
                }
                @keyframes rainbowFlow {
                    0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
                    100% { background-position: 200% 50%; filter: hue-rotate(360deg); }
                }
                @keyframes lightningStrike {
                    0%, 89%, 91%, 93%, 95%, 97%, 100% { opacity: 0; transform: scale(0.8); }
                    90% { opacity: 1; transform: scale(1.2); }
                    92% { opacity: 0.6; transform: scale(1.1); }
                    94% { opacity: 1; transform: scale(1.3); }
                    96% { opacity: 0; transform: scale(0.9); }
                    98% { opacity: 0.8; transform: scale(1.1); }
                }
                @keyframes lightningPulse {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.8); opacity: 0.6; }
                }
                @keyframes flameDance {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
                    25% { transform: scale(1.1) rotate(-3deg); opacity: 0.9; }
                    50% { transform: scale(0.95) rotate(3deg); opacity: 0.7; }
                    75% { transform: scale(1.05) rotate(-2deg); opacity: 0.8; }
                }
                @keyframes stormSpin {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                @keyframes meteorShower {
                    0% { transform: translateX(-20px) translateY(-20px) scale(0.5); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(40px) translateY(40px) scale(1.5); opacity: 0; }
                }
                @keyframes candleFlicker {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
                    20% { transform: scale(1.05) rotate(2deg); opacity: 0.9; }
                    40% { transform: scale(0.95) rotate(-2deg); opacity: 0.6; }
                    60% { transform: scale(1.08) rotate(1deg); opacity: 0.8; }
                    80% { transform: scale(0.92) rotate(-1deg); opacity: 0.7; }
                }

                // ============================================================
                // ✨ 皮膚專屬動畫（extraClass）- 複製自 ChatUI
                // ============================================================

                .candle-skin::before {
                    content: '🕯️';
                    position: absolute;
                    top: 10%;
                    right: 8%;
                    font-size: 24px;
                    animation: candleFlicker 1.5s ease-in-out infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.5));
                    z-index: 2;
                }
                .candle-skin::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 70% 20%, rgba(251, 191, 36, 0.08) 0%, transparent 60%);
                    animation: candleFlicker 2s ease-in-out infinite;
                    pointer-events: none;
                    border-radius: inherit;
                    z-index: 1;
                }

                .rainbow-skin::before {
                    content: '✨';
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    font-size: 20px;
                    animation: meteorShower 3s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                .rainbow-skin::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent 30%, rgba(255,255,255,0.05));
                    pointer-events: none;
                    border-radius: inherit;
                    z-index: 1;
                }

                .storm-skin::before {
                    content: '🌀';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 48px;
                    opacity: 0.08;
                    animation: stormSpin 8s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                .storm-skin::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.05) 0%, transparent 60%);
                    animation: stormSpin 12s linear infinite reverse;
                    pointer-events: none;
                    border-radius: inherit;
                    z-index: 1;
                }

                .star-skin::before {
                    content: '⭐';
                    position: absolute;
                    top: 15%;
                    right: 12%;
                    font-size: 18px;
                    animation: meteorShower 2.5s ease-in-out infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 10px rgba(129, 140, 248, 0.6));
                    z-index: 2;
                }
                .star-skin::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at 80% 20%, rgba(129, 140, 248, 0.05) 0%, transparent 50%);
                    animation: skinGlowPulse 3s ease-in-out infinite;
                    pointer-events: none;
                    border-radius: inherit;
                    z-index: 1;
                }

                .lightning-skin::before {
                    content: '⚡';
                    position: absolute;
                    top: 20%;
                    right: 10%;
                    font-size: 30px;
                    opacity: 0;
                    animation: lightningStrike 4s ease-in-out infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.6));
                    z-index: 2;
                }
                .lightning-skin::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at 60% 30%, rgba(251, 191, 36, 0.06) 0%, transparent 50%);
                    animation: lightningPulse 3s ease-in-out infinite;
                    pointer-events: none;
                    border-radius: inherit;
                    z-index: 1;
                }

                .phoenix-skin::before {
                    content: '🔥';
                    position: absolute;
                    top: 10%;
                    right: 8%;
                    font-size: 22px;
                    animation: flameDance 1.5s ease-in-out infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 20px rgba(249, 115, 22, 0.5));
                    z-index: 2;
                }
                .phoenix-skin::after {
                    content: '✦';
                    position: absolute;
                    bottom: 15%;
                    left: 10%;
                    font-size: 16px;
                    opacity: 0.3;
                    animation: meteorShower 3s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                }

                .rest-glow-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0) 70%);
                    pointer-events: none;
                    animation: glowFloat 5s ease-in-out infinite;
                }
                .rest-action-btn:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.08) !important;
                    transform: translateY(-1px);
                }
                .skin-card {
                    transition: all 0.2s ease;
                }
                .skin-card:hover {
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    transform: translateY(-2px);
                }
                .skin-card.equipped {
                    border-color: rgba(74, 222, 128, 0.4) !important;
                    background: rgba(74, 222, 128, 0.05) !important;
                }
                .moon-icon {
                    animation: moonPhase 8s ease-in-out infinite;
                    display: inline-block;
                }
                .reward-burst {
                    animation: rewardBurst 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #eab308 0%, #fde047 50%, #eab308 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
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

               
            `;
            document.head.appendChild(style);
        }
    }

    private createGlowParticles() {
        const container = this.container?.querySelector('.rest-main-card');
        if (!container) return;

        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        for (let i = 0; i < 14; i++) {
            const particle = document.createElement('div');
            particle.className = 'rest-glow-particle';
            const size = 3 + Math.random() * 8;
            const x = 5 + Math.random() * 90;
            const y = 5 + Math.random() * 90;
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;

            particle.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x}%; top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.08 + Math.random() * 0.25};
            `;
            container.appendChild(particle);
            this.glowParticles.push(particle);
        }
    }

    private createModalBackdrop() {
        if (document.getElementById('custom-modal-backdrop')) return;

        this.modalBackdrop = document.createElement('div');
        this.modalBackdrop.id = 'custom-modal-backdrop';
        this.modalBackdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: none; justify-content: center; align-items: center; z-index: 2000;
        `;
        this.modalBackdrop.innerHTML = `
            <div id="custom-modal-box" style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.4);
                border-radius: 20px; padding: 28px; width: 90%; max-width: 360px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8); text-align: center;
                animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
            ">
                <div id="modal-icon" style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
                <h3 id="modal-title" style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #fff;">提示標題</h3>
                <p id="modal-desc" style="margin: 0 0 22px 0; font-size: 13px; color: #a89f91; line-height: 1.6; white-space: pre-line;">提示內容</p>
                <div id="modal-buttons" style="display: flex; gap: 10px;"></div>
            </div>
        `;
        document.body.appendChild(this.modalBackdrop);
    }

    private async initLayout() {
        if (this.container) return;

        const profile = await getPlayerProfile(this.uid);
        if (!profile) return;

        const profileAny = profile as any;

        this.container = document.createElement('div');
        this.container.id = 'rest-house-overlay';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: linear-gradient(160deg, #1f1a17 0%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #f3f0ea; padding: 16px; box-sizing: border-box;
            animation: restFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            overflow: hidden;
        `;

        this.container.innerHTML = `
            <div class="rest-main-card" style="
                position: relative; z-index: 1;
               background: #1c1714;
    border: none;
    border-radius: 0; width: 100vw; max-width: 100vw;
    box-shadow: none;
     rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.04);
                overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column;
                max-height: 92vh; height: 100%;
            ">
                <div style="
                    position: relative; height: clamp(130px, 22vh, 170px); flex-shrink: 0;
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 75%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/RestHouseUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px; box-sizing: border-box;
                    border-radius: 24px 24px 0 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="rest-back-btn" style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(8px);
                            -webkit-backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.2); color: #fde047;
                            padding: 5px 14px; border-radius: 20px; cursor: pointer;
                            font-size: 12px; font-weight: 600; transition: all 0.2s;
                            display: flex; align-items: center; gap: 4px;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">⬅ 返回</button>

                        <div id="rest-coins-display" style="
                            display: flex; gap: 8px; 
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            padding: 4px 12px; border-radius: 16px; 
                            border: 1px solid rgba(255,255,255,0.06);
                            font-size: 11px; font-weight: 600;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">
                            <span style="color: #eab308;">☀️ ${profileAny.sunCoins ?? 100}</span>
                            <span style="color: #38bdf8;">🌟 ${profileAny.memorialTokens ?? 10}</span>
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 500; color: #eab308; letter-spacing: 1.5px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            SERENE COTTAGE
                        </div>
                        <h1 style="margin: 0; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 8px;">
                            🌙 心境小屋
                            <span style="font-size: 10px; font-weight: 300; color: #d4c9b8; text-shadow: none;">· 沉澱時光</span>
                        </h1>
                    </div>
                </div>

                <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(22, 18, 16, 0.8); flex-shrink: 0;">
                    <button id="tab-rest-btn" style="
                        flex: 1; padding: 10px 0; background: transparent;
                        border: none; border-bottom: 2px solid transparent;
                        font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                        color: #a89f91;
                    ">🌙 小屋休憩</button>
                    <button id="tab-wardrobe-btn" style="
                        flex: 1; padding: 10px 0; background: transparent;
                        border: none; border-bottom: 2px solid transparent;
                        font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                        color: #a89f91;
                    ">💬 對話衣櫥</button>
                </div>

                <div id="rest-house-body-content" style="
                    padding: 16px 18px 18px 18px; 
                    overflow-y: auto; 
                    display: flex; flex-direction: column; gap: 12px; 
                    background: rgba(28, 23, 20, 0.6); 
                    flex: 1; 
                    -webkit-overflow-scrolling: touch;
                ">
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.createGlowParticles();
        this.bindGlobalEvents();
        this.updateContent();
    }

    private async updateContent() {
        const profile = await getPlayerProfile(this.uid);
        if (!profile) return;

        const profileAny = profile as any;
        const restingUntil = profileAny?.restingUntil ? new Date(profileAny.restingUntil).getTime() : 0;
        const now = Date.now();
        const isResting = restingUntil > now;

        const coinsEl = document.getElementById('rest-coins-display');
        if (coinsEl) {
            coinsEl.innerHTML = `
                <span style="color: #eab308;">☀️ ${profileAny.sunCoins ?? 100}</span>
                <span style="color: #38bdf8;">🌟 ${profileAny.memorialTokens ?? 10}</span>
            `;
        }

        const tabRestBtn = document.getElementById('tab-rest-btn');
        const tabWardrobeBtn = document.getElementById('tab-wardrobe-btn');
        if (tabRestBtn && tabWardrobeBtn) {
            tabRestBtn.style.borderBottomColor = this.activeTab === 'rest' ? '#eab308' : 'transparent';
            tabRestBtn.style.color = this.activeTab === 'rest' ? '#fde047' : '#a89f91';

            tabWardrobeBtn.style.borderBottomColor = this.activeTab === 'wardrobe' ? '#eab308' : 'transparent';
            tabWardrobeBtn.style.color = this.activeTab === 'wardrobe' ? '#fde047' : '#a89f91';
        }

        const bodyContent = document.getElementById('rest-house-body-content');
        if (bodyContent) {
            bodyContent.innerHTML = this.activeTab === 'rest'
                ? this.renderRestTabContent(profile, restingUntil)
                : this.renderWardrobeTabContent(profile);
        }

        this.bindActionEvents(restingUntil);

        if (this.activeTab === 'rest' && isResting) {
            this.startCountdown(restingUntil);
        }
    }

    private renderRestTabContent(profile: PlayerProfile, restingUntil: number): string {
        const hasActiveRest = restingUntil > Date.now();

        return `
            <div style="
                font-size: 10px; font-weight: 500; color: #8a7a5a; 
                letter-spacing: 0.8px; text-transform: uppercase;
                margin-bottom: 2px;
            ">🌙 沉澱時光</div>
            <p style="margin: 0; font-size: 12px; color: #a89f91; line-height: 1.6;">
                放慢腳步，讓心靈沉澱。<br>
                在此休息 <span style="color: #eab308; font-weight: 600;">8 小時</span> 可獲得 
                <span style="color: #eab308; font-weight: 600;">☀️ 500 暖陽幣</span>。
            </p>
            <div id="rest-content-area" style="display: flex; flex-direction: column; gap: 12px;">
                ${hasActiveRest ? this.renderRestingHTML(restingUntil) : this.renderReadyHTML()}
            </div>
        `;
    }

    private renderReadyHTML(): string {
        return `
            <div style="
                background: rgba(255, 255, 255, 0.02); 
                border-radius: 12px; padding: 14px 16px; 
                border: 1px solid rgba(255,255,255,0.04);
            ">
                <div style="font-size: 12px; font-weight: 600; color: #eab308; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span class="moon-icon">🌙</span> 休息須知
                </div>
                <div style="font-size: 11px; color: #a89f91; line-height: 1.8; text-align: left;">
                    • 進入 8 小時沉澱期，期間無法探索小鎮<br>
                    • 聊天大廳仍可正常使用<br>
                    • 倒數結束後可領取 500 暖陽幣獎勵
                </div>
            </div>
            <button id="start-rest-btn" class="rest-action-btn" style="
                width: 100%; padding: 13px;
                background: rgba(234, 179, 8, 0.12);
                border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 12px; 
                color: #fde047; font-size: 13px; font-weight: 600; 
                cursor: pointer; transition: all 0.2s;
                display: flex; align-items: center; justify-content: center; gap: 8px;
            ">
                <span class="moon-icon">🌙</span> 開始沉澱休息
            </button>
        `;
    }

    private renderRestingHTML(restingUntil: number): string {
        const remaining = Math.max(0, restingUntil - Date.now());
        const isReadyToClaim = remaining === 0;

        if (isReadyToClaim) {
            return `
                <div style="
                    background: rgba(74, 222, 128, 0.06); 
                    border: 1px solid rgba(74, 222, 128, 0.2); 
                    border-radius: 12px; padding: 18px; text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 4px; animation: rewardBurst 0.6s ease forwards;">✨</div>
                    <div style="font-size: 15px; font-weight: 700; color: #4ade80; margin-bottom: 4px;">心靈已完全充電！</div>
                    <div style="font-size: 11px; color: #a89f91;">你已完成 8 小時的深度休息</div>
                </div>
                <button id="claim-rest-btn" style="
                    width: 100%; padding: 13px;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    border: none; border-radius: 12px; color: #fff;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
                    transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                ">
                    <span>🎁</span> 領取 500 暖陽幣
                </button>
            `;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        const totalMs = 8 * 60 * 60 * 1000;
        const progress = ((totalMs - remaining) / totalMs) * 100;

        return `
            <div style="
                background: rgba(255, 255, 255, 0.02); 
                border-radius: 12px; padding: 16px; 
                border: 1px solid rgba(255,255,255,0.04);
                text-align: center;
            ">
                <div style="font-size: 10px; color: #8a7a5a; margin-bottom: 4px; letter-spacing: 0.5px;">
                    ⏳ 沉澱進度
                </div>
                <div style="
                    width: 100%; height: 4px; 
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 2px; overflow: hidden; margin-bottom: 10px;
                ">
                    <div style="
                        width: ${Math.min(progress, 100)}%; height: 100%;
                        background: linear-gradient(90deg, #eab308 0%, #fde047 100%);
                        border-radius: 2px;
                        transition: width 0.5s ease;
                        box-shadow: 0 0 12px rgba(234, 179, 8, 0.2);
                    "></div>
                </div>
                <div id="rest-countdown-text" style="
                    font-size: 26px; font-weight: 700; 
                    color: #eab308; font-family: monospace; letter-spacing: 2px;
                ">
                    ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
                </div>
                <div style="font-size: 10px; color: #6b635b; margin-top: 6px;">
                    小鎮探索已暫停，好好享受寧靜時光吧 🌙
                </div>
            </div>
            <button disabled style="
                width: 100%; padding: 13px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; 
                color: #6b635b; font-size: 13px; font-weight: 600; cursor: not-allowed;
                display: flex; align-items: center; justify-content: center; gap: 8px;
            ">
                <span>🌙</span> 休息中...
            </button>
        `;
    }

    // ✅ 修正：預覽區完整支援 extraClass 動畫
    private renderWardrobeTabContent(profile: PlayerProfile): string {
        const profileAny = profile as any;
        const unlocked = profileAny.unlockedChatSkins ?? ['default'];
        const equipped = profileAny.equippedChatSkin ?? 'default';

        let skinsHTML = '';
        for (const skinId in CHAT_SKINS) {
            const skin = CHAT_SKINS[skinId];
            if (skin.available === false) continue;

            const isUnlocked = unlocked.includes(skin.id);
            const isEquipped = equipped === skin.id;

            let actionBtnHTML = '';
            if (isEquipped) {
                actionBtnHTML = `
                    <span style="
                        font-size: 10px; font-weight: 600; 
                        color: #4ade80; 
                        background: rgba(34,197,94,0.1); 
                        padding: 4px 12px; border-radius: 6px;
                        border: 1px solid rgba(74, 222, 128, 0.2);
                    ">✦ 使用中</span>
                `;
            } else if (isUnlocked) {
                actionBtnHTML = `
                    <button class="equip-skin-btn" data-skin-id="${skin.id}" style="
                        padding: 4px 14px; 
                        background: rgba(234, 179, 8, 0.1); 
                        border: 1px solid rgba(234, 179, 8, 0.25); 
                        border-radius: 6px; 
                        color: #fde047; 
                        font-size: 11px; font-weight: 600; 
                        cursor: pointer; transition: all 0.2s;
                    ">裝備</button>
                `;
            } else {
                const currencyIcon = skin.currency === 'sunCoins' ? '☀️' : '🌟';
                actionBtnHTML = `
                    <button class="buy-skin-btn" data-skin-id="${skin.id}" style="
                        padding: 4px 14px; 
                        background: rgba(56, 189, 248, 0.08); 
                        border: 1px solid rgba(56, 189, 248, 0.2); 
                        border-radius: 6px; 
                        color: #7dd3fc; 
                        font-size: 11px; font-weight: 600; 
                        cursor: pointer; transition: all 0.2s;
                    ">解鎖 ${currencyIcon} ${skin.price}</button>
                `;
            }

            const cardClass = isEquipped ? 'skin-card equipped' : 'skin-card';

            // ✅ 構建預覽樣式（完整支援 extraClass）
            let previewStyle = skin.bubbleStyle || '';
            if (skin.textStyle) {
                previewStyle += skin.textStyle;
            }
            // 確保預覽框有 position: relative 和 overflow: hidden 來支援偽元素
            if (!previewStyle.includes('position:')) {
                previewStyle += ' position: relative;';
            }
            if (!previewStyle.includes('overflow:')) {
                previewStyle += ' overflow: hidden;';
            }
            // 確保有最小高度讓偽元素有空間顯示
            if (!previewStyle.includes('min-height:')) {
                previewStyle += ' min-height: 36px;';
            }

            // 構建 extraClass 的 class 屬性
            const extraClassAttr = skin.extraClass ? `class="${skin.extraClass}"` : '';

            skinsHTML += `
                <div class="${cardClass}" style="
                    background: rgba(255,255,255,0.02); 
                    border: 1px solid ${isEquipped ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.04)'};
                    border-radius: 12px; padding: 12px 14px; 
                    display: flex; flex-direction: column; gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 13px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 6px;">
                                ${isEquipped ? '✦' : ''} ${skin.name}
                                ${isEquipped ? `<span style="font-size: 8px; color: #4ade80; font-weight: 400;">裝備中</span>` : ''}
                                ${skin.rarity === 'legendary' ? `<span style="font-size: 8px; color: #fbbf24; font-weight: 400; background: rgba(251,191,36,0.15); padding: 1px 6px; border-radius: 4px;">傳說</span>` : ''}
                                ${skin.rarity === 'epic' ? `<span style="font-size: 8px; color: #a78bfa; font-weight: 400; background: rgba(167,139,250,0.15); padding: 1px 6px; border-radius: 4px;">史詩</span>` : ''}
                            </div>
                            <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">${skin.description}</div>
                            ${skin.flavorText ? `<div style="font-size: 9px; color: #6b635b; font-style: italic; margin-top: 2px;">${skin.flavorText}</div>` : ''}
                        </div>
                        <div>${actionBtnHTML}</div>
                    </div>
                    <!-- ✅ 預覽區：完整支援 extraClass + 偽元素動畫 -->
                    <div style="
                        background: rgba(0,0,0,0.2); 
                        padding: 8px 10px; 
                        border-radius: 8px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: flex-start;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div ${extraClassAttr} style="${previewStyle} padding: 6px 12px; border-radius: 10px; font-size: 11px; max-width: 80%;">
                            ✦ 預覽效果 ✦
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="
                font-size: 10px; font-weight: 500; color: #8a7a5a; 
                letter-spacing: 0.8px; text-transform: uppercase;
                margin-bottom: 2px;
            ">💬 對話衣櫥</div>
            <p style="margin: 0; font-size: 12px; color: #a89f91; line-height: 1.6;">
                選擇你的專屬對話框樣式，在鎮民廣場展現獨特風格 ✨
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${skinsHTML}
            </div>
        `;
    }

    private bindActionEvents(restingUntil: number) {
        const startBtn = document.getElementById('start-rest-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                this.showConfirmModal({
                    icon: '🌙',
                    title: '準備好沉澱心靈了嗎？',
                    desc: '點擊確認後將進入 8 小時休息。\n期間「小鎮探索」將暫停（聊天大廳除外）。\n醒來後可領取 500 暖陽幣 ✨',
                    confirmText: '開始沉澱',
                    cancelText: '再想想',
                    onConfirm: () => {
                        this.executeStartRest();
                    }
                });
            };
        }

        const claimBtn = document.getElementById('claim-rest-btn');
        if (claimBtn) {
            claimBtn.onclick = () => {
                this.executeClaimReward();
            };
        }

        const equipBtns = document.querySelectorAll('.equip-skin-btn');
        equipBtns.forEach(btn => {
            (btn as HTMLButtonElement).onclick = async (e) => {
                const skinId = (e.currentTarget as HTMLElement).getAttribute('data-skin-id');
                if (skinId) {
                    await this.executeEquipSkin(skinId);
                }
            };
        });

        const buyBtns = document.querySelectorAll('.buy-skin-btn');
        buyBtns.forEach(btn => {
            (btn as HTMLButtonElement).onclick = async (e) => {
                const skinId = (e.currentTarget as HTMLElement).getAttribute('data-skin-id');
                if (skinId) {
                    await this.executeBuySkin(skinId);
                }
            };
        });
    }

    private bindGlobalEvents() {
        const backBtn = document.getElementById('rest-back-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                this.remove();
                this.onBackToMain();
            };
        }

        const tabRestBtn = document.getElementById('tab-rest-btn');
        const tabWardrobeBtn = document.getElementById('tab-wardrobe-btn');
        if (tabRestBtn && tabWardrobeBtn) {
            tabRestBtn.onclick = () => {
                if (this.activeTab !== 'rest') {
                    this.activeTab = 'rest';
                    this.updateContent();
                }
            };
            tabWardrobeBtn.onclick = () => {
                if (this.activeTab !== 'wardrobe') {
                    this.activeTab = 'wardrobe';
                    this.updateContent();
                }
            };
        }
    }

    private async executeEquipSkin(skinId: string) {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            await savePlayerProfile(this.uid, {
                ...profile,
                equippedChatSkin: skinId
            } as any);

            this.updateContent();
        } catch (error) {
            console.error('裝備外觀失敗:', error);
        }
    }

    private async executeBuySkin(skinId: string) {
        const skin = CHAT_SKINS[skinId];
        if (!skin) return;

        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const profileAny = profile as any;
            const sunCoins = profileAny.sunCoins ?? 100;
            const memorialTokens = profileAny.memorialTokens ?? 10;
            const unlocked = profileAny.unlockedChatSkins ?? ['default'];

            if (skin.currency === 'sunCoins' && sunCoins < skin.price) {
                this.showConfirmModal({
                    icon: '☀️',
                    title: '暖陽幣不足',
                    desc: `解鎖此造型需要 ${skin.price} 暖陽幣\n你目前只有 ${sunCoins} 暖陽幣`,
                    confirmText: '知道了',
                    onConfirm: () => {}
                });
                return;
            }

            if (skin.currency === 'memorialTokens' && memorialTokens < skin.price) {
                this.showConfirmModal({
                    icon: '🌟',
                    title: '紀念章不足',
                    desc: `解鎖此造型需要 ${skin.price} 紀念章\n你目前只有 ${memorialTokens} 紀念章`,
                    confirmText: '知道了',
                    onConfirm: () => {}
                });
                return;
            }

            const newSunCoins = skin.currency === 'sunCoins' ? sunCoins - skin.price : sunCoins;
            const newMemorialTokens = skin.currency === 'memorialTokens' ? memorialTokens - skin.price : memorialTokens;
            const newUnlocked = [...unlocked, skin.id];

            await savePlayerProfile(this.uid, {
                ...profile,
                sunCoins: newSunCoins,
                memorialTokens: newMemorialTokens,
                unlockedChatSkins: newUnlocked,
                equippedChatSkin: skin.id
            } as any);

            this.showConfirmModal({
                icon: '✨',
                title: '解鎖成功！',
                desc: `你已獲得「${skin.name}」對話框 ✨\n已自動裝備完成！`,
                confirmText: '太棒了',
                onConfirm: () => {
                    this.updateContent();
                }
            });
        } catch (error) {
            console.error('購買外觀失敗:', error);
        }
    }

    private showConfirmModal(options: {
        icon: string;
        title: string;
        desc: string;
        confirmText: string;
        cancelText?: string;
        onConfirm: () => void;
    }) {
        const backdrop = document.getElementById('custom-modal-backdrop');
        const iconEl = document.getElementById('modal-icon');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const buttonsEl = document.getElementById('modal-buttons');

        if (!backdrop || !iconEl || !titleEl || !descEl || !buttonsEl) return;

        iconEl.innerText = options.icon;
        titleEl.innerText = options.title;
        descEl.innerText = options.desc;

        if (options.cancelText) {
            buttonsEl.innerHTML = `
                <button id="modal-cancel-btn" style="
                    flex: 1; padding: 10px; background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; color: #a89f91;
                    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                ">${options.cancelText}</button>
                <button id="modal-confirm-btn" style="
                    flex: 1; padding: 10px; background: rgba(234, 179, 8, 0.15);
                    border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 10px; color: #fde047;
                    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                ">${options.confirmText}</button>
            `;

            document.getElementById('modal-cancel-btn')!.onclick = () => {
                backdrop.style.display = 'none';
            };
        } else {
            buttonsEl.innerHTML = `
                <button id="modal-confirm-btn" style="
                    width: 100%; padding: 10px; background: rgba(234, 179, 8, 0.15);
                    border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 10px; color: #fde047;
                    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                ">${options.confirmText}</button>
            `;
        }

        document.getElementById('modal-confirm-btn')!.onclick = () => {
            backdrop.style.display = 'none';
            options.onConfirm();
        };

        backdrop.style.display = 'flex';
    }

    private async executeStartRest() {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const restingUntilTime = Date.now() + 8 * 60 * 60 * 1000;

            await savePlayerProfile(this.uid, {
                ...profile,
                restingUntil: new Date(restingUntilTime).toISOString()
            } as any);

            this.updateContent();
        } catch (error) {
            console.error('開始休息失敗:', error);
        }
    }

    private async executeClaimReward() {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const profileAny = profile as any;
            const currentCoins = profileAny.sunCoins ?? 100;

            await savePlayerProfile(this.uid, {
                ...profile,
                sunCoins: currentCoins + 500,
                restingUntil: null
            } as any);

            this.showConfirmModal({
                icon: '✨',
                title: '🎉 領取成功！',
                desc: '你已獲得 500 暖陽幣 ✨\n心靈沉澱完成，繼續你的旅程吧！',
                confirmText: '太棒了',
                onConfirm: () => {
                    this.updateContent();
                }
            });
        } catch (error) {
            console.error('領取獎勵失敗:', error);
        }
    }

    private startCountdown(restingUntil: number) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            const remaining = Math.max(0, restingUntil - Date.now());
            const textEl = document.getElementById('rest-countdown-text');

            if (remaining === 0) {
                clearInterval(this.timerInterval);
                this.updateContent();
                return;
            }

            if (textEl) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                textEl.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    public remove() {
        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.container) {
            this.container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            this.container.style.opacity = '0';
            this.container.style.transform = 'scale(0.97)';
        }
        if (this.modalBackdrop) {
            this.modalBackdrop.style.transition = 'opacity 0.2s ease';
            this.modalBackdrop.style.opacity = '0';
        }

        setTimeout(() => {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            if (this.modalBackdrop) {
                this.modalBackdrop.remove();
                this.modalBackdrop = null;
            }
        }, 250);
    }
}