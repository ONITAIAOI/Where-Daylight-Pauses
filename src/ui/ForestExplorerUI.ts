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
    private canvasElement: HTMLCanvasElement | null = null;
    private canvasCtx: CanvasRenderingContext2D | null = null;
    private explorationProgress: number = 0;
    private animationFrame: number | null = null;
    private isAnimating: boolean = false;

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
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes forestFog {
                    0% { opacity: 0.2; transform: translateX(0) scale(1); }
                    50% { opacity: 0.5; transform: translateX(40px) scale(1.05); }
                    100% { opacity: 0.2; transform: translateX(0) scale(1); }
                }
                @keyframes forestFog2 {
                    0% { opacity: 0.15; transform: translateX(0) scale(1); }
                    50% { opacity: 0.4; transform: translateX(-30px) scale(1.08); }
                    100% { opacity: 0.15; transform: translateX(0) scale(1); }
                }
                @keyframes forestFog3 {
                    0% { opacity: 0.1; transform: translateX(0) scale(1); }
                    50% { opacity: 0.3; transform: translateX(50px) scale(1.03); }
                    100% { opacity: 0.1; transform: translateX(0) scale(1); }
                }
                @keyframes eventReveal {
                    0% { opacity: 0; transform: scale(0.92) rotate(-2deg); }
                    50% { opacity: 1; transform: scale(1.02) rotate(1deg); }
                    100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes lightRay {
                    0% { opacity: 0; transform: translateX(-30px) scaleX(0.5); }
                    50% { opacity: 0.15; transform: translateX(0) scaleX(1); }
                    100% { opacity: 0; transform: translateX(30px) scaleX(0.5); }
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
                @keyframes leafFloat {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-60px) rotate(360deg) scale(0.5); opacity: 0; }
                }
                @keyframes spin {
                    to { transform: translate(-50%, -50%) rotate(360deg); }
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

                .forest-event-card {
                    animation: eventReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .forest-continue-btn {
                    transition: all 0.2s ease;
                }
                .forest-continue-btn:hover {
                    background: rgba(52, 211, 153, 0.15) !important;
                    transform: translateY(-1px);
                }

                .light-ray {
                    position: absolute;
                    top: -20%;
                    width: 2px;
                    height: 60%;
                    background: linear-gradient(180deg, 
                        rgba(52, 211, 153, 0.15) 0%, 
                        rgba(52, 211, 153, 0.02) 100%
                    );
                    transform: skewX(-10deg);
                    animation: lightRay 4s ease-in-out infinite;
                    pointer-events: none;
                    filter: blur(2px);
                }
                .light-ray:nth-child(1) { left: 15%; animation-delay: 0s; }
                .light-ray:nth-child(2) { left: 35%; animation-delay: 1.2s; width: 3px; }
                .light-ray:nth-child(3) { left: 55%; animation-delay: 2.5s; }
                .light-ray:nth-child(4) { left: 75%; animation-delay: 0.8s; width: 1px; }

                .explore-counter {
                    animation: pulseGlow 2s ease-in-out infinite;
                }

                .forest-path-canvas {
                    width: 100%;
                    height: 120px;
                    border-radius: 12px;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(52, 211, 153, 0.04);
                }

                .leaf-particle {
                    position: fixed;
                    pointer-events: none;
                    z-index: 999;
                    animation: leafFloat 4s ease-in forwards;
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
                    .forest-path-canvas {
                        height: 80px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    private initCanvas() {
        this.canvasElement = document.getElementById('forest-path') as HTMLCanvasElement;
        if (this.canvasElement) {
            const rect = this.canvasElement.getBoundingClientRect();
            this.canvasElement.width = rect.width || 500;
            this.canvasElement.height = rect.height || 120;
            this.canvasCtx = this.canvasElement.getContext('2d');
            this.drawPath();
        }
    }

    private drawPath() {
        const canvas = this.canvasElement;
        const ctx = this.canvasCtx;
        if (!canvas || !ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const startX = 40;
        const startY = h - 30;
        const endX = w - 40;
        const endY = 30;

        const points: { x: number; y: number }[] = [];
        const segments = 30;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const wave = Math.sin(t * Math.PI * 2.5) * 20 + Math.sin(t * Math.PI * 5) * 8;
            const y = startY + (endY - startY) * t + wave * (1 - t * 0.5);
            points.push({ x, y });
        }

        // 路徑（發光虛線）
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 路徑光暈
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.04)';
        ctx.lineWidth = 12;
        ctx.stroke();

        // 樹木（沿路徑）
        for (let i = 0; i < points.length; i += 3) {
            const p = points[i];
            const t = i / points.length;
            const side = (i % 2 === 0) ? 1 : -1;
            const offset = 15 + Math.sin(i * 0.5) * 8;

            ctx.fillStyle = 'rgba(60, 40, 30, 0.2)';
            ctx.fillRect(p.x + side * offset - 1, p.y - 8, 2, 8);

            ctx.beginPath();
            ctx.moveTo(p.x + side * offset, p.y - 18);
            ctx.lineTo(p.x + side * offset - 8, p.y - 5);
            ctx.lineTo(p.x + side * offset + 8, p.y - 5);
            ctx.closePath();
            const isReached = t < this.explorationProgress;
            ctx.fillStyle = isReached ? 
                'rgba(52, 211, 153, 0.12)' : 
                'rgba(255, 255, 255, 0.03)';
            ctx.fill();
        }

        // 探索光點
        const progressIndex = Math.floor(this.explorationProgress * points.length);
        const currentPoint = points[Math.min(progressIndex, points.length - 1)];

        // 光暈
        const gradient = ctx.createRadialGradient(
            currentPoint.x, currentPoint.y, 2,
            currentPoint.x, currentPoint.y, 20
        );
        gradient.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
        gradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.12)');
        gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // 光點本體
        ctx.shadowColor = 'rgba(52, 211, 153, 0.4)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // 起點
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌲', startX, startY + 20);

        // 終點
        if (this.explorationProgress >= 1) {
            const grad = ctx.createRadialGradient(endX, endY, 2, endX, endY, 25);
            grad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
            grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(endX, endY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨', endX, endY + 4);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.arc(endX, endY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌫️', endX, endY + 18);
        }

        // 進度標記
        const totalSteps = 5;
        for (let i = 0; i < totalSteps; i++) {
            const t = (i + 1) / (totalSteps + 1);
            const idx = Math.floor(t * points.length);
            if (idx < points.length) {
                const p = points[idx];
                const isReached = this.explorationProgress >= t;
                ctx.fillStyle = isReached ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                if (isReached) {
                    ctx.strokeStyle = 'rgba(52, 211, 153, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }

    private createLeafEffect() {
        const leaves = ['🍃', '🌿', '🍂', '🌱'];
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const leaf = document.createElement('div');
                leaf.className = 'leaf-particle';
                leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
                leaf.style.left = (10 + Math.random() * 80) + '%';
                leaf.style.top = (20 + Math.random() * 30) + '%';
                leaf.style.fontSize = (14 + Math.random() * 16) + 'px';
                leaf.style.animationDuration = (2.5 + Math.random() * 2) + 's';
                document.body.appendChild(leaf);
                setTimeout(() => leaf.remove(), 4500);
            }, i * 200);
        }
    }

    private updateCounter() {
        const counter = document.querySelector('.explore-counter strong');
        if (counter) {
            counter.textContent = String(this.remainingExplores);
        }
        // 更新進度
        this.explorationProgress = (5 - this.remainingExplores) / 5;
    }

    private render() {
        this.removeOverlay();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.className = 'forest-overlay-wrapper';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(8, 6, 4, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 0;
            box-sizing: border-box;
        `;

        const fogHTML = `
            <div class="forest-fog" style="
                position: absolute; bottom: 0; left: -20%; right: -20%; height: 80px;
                background: linear-gradient(180deg, transparent 0%, rgba(52, 211, 153, 0.03) 50%, rgba(52, 211, 153, 0.06) 100%);
                pointer-events: none; border-radius: 50%;
                filter: blur(25px);
                z-index: 0;
            "></div>
            <div class="forest-fog-2" style="
                position: absolute; bottom: 10px; left: -30%; right: -30%; height: 60px;
                background: linear-gradient(180deg, transparent 0%, rgba(52, 211, 153, 0.02) 50%, rgba(52, 211, 153, 0.04) 100%);
                pointer-events: none; border-radius: 50%;
                filter: blur(35px);
                z-index: 0;
            "></div>
            <div class="forest-fog-3" style="
                position: absolute; bottom: 20px; left: -40%; right: -40%; height: 40px;
                background: linear-gradient(180deg, transparent 0%, rgba(52, 211, 153, 0.015) 50%, rgba(52, 211, 153, 0.03) 100%);
                pointer-events: none; border-radius: 50%;
                filter: blur(45px);
                z-index: 0;
            "></div>
        `;

        const lightRays = `
            <div class="light-ray"></div>
            <div class="light-ray"></div>
            <div class="light-ray"></div>
            <div class="light-ray"></div>
        `;

        this.overlayContainer.innerHTML = `
            <div class="forest-modal-container" style="
                background: rgba(16, 14, 12, 0.95);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(52, 211, 153, 0.04);
                border-radius: 0;
                width: 100vw;
                max-width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                display: flex;
                flex-direction: column;
                animation: forestPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
            ">
                ${fogHTML}
                ${lightRays}

                <div style="
                    position: relative;
                    height: clamp(120px, 18vh, 150px);
                    background: linear-gradient(180deg, rgba(16, 14, 12, 0.1) 20%, rgba(16, 14, 12, 0.85) 70%, rgba(16, 14, 12, 1) 100%), 
                                url('./assets/images/ForestUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 12px 18px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                    z-index: 1;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="forest-btn-close" style="
                            background: rgba(8, 6, 4, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(52, 211, 153, 0.12); color: #6b8a7a;
                            padding: 4px 14px; border-radius: 20px; cursor: pointer;
                            font-size: 11px; font-weight: 400; transition: all 0.2s;
                            display: flex; align-items: center; gap: 4px;
                        "
                        onmouseover="this.style.borderColor='rgba(52,211,153,0.3)'; this.style.color='#34d399';"
                        onmouseout="this.style.borderColor='rgba(52,211,153,0.12)'; this.style.color='#6b8a7a';"
                        >⬅ 離開</button>

                        <div class="explore-counter" style="
                            background: rgba(8, 6, 4, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            padding: 3px 14px;
                            border-radius: 16px;
                            border: 1px solid rgba(52, 211, 153, 0.15);
                            font-size: 11px;
                            font-weight: 500;
                            color: #34d399;
                            display: flex;
                            align-items: center; gap: 6px;
                        ">
                            <span>🌲</span>
                            <span>剩餘 <strong style="font-size: 15px; color: #5ee0a4;">${this.remainingExplores}</strong> 次</span>
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 400; color: #4a8a6a; letter-spacing: 1.5px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            WHISPERS OF THE FOREST
                        </div>
                        <div style="font-size: 16px; font-weight: 600; color: #e8e4de; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 8px;">
                            🌲 迷霧森林
                            <span style="font-size: 10px; font-weight: 300; color: #5a6a5a; text-shadow: none;">· 探索未知</span>
                        </div>
                    </div>
                </div>

                <div id="forest-content-area" style="
                    flex: 1; padding: 12px 18px 16px 18px; overflow-y: auto; display: flex;
                    flex-direction: column; gap: 10px; background: rgba(8, 6, 4, 0.4);
                    z-index: 1;
                ">
                    ${this.renderContent()}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
        
        // 初始化 Canvas（需要等待 DOM 渲染完成）
        setTimeout(() => {
            this.initCanvas();
        }, 100);
        
        setTimeout(() => this.createLeafEffect(), 300);
    }

    private renderContent(): string {
        if (this.remainingExplores === 0) {
            const totalRewards = this.calculateTotalRewards();
            return `
                <div style="
                    flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
                    text-align: center; gap: 10px; padding: 10px 0;
                ">
                    <div style="font-size: 48px; animation: eventReveal 0.6s ease forwards;">🏕️</div>
                    <div style="font-size: 18px; font-weight: 600; color: #e8e4de;">本次探索已結束</div>
                    <div style="font-size: 12px; color: #7a8a7a; line-height: 1.6; max-width: 300px;">
                        你已穿越迷霧森林的所有小徑<br>
                        帶著收穫，準備返回小鎮吧
                    </div>
                    ${totalRewards.length > 0 ? `
                        <div style="
                            background: rgba(52, 211, 153, 0.04);
                            border: 1px solid rgba(52, 211, 153, 0.06);
                            border-radius: 10px; padding: 6px 14px;
                            display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;
                        ">
                            ${totalRewards.map(r => `
                                <span style="color: #8aaa8a; font-size: 11px;">${r}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button id="forest-btn-leave" style="
                        width: 100%; max-width: 280px; padding: 12px;
                        background: linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%);
                        border: 1px solid rgba(52, 211, 153, 0.2);
                        border-radius: 12px; color: #34d399;
                        font-size: 14px; font-weight: 500; cursor: pointer;
                        transition: all 0.2s;
                        letter-spacing: 0.5px;
                    "
                    onmouseover="this.style.borderColor='rgba(52,211,153,0.4)'; this.style.background='rgba(52,211,153,0.08)';"
                    onmouseout="this.style.borderColor='rgba(52,211,153,0.2)'; this.style.background='linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(16,185,129,0.05) 100%)';"
                    >🚪 返回小鎮</button>
                </div>
            `;
        }

        return `
            <div style="
                text-align: center; font-size: 11px; color: #4a5a4a; letter-spacing: 0.5px;
                padding-bottom: 2px;
            ">
                ✦ 迷霧深處藏著什麼呢 ✦
            </div>

            <canvas id="forest-path" class="forest-path-canvas" height="120"></canvas>

            <button id="forest-btn-explore" class="forest-explore-btn" style="
                width: 100%; padding: 14px;
                background: linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%);
                border: 1px solid rgba(52, 211, 153, 0.2);
                border-radius: 12px; color: #34d399;
                font-size: 15px; font-weight: 600; cursor: pointer;
                transition: all 0.3s ease;
                display: flex; align-items: center; justify-content: center; gap: 10px;
                position: relative;
                letter-spacing: 0.3px;
            "
            onmouseover="this.style.borderColor='rgba(52,211,153,0.4)'; this.style.background='rgba(52,211,153,0.08)';"
            onmouseout="this.style.borderColor='rgba(52,211,153,0.2)'; this.style.background='linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(16,185,129,0.04) 100%)';"
            >
                <span>🌲</span> 探索森林深處
                <span style="font-size: 11px; font-weight: 400; opacity: 0.5; background: rgba(52,211,153,0.04); padding: 2px 12px; border-radius: 10px;">
                    剩 ${this.remainingExplores} 次
                </span>
            </button>

            ${this.exploreHistory.length > 0 ? `
                <div style="
                    background: rgba(0,0,0,0.2); border-radius: 10px; padding: 10px 12px;
                    max-height: 100px; overflow-y: auto;
                    border: 1px solid rgba(255,255,255,0.02);
                ">
                    <div style="font-size: 9px; color: #4a5a4a; margin-bottom: 4px; letter-spacing: 0.5px;">📜 探索紀錄</div>
                    ${this.exploreHistory.slice(-4).map((h, index) => `
                        <div style="
                            font-size: 10px; color: ${index === this.exploreHistory.length - 1 ? '#8aaa8a' : '#5a6a5a'}; 
                            padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.02);
                            display: flex; align-items: center; gap: 4px;
                        ">
                            <span style="opacity: 0.3;">${index === this.exploreHistory.length - 1 ? '▶' : '·'}</span>
                            ${h}
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="
                    text-align: center; color: #3a4a3a; font-size: 10px; padding: 6px 0;
                    letter-spacing: 0.3px; font-style: italic;
                ">
                    🌿 輕觸按鈕，踏入迷霧之中...
                </div>
            `}
        `;
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

    private async handleExplore() {
        if (this.isExploring || this.remainingExplores <= 0) return;
        this.isExploring = true;

        const btn = document.getElementById('forest-btn-explore');
        if (btn) {
            btn.classList.add('loading');
            btn.textContent = '🌿 探索中...';
        }

        // 先減探索次數
        this.remainingExplores -= 1;
        this.updateCounter();
        this.createLeafEffect();

        // 等待效果
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

        // 生成事件
        const event = this.generateEvent();
        await this.applyRewards(event);

        // 記錄歷史
        let historyText = `${event.icon} ${event.name}：${event.description}`;
        if (event.isSuccess && event.rewards.length > 0) {
            const rewardTexts = event.rewards.map(r => {
                if (r.sunCoins) return `☀️ +${r.sunCoins}`;
                if (r.memorialTokens) return `🌟 +${r.memorialTokens}`;
                if (r.itemId) {
                    const item = ITEM_DATABASE[r.itemId];
                    return `🎁 ${item?.name || r.itemId} x${r.count || 1}`;
                }
                return '';
            }).filter(t => t).join('、');
            if (rewardTexts) {
                historyText += `（${rewardTexts}）`;
            }
        }
        this.exploreHistory.push(historyText);

        // 更新進度
        this.explorationProgress = (5 - this.remainingExplores) / 5;

        this.isExploring = false;

        // ✅ 關鍵：重新渲染整個 UI（而不是只更新 contentArea）
        // 這樣 Canvas 會重新創建，計數器也會正確更新
        this.render();
        
        // ✅ 如果還有剩餘次數，自動顯示事件結果提示（但不阻擋繼續探索）
        if (this.remainingExplores > 0) {
            // 在重新渲染後，在 contentArea 頂部顯示一個小提示
            this.showEventResult(event);
        } else {
            // 所有探索完成，顯示完成畫面（已經由 render 處理）
        }
    }

    // ✅ 在 Canvas 上方顯示事件結果的浮動提示
    private showEventResult(event: ForestEvent) {
        const contentArea = document.getElementById('forest-content-area');
        if (!contentArea) return;

        // 移除舊的提示
        const oldTip = document.getElementById('event-result-tip');
        if (oldTip) oldTip.remove();

        const tip = document.createElement('div');
        tip.id = 'event-result-tip';
        tip.style.cssText = `
            background: rgba(52, 211, 153, 0.04);
            border: 1px solid rgba(52, 211, 153, 0.08);
            border-radius: 10px;
            padding: 8px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: eventReveal 0.3s ease forwards;
            margin-bottom: 4px;
        `;
        tip.innerHTML = `
            <span style="font-size: 20px;">${event.icon}</span>
            <div style="flex: 1;">
                <div style="font-size: 12px; font-weight: 500; color: #e8e4de;">
                    ${event.isSuccess ? '✨' : '🌫️'} ${event.name}
                </div>
                <div style="font-size: 10px; color: #8a9a8a;">${event.description}</div>
            </div>
            ${event.isSuccess && event.rewards.length > 0 ? `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    ${event.rewards.map(r => {
                        if (r.sunCoins) return `<span style="color: #fde047; font-size: 11px;">☀️+${r.sunCoins}</span>`;
                        if (r.memorialTokens) return `<span style="color: #d8b4fe; font-size: 11px;">🌟+${r.memorialTokens}</span>`;
                        if (r.itemId) {
                            const item = ITEM_DATABASE[r.itemId];
                            return `<span style="color: #34d399; font-size: 11px;">🎁+${r.count || 1}</span>`;
                        }
                        return '';
                    }).join('')}
                </div>
            ` : ''}
        `;

        // 插入到 contentArea 的最前面（在 canvas 之前）
        const firstChild = contentArea.firstChild;
        if (firstChild) {
            contentArea.insertBefore(tip, firstChild);
        } else {
            contentArea.appendChild(tip);
        }

        // 3.5 秒後淡出移除
        setTimeout(() => {
            tip.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            tip.style.opacity = '0';
            tip.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (tip.parentNode) tip.remove();
            }, 500);
        }, 3500);
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
                description: `在樹蔭下發現了${herbNames[selected.itemId] || '藥草'}`,
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
                description: '在樹根旁發現一叢螢光小蘑菇',
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
                description: '在藤蔓覆蓋的樹洞中找到古老寶箱！',
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
                description: '森林精靈賜予你祝福',
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
                'item_43': '泛黃舊地圖',
                'item_42': '舊時代火車票',
                'item_44': '黃銅鑰匙',
                'item_49': '詩集殘頁'
            };
            return {
                id: 'ruins',
                name: '發現古老遺跡',
                icon: '📜',
                description: `發現${relicNames[selected.itemId] || '古老遺物'}`,
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
                description: `發現${specialNames[selected.itemId] || '稀有材料'}！`,
                rewards: [selected],
                isSuccess: true
            };
        }

        return {
            id: 'lost',
            name: '迷霧迷失',
            icon: '🌫️',
            description: '濃霧襲來，迷失了方向...',
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

    private calculateTotalRewards(): string[] {
        const rewards: { [key: string]: number } = {};
        for (const record of this.exploreHistory) {
            const coinMatch = record.match(/☀️ \+(\d+)/);
            if (coinMatch) {
                const amount = parseInt(coinMatch[1]);
                rewards['☀️ 暖陽幣'] = (rewards['☀️ 暖陽幣'] || 0) + amount;
            }
            const tokenMatch = record.match(/🌟 \+(\d+)/);
            if (tokenMatch) {
                const amount = parseInt(tokenMatch[1]);
                rewards['🌟 紀念代幣'] = (rewards['🌟 紀念代幣'] || 0) + amount;
            }
            for (const itemId in ITEM_DATABASE) {
                const item = ITEM_DATABASE[itemId];
                const pattern = new RegExp(`🎁 ${item.name} x(\\d+)`);
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
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.removeOverlay();
        this.onClose();
    }
}