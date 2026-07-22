import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ITEM_DATABASE } from '../config/itemRegistry';

interface ForestEvent {
    id: string;
    name: string;
    icon: string;
    description: string;
    rewards: { itemId?: string; count?: number; sunCoins?: number; memorialTokens?: number }[];
    isSuccess: boolean;
}

export class ForestExplorerUI {
    private uid: string;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;
    private remainingExplores: number = 5;
    private currentProfile: any = null;
    private isExploring: boolean = false;
    private exploreHistory: string[] = [];

    constructor(uid: string, onClose: () => void) {
        this.uid = uid;
        this.onClose = onClose;
        this.loadPlayerData();
        this.injectGlobalStyles();
        this.render();
    }

    private async loadPlayerData() {
        try {
            const playerRef = doc(db, 'players', this.uid);
            const snapshot = await getDoc(playerRef);
            if (snapshot.exists()) {
                this.currentProfile = snapshot.data();
                this.currentProfile.uid = this.uid;
            }
        } catch (error) {
            console.error('載入玩家資料失敗:', error);
        }
    }

    private injectGlobalStyles() {
        if (!document.getElementById('forest-styles')) {
            const style = document.createElement('style');
            style.id = 'forest-styles';
            style.innerHTML = `
                @keyframes forestPopIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes forestFog {
                    0% { opacity: 0.3; transform: translateX(0) scale(1); }
                    50% { opacity: 0.8; transform: translateX(30px) scale(1.05); }
                    100% { opacity: 0.3; transform: translateX(0) scale(1); }
                }
                @keyframes forestFog2 {
                    0% { opacity: 0.2; transform: translateX(0) scale(1); }
                    50% { opacity: 0.6; transform: translateX(-20px) scale(1.08); }
                    100% { opacity: 0.2; transform: translateX(0) scale(1); }
                }
                @keyframes eventReveal {
                    0% { opacity: 0; transform: scale(0.85) rotate(-3deg); }
                    50% { opacity: 1; transform: scale(1.03) rotate(1deg); }
                    100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes leafFall {
                    0% { transform: translateY(-10px) rotate(0deg) scale(0.5); opacity: 0; }
                    50% { opacity: 1; transform: translateY(10px) rotate(180deg) scale(1); }
                    100% { transform: translateY(30px) rotate(360deg) scale(0.5); opacity: 0; }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.1); }
                    50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.25); }
                }
                @keyframes toastFadeInTop {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes toastFadeOutTop {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -15px); }
                }
                .forest-explore-btn {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .forest-explore-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 25px rgba(52, 211, 153, 0.25);
                }
                .forest-explore-btn:active {
                    transform: translateY(0) scale(0.97);
                }
                .forest-event-card {
                    animation: eventReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .forest-fog {
                    animation: forestFog 8s ease-in-out infinite;
                }
                .forest-fog-2 {
                    animation: forestFog2 10s ease-in-out infinite;
                }
                .explore-counter {
                    animation: pulseGlow 2s ease-in-out infinite;
                }

                .forest-explore-btn.loading {
                    pointer-events: none;
                    opacity: 0.7;
                }
                .forest-explore-btn.loading::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top-color: #34d399;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    transform: translate(-50%, -50%);
                }
                @keyframes spin {
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                .forest-leaf {
                    position: fixed;
                    font-size: 18px;
                    pointer-events: none;
                    z-index: 999;
                    animation: leafFall 2.5s ease-in forwards;
                }

                .forest-continue-btn {
                    transition: all 0.2s ease;
                }
                .forest-continue-btn:hover {
                    background: rgba(52, 211, 153, 0.15) !important;
                    transform: translateY(-1px);
                }
                .forest-continue-btn:active {
                    transform: translateY(0) scale(0.97);
                }

                @media (max-width: 480px) {
                    .forest-modal-container {
                        max-width: 100% !important;
                        height: 94dvh !important;
                        max-height: none !important;
                        border-radius: 20px 20px 0 0 !important;
                        position: absolute !important;
                        bottom: 0 !important;
                        margin: 0 !important;
                    }
                    .forest-overlay-wrapper {
                        align-items: flex-end !important;
                        padding: 0 !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    private createLeafEffect() {
        const leaves = ['🍃', '🌿', '🍂', '🌱'];
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const leaf = document.createElement('div');
                leaf.className = 'forest-leaf';
                leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
                leaf.style.left = (10 + Math.random() * 80) + '%';
                leaf.style.top = '-10px';
                leaf.style.fontSize = (14 + Math.random() * 16) + 'px';
                leaf.style.animationDuration = (2 + Math.random() * 2) + 's';
                leaf.style.opacity = '0.4 + Math.random() * 0.4';
                document.body.appendChild(leaf);
                setTimeout(() => leaf.remove(), 4000);
            }, i * 300);
        }
    }

    // ✅ 更新右上角探索次數
    private updateCounter() {
        const counter = document.querySelector('.explore-counter strong');
        if (counter) {
            counter.textContent = String(this.remainingExplores);
        }
    }

    private render() {
        this.removeOverlay();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.className = 'forest-overlay-wrapper';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(14, 12, 10, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 0;
            box-sizing: border-box;
        `;

        this.overlayContainer.innerHTML = `
            <div class="forest-modal-container" style="
                background: rgba(28, 23, 20, 0.95);
                backdrop-filter: blur(12px);
                border: none;
                border-radius: 0;
                width: 100vw;
                max-width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                display: flex;
                flex-direction: column;
                animation: forestPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
            ">
                <div style="
                    position: relative;
                    height: clamp(130px, 20vh, 160px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 70%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/ForestUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="forest-btn-close" style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(52, 211, 153, 0.2); color: #34d399;
                            padding: 5px 14px; border-radius: 20px; cursor: pointer;
                            font-size: 11px; font-weight: 600; transition: all 0.2s;
                            display: flex; align-items: center; gap: 4px;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">⬅ 離開森林</button>

                        <div class="explore-counter" style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            padding: 3px 14px;
                            border-radius: 16px;
                            border: 1px solid rgba(52, 211, 153, 0.25);
                            font-size: 11px;
                            font-weight: 600;
                            color: #34d399;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center; gap: 6px;
                        ">
                            <span>🌲</span>
                            <span>探索次數: <strong style="font-size: 15px;">${this.remainingExplores}</strong></span>
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 500; color: #34d399; letter-spacing: 1.2px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            WHISPERS OF THE FOREST
                        </div>
                        <div style="font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 8px;">
                            🌲 呢喃迷霧森林
                            <span style="font-size: 10px; font-weight: 300; color: #8a7a5a; text-shadow: none;">· 探索未知</span>
                        </div>
                    </div>

                    <div class="forest-fog" style="
                        position: absolute; bottom: 0; left: -20%; right: -20%; height: 60px;
                        background: linear-gradient(180deg, transparent 0%, rgba(52, 211, 153, 0.04) 50%, rgba(52, 211, 153, 0.08) 100%);
                        pointer-events: none; border-radius: 50%;
                        filter: blur(20px);
                    "></div>
                    <div class="forest-fog-2" style="
                        position: absolute; bottom: 10px; left: -30%; right: -30%; height: 40px;
                        background: linear-gradient(180deg, transparent 0%, rgba(52, 211, 153, 0.03) 50%, rgba(52, 211, 153, 0.06) 100%);
                        pointer-events: none; border-radius: 50%;
                        filter: blur(30px);
                    "></div>
                </div>

                <div id="forest-content-area" style="
                    flex: 1; padding: 16px 18px; overflow-y: auto; display: flex;
                    flex-direction: column; gap: 12px; background: rgba(20, 16, 13, 0.6);
                ">
                    ${this.renderContent()}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
        setTimeout(() => this.createLeafEffect(), 300);
    }

    private renderContent(): string {
        // ✅ 如果探索次數為 0，顯示結束畫面
        if (this.remainingExplores === 0) {
            const totalRewards = this.calculateTotalRewards();
            return `
                <div style="
                    flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
                    text-align: center; gap: 14px;
                ">
                    <div style="font-size: 56px; animation: eventReveal 0.6s ease forwards;">🌲</div>
                    <div style="font-size: 20px; font-weight: 700; color: #fff;">今日探索已結束</div>
                    <div style="font-size: 13px; color: #a89f91; line-height: 1.8; max-width: 320px;">
                        你已經探索了迷霧森林的所有角落。<br>
                        帶著滿滿的收穫，準備返回小鎮吧！
                    </div>
                    <div style="
                        background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px 16px;
                        width: 100%; text-align: left;
                        border: 1px solid rgba(52, 211, 153, 0.06);
                        max-height: 220px; overflow-y: auto;
                    ">
                        <div style="font-weight: 600; color: #34d399; margin-bottom: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            📜 探索紀錄
                            <span style="font-size: 10px; color: #6b635b; font-weight: 400;">（共 ${this.exploreHistory.length} 次）</span>
                        </div>
                        ${this.exploreHistory.map((h, index) => `
                            <div style="
                                padding: 3px 0; 
                                border-bottom: 1px solid rgba(255,255,255,0.03);
                                font-size: 11px; color: ${index === this.exploreHistory.length - 1 ? '#d4c9b8' : '#8a7a5a'};
                                display: flex; align-items: center; gap: 4px;
                                ${index === this.exploreHistory.length - 1 ? 'font-weight: 500;' : ''}
                            ">
                                ${index === this.exploreHistory.length - 1 ? '🔄 ' : '  '}${h}
                            </div>
                        `).join('')}
                        ${totalRewards.length > 0 ? `
                            <div style="
                                margin-top: 10px; padding-top: 8px;
                                border-top: 1px solid rgba(52, 211, 153, 0.1);
                            ">
                                <div style="font-size: 10px; color: #8a7a5a; margin-bottom: 4px;">🎁 本次探索總收穫</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    ${totalRewards.map(r => `
                                        <span style="
                                            background: rgba(52, 211, 153, 0.06);
                                            border: 1px solid rgba(52, 211, 153, 0.08);
                                            border-radius: 6px; padding: 2px 10px;
                                            font-size: 10px; color: #d4c9b8;
                                        ">${r}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <button id="forest-btn-leave" style="
                        width: 100%; padding: 13px;
                        background: linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
                        border: 1px solid rgba(52, 211, 153, 0.25);
                        border-radius: 12px; color: #34d399;
                        font-size: 13px; font-weight: 600; cursor: pointer;
                        transition: all 0.2s;
                    ">🚪 返回小鎮</button>
                </div>
            `;
        }

        // ✅ 還有探索次數時顯示主畫面
        return `
            <div style="
                text-align: center; padding: 4px 0 2px 0;
                font-size: 12px; color: #6b635b; letter-spacing: 0.8px;
            ">
                ✦ 輕觸下方按鈕探索迷霧森林 ✦
            </div>
            <button id="forest-btn-explore" class="forest-explore-btn" style="
                width: 100%; padding: 16px;
                background: linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%);
                border: 1px solid rgba(52, 211, 153, 0.25);
                border-radius: 14px; color: #34d399;
                font-size: 16px; font-weight: 700; cursor: pointer;
                transition: all 0.3s ease;
                display: flex; align-items: center; justify-content: center; gap: 10px;
                position: relative;
            ">
                <span>🌲</span> 探索森林深處
                <span style="font-size: 12px; font-weight: 400; opacity: 0.6; background: rgba(52,211,153,0.05); padding: 0 10px; border-radius: 10px;">
                    剩餘 ${this.remainingExplores} 次
                </span>
            </button>

            ${this.exploreHistory.length > 0 ? `
                <div style="
                    background: rgba(0,0,0,0.15); border-radius: 10px; padding: 10px 12px;
                    max-height: 160px; overflow-y: auto;
                    border: 1px solid rgba(255,255,255,0.02);
                ">
                    <div style="font-size: 10px; color: #6b635b; margin-bottom: 4px; letter-spacing: 0.5px;">📜 探索紀錄</div>
                    ${this.exploreHistory.map(h => `
                        <div style="font-size: 11px; color: #a89f91; padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
                            ${h}
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="
                    text-align: center; color: #6b635b; font-size: 11px; padding: 12px 0;
                    letter-spacing: 0.5px; font-style: italic;
                ">
                    🌿 迷霧深處藏著未知的驚喜...
                </div>
            `}
        `;
    }

    private calculateTotalRewards(): string[] {
        const rewards: { [key: string]: number } = {};
        for (const record of this.exploreHistory) {
            const coinMatch = record.match(/☀️ 獲得 (\d+) 暖陽幣/);
            if (coinMatch) {
                const amount = parseInt(coinMatch[1]);
                rewards['☀️ 暖陽幣'] = (rewards['☀️ 暖陽幣'] || 0) + amount;
            }
            const tokenMatch = record.match(/🌟 獲得 (\d+) 紀念章/);
            if (tokenMatch) {
                const amount = parseInt(tokenMatch[1]);
                rewards['🌟 紀念章'] = (rewards['🌟 紀念章'] || 0) + amount;
            }
            for (const itemId in ITEM_DATABASE) {
                const item = ITEM_DATABASE[itemId];
                const pattern = new RegExp(`獲得 ${item.name} x(\\d+)`);
                const match = record.match(pattern);
                if (match) {
                    const count = parseInt(match[1]);
                    const key = `${item.icon} ${item.name}`;
                    rewards[key] = (rewards[key] || 0) + count;
                }
            }
        }
        const result: string[] = [];
        for (const [key, count] of Object.entries(rewards)) {
            if (count > 0) {
                result.push(`${key} x${count}`);
            }
        }
        return result;
    }

    private bindEvents() {
        const closeBtn = document.getElementById('forest-btn-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.handleClose();
        }

        const leaveBtn = document.getElementById('forest-btn-leave');
        if (leaveBtn) {
            leaveBtn.onclick = () => this.handleClose();
        }

        const exploreBtn = document.getElementById('forest-btn-explore');
        if (exploreBtn) {
            exploreBtn.onclick = () => this.handleExplore();
        }
    }

    // ✅ 直接進行探索（不回到主畫面）
    private async doExplore() {
        if (this.isExploring || this.remainingExplores <= 0) return;
        this.isExploring = true;

        // 顯示載入狀態
        const btn = document.getElementById('forest-btn-explore');
        if (btn) {
            btn.classList.add('loading');
            btn.textContent = '🌿 探索中...';
        }

        // ✅ 更新右上角次數（探索開始時就先減1並更新）
        this.remainingExplores -= 1;
        this.updateCounter();

        this.createLeafEffect();
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

        const event = this.generateEvent();
        await this.applyRewards(event);

        let historyText = `${event.icon} ${event.name}：${event.description}`;
        if (event.isSuccess && event.rewards.length > 0) {
            const rewardTexts = event.rewards.map(r => {
                if (r.sunCoins) return `☀️ 獲得 ${r.sunCoins} 暖陽幣`;
                if (r.memorialTokens) return `🌟 獲得 ${r.memorialTokens} 紀念章`;
                if (r.itemId) {
                    const item = ITEM_DATABASE[r.itemId];
                    return `獲得 ${item?.name || r.itemId} x${r.count || 1}`;
                }
                return '';
            }).filter(t => t).join('、');
            if (rewardTexts) {
                historyText += `（${rewardTexts}）`;
            }
        }
        this.exploreHistory.push(historyText);

        const contentArea = document.getElementById('forest-content-area');
        if (contentArea) {
            // ✅ 如果還有剩餘次數，顯示結果 + 繼續探索按鈕（直接觸發下一次探索）
            if (this.remainingExplores > 0) {
                contentArea.innerHTML = `
                    <div class="forest-event-card" style="
                        flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
                        text-align: center; gap: 12px; padding: 10px;
                    ">
                        <div style="font-size: 56px;">${event.icon}</div>
                        <div style="font-size: 20px; font-weight: 700; color: #fff;">
                            ${event.isSuccess ? '✨' : '🌫️'} ${event.name}
                        </div>
                        <div style="font-size: 13px; color: #a89f91; line-height: 1.6; max-width: 300px;">
                            ${event.description}
                        </div>
                        ${event.isSuccess && event.rewards.length > 0 ? `
                            <div style="
                                background: rgba(52, 211, 153, 0.06);
                                border: 1px solid rgba(52, 211, 153, 0.1);
                                border-radius: 10px; padding: 10px 16px; width: 100%;
                            ">
                                ${event.rewards.map(r => {
                                    if (r.sunCoins) return `<div style="color: #fde047;">☀️ 獲得 ${r.sunCoins} 暖陽幣</div>`;
                                    if (r.memorialTokens) return `<div style="color: #d8b4fe;">🌟 獲得 ${r.memorialTokens} 紀念章</div>`;
                                    if (r.itemId) {
                                        const item = ITEM_DATABASE[r.itemId];
                                        return `<div style="color: #34d399;">🎁 獲得 ${item?.name || r.itemId} x${r.count || 1}</div>`;
                                    }
                                    return '';
                                }).join('')}
                            </div>
                        ` : ''}
                        <button id="forest-btn-continue" class="forest-continue-btn" style="
                            width: 100%; padding: 12px;
                            background: rgba(52, 211, 153, 0.08);
                            border: 1px solid rgba(52, 211, 153, 0.15);
                            border-radius: 12px; color: #34d399;
                            font-size: 14px; font-weight: 600; cursor: pointer;
                            transition: all 0.2s;
                        ">
                            🌲 繼續探索 (剩餘 ${this.remainingExplores} 次)
                        </button>
                    </div>
                `;
                const continueBtn = document.getElementById('forest-btn-continue');
                if (continueBtn) {
                    continueBtn.onclick = () => {
                        // ✅ 直接進行下一次探索，不需回到主畫面
                        this.doExplore();
                    };
                }
            } else {
                // ✅ 所有探索完成，顯示結束畫面
                const totalRewards = this.calculateTotalRewards();
                contentArea.innerHTML = `
                    <div style="
                        flex: 1; display: flex; flex-direction: column;
                        text-align: center; gap: 12px; padding: 10px;
                        overflow-y: auto;
                    ">
                        <div class="forest-event-card" style="
                            display: flex; flex-direction: column; align-items: center; gap: 8px;
                            padding: 16px; background: rgba(52, 211, 153, 0.04);
                            border-radius: 14px; border: 1px solid rgba(52, 211, 153, 0.08);
                        ">
                            <div style="font-size: 44px;">${event.icon}</div>
                            <div style="font-size: 18px; font-weight: 700; color: #fff;">
                                ${event.isSuccess ? '✨' : '🌫️'} ${event.name}
                            </div>
                            <div style="font-size: 12px; color: #a89f91; line-height: 1.5;">
                                ${event.description}
                            </div>
                            ${event.isSuccess && event.rewards.length > 0 ? `
                                <div style="
                                    background: rgba(52, 211, 153, 0.06);
                                    border: 1px solid rgba(52, 211, 153, 0.1);
                                    border-radius: 8px; padding: 8px 14px; width: 100%;
                                ">
                                    ${event.rewards.map(r => {
                                        if (r.sunCoins) return `<div style="color: #fde047; font-size: 12px;">☀️ 獲得 ${r.sunCoins} 暖陽幣</div>`;
                                        if (r.memorialTokens) return `<div style="color: #d8b4fe; font-size: 12px;">🌟 獲得 ${r.memorialTokens} 紀念章</div>`;
                                        if (r.itemId) {
                                            const item = ITEM_DATABASE[r.itemId];
                                            return `<div style="color: #34d399; font-size: 12px;">🎁 獲得 ${item?.name || r.itemId} x${r.count || 1}</div>`;
                                        }
                                        return '';
                                    }).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div style="
                            background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px 14px;
                            text-align: left; border: 1px solid rgba(52, 211, 153, 0.06);
                            max-height: 200px; overflow-y: auto;
                        ">
                            <div style="font-weight: 600; color: #34d399; margin-bottom: 6px; font-size: 11px; display: flex; align-items: center; gap: 6px;">
                                📜 探索紀錄
                                <span style="font-size: 10px; color: #6b635b; font-weight: 400;">（共 ${this.exploreHistory.length} 次）</span>
                            </div>
                            ${this.exploreHistory.map((h, index) => `
                                <div style="
                                    padding: 2px 0; 
                                    border-bottom: 1px solid rgba(255,255,255,0.02);
                                    font-size: 10px; color: ${index === this.exploreHistory.length - 1 ? '#d4c9b8' : '#8a7a5a'};
                                    display: flex; align-items: center; gap: 4px;
                                    ${index === this.exploreHistory.length - 1 ? 'font-weight: 500;' : ''}
                                ">
                                    ${index === this.exploreHistory.length - 1 ? '🔄 ' : '  '}${h}
                                </div>
                            `).join('')}
                            ${totalRewards.length > 0 ? `
                                <div style="
                                    margin-top: 8px; padding-top: 6px;
                                    border-top: 1px solid rgba(52, 211, 153, 0.1);
                                ">
                                    <div style="font-size: 9px; color: #8a7a5a; margin-bottom: 4px;">🎁 本次探索總收穫</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                        ${totalRewards.map(r => `
                                            <span style="
                                                background: rgba(52, 211, 153, 0.06);
                                                border: 1px solid rgba(52, 211, 153, 0.08);
                                                border-radius: 4px; padding: 2px 10px;
                                                font-size: 9px; color: #d4c9b8;
                                            ">${r}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <button id="forest-btn-leave" style="
                            width: 100%; padding: 13px;
                            background: linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
                            border: 1px solid rgba(52, 211, 153, 0.25);
                            border-radius: 12px; color: #34d399;
                            font-size: 14px; font-weight: 600; cursor: pointer;
                            transition: all 0.2s;
                        ">🚪 返回小鎮</button>
                    </div>
                `;
                const leaveBtn = document.getElementById('forest-btn-leave');
                if (leaveBtn) {
                    leaveBtn.onclick = () => this.handleClose();
                }
            }
        }

        this.isExploring = false;
    }

    private async handleExplore() {
        // ✅ 直接呼叫 doExplore
        await this.doExplore();
    }

    private generateEvent(): ForestEvent {
        const roll = Math.random() * 100;

        if (roll < 25) {
            const herbOptions = [
                { itemId: 'item_28', count: 1 + Math.floor(Math.random() * 2) },
                { itemId: 'item_31', count: 1 },
                { itemId: 'item_26', count: 1 + Math.floor(Math.random() * 2) },
                { itemId: 'item_33', count: 1 },
                { itemId: 'item_38', count: 1 + Math.floor(Math.random() * 2) },
            ];
            const selected = herbOptions[Math.floor(Math.random() * herbOptions.length)];
            const herbNames: { [key: string]: string } = {
                'item_28': '乾燥薰衣草束',
                'item_31': '晨曦露珠瓶',
                'item_26': '神祕樹果',
                'item_33': '海風貝殼',
                'item_38': '夏日向日葵種子'
            };
            return {
                id: 'herbs',
                name: '發現藥草',
                icon: '🌿',
                description: `在樹蔭下發現了散發清香的${herbNames[selected.itemId] || '藥草'}，小心翼翼地採集起來。`,
                rewards: [selected],
                isSuccess: true
            };
        }

        if (roll < 45) {
            const mushroomCount = 1 + Math.floor(Math.random() * 2);
            return {
                id: 'mushroom',
                name: '採集蘑菇',
                icon: '🍄',
                description: '在潮濕的樹根旁發現了一叢螢光小蘑菇，散發著柔和的光芒。',
                rewards: [{ itemId: 'item_30', count: mushroomCount }],
                isSuccess: true
            };
        }

        if (roll < 60) {
            const coinAmount = 5 + Math.floor(Math.random() * 11);
            return {
                id: 'chest',
                name: '發現寶箱',
                icon: '💎',
                description: '在藤蔓覆蓋的樹洞中發現了一個古老的寶箱！',
                rewards: [{ sunCoins: coinAmount }],
                isSuccess: true
            };
        }

        if (roll < 65) {
            const tokenAmount = 1 + Math.floor(Math.random() * 3);
            return {
                id: 'spirit',
                name: '遇見森林精靈',
                icon: '🦌',
                description: '一道柔和的光芒閃過，一隻優雅的森林精靈出現在你面前，賜予你祝福。',
                rewards: [{ memorialTokens: tokenAmount }],
                isSuccess: true
            };
        }

        if (roll < 75) {
            const relicOptions = [
                { itemId: 'item_41', count: 1 },
                { itemId: 'item_43', count: 1 },
                { itemId: 'item_42', count: 1 },
                { itemId: 'item_44', count: 1 },
                { itemId: 'item_49', count: 1 + Math.floor(Math.random() * 2) },
            ];
            const selected = relicOptions[Math.floor(Math.random() * relicOptions.length)];
            const relicNames: { [key: string]: string } = {
                'item_41': '記憶拼圖碎片',
                'item_43': '泛黃的舊地圖',
                'item_42': '舊時代的火車票',
                'item_44': '黃銅鑰匙',
                'item_49': '詩集殘頁'
            };
            return {
                id: 'ruins',
                name: '發現古老遺跡',
                icon: '📜',
                description: `撥開厚重的藤蔓，一座被遺忘的古老石碑出現在眼前，你發現了${relicNames[selected.itemId] || '古老遺物'}。`,
                rewards: [selected],
                isSuccess: true
            };
        }

        if (roll < 85) {
            const specialOptions = [
                { itemId: 'item_25', count: 1 },
                { itemId: 'item_32', count: 1 },
                { itemId: 'item_45', count: 1 },
                { itemId: 'item_50', count: 1 },
                { itemId: 'item_47', count: 1 + Math.floor(Math.random() * 2) },
            ];
            const selected = specialOptions[Math.floor(Math.random() * specialOptions.length)];
            const specialNames: { [key: string]: string } = {
                'item_25': '祈願星砂',
                'item_32': '四葉幸運草',
                'item_45': '流星許願御守',
                'item_50': '太陽光芒結晶',
                'item_47': '彩色玻璃彈珠'
            };
            return {
                id: 'special',
                name: '發現稀有材料',
                icon: '✨',
                description: `在森林深處的隱秘角落，你發現了閃耀著微光的${specialNames[selected.itemId] || '稀有材料'}！`,
                rewards: [selected],
                isSuccess: true
            };
        }

        return {
            id: 'lost',
            name: '迷霧迷失',
            icon: '🌫️',
            description: '濃霧突然襲來，你迷失了方向，花費了許多時間才找到路...',
            rewards: [],
            isSuccess: false
        };
    }

    private async applyRewards(event: ForestEvent) {
        if (!event.isSuccess || event.rewards.length === 0) return;

        try {
            const playerRef = doc(db, 'players', this.uid);
            const snapshot = await getDoc(playerRef);
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            const inventory = data.inventory || [];
            let sunCoins = data.sunCoins || 100;
            let memorialTokens = data.memorialTokens || 10;

            for (const reward of event.rewards) {
                if (reward.sunCoins) {
                    sunCoins += reward.sunCoins;
                }
                if (reward.memorialTokens) {
                    memorialTokens += reward.memorialTokens;
                }
                if (reward.itemId) {
                    const existing = inventory.find((i: any) => i.id === reward.itemId);
                    if (existing) {
                        existing.count = (existing.count || 1) + (reward.count || 1);
                    } else {
                        inventory.push({ id: reward.itemId, count: reward.count || 1 });
                    }
                }
            }

            await updateDoc(playerRef, {
                inventory: inventory,
                sunCoins: sunCoins,
                memorialTokens: memorialTokens
            });

        } catch (error) {
            console.error('發放獎勵失敗:', error);
        }
    }

    private showToast(message: string) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(28, 23, 20, 0.95);
            border: 2px solid rgba(52, 211, 153, 0.3);
            color: #f3f0ea; padding: 14px 24px; border-radius: 14px;
            font-size: 13px; font-weight: 500; text-align: center;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
            z-index: 9999; backdrop-filter: blur(12px);
            max-width: 80vw; box-sizing: border-box;
            line-height: 1.6;
            animation: toastFadeInTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            white-space: pre-line;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    private handleClose() {
        this.remove();
        this.onClose();
    }

    private removeOverlay() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }

    public remove() {
        this.removeOverlay();
        this.onClose();
    }
}