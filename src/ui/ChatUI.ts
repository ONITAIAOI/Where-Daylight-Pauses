import { db } from '../firebase/config';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';
import { PlayerProfile } from '../firebase/playerData';
import { CHAT_SKINS } from '../config/chatSkinsConfig';

// ✨ 安全提示語句
const SAFETY_TIPS = [
    '🔒 請勿透露個人隱私（電話、地址、銀行帳號）',
    '🛡️ 鎮民廣場是溫暖的地方，請保持友善對話',
    '⚠️ 請勿點擊不明連結，保護自己的帳號安全',
    '💬 如有騷擾或詐騙訊息，請截圖向小鎮管理員檢舉',
    '🌿 真實的鎮民不會要求你轉帳或提供密碼',
    '🔐 保護自己，也保護其他旅人'
];

// ✅ 批次備份設定
const BACKUP_CONFIG = {
    MAX_MESSAGES: 10,
    MAX_INTERVAL: 60000,
};

export class ChatUI {
    private authUid: string;
    private profile: PlayerProfile;
    private onClose: () => void;
    private container: HTMLDivElement | null = null;
    private unsubscribe: (() => void) | null = null;
    private isSending: boolean = false;
    private currentChatId: string = 'town_square';
    private glowParticles: HTMLDivElement[] = [];
    private currentTip: string = '';

    private backupBuffer: any[] = [];
    private backupTimer: number | null = null;

    constructor(authUid: string, profile: PlayerProfile, onClose: () => void) {
        this.authUid = authUid;
        this.profile = profile;
        this.onClose = onClose;
        this.currentTip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];

        this.injectStyles();
        this.render();
        this.listenMessages();
    }

    private injectStyles() {
        if (!document.getElementById('chat-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'chat-ui-styles';
            style.innerHTML = `
                @keyframes chatFadeIn {
                    from { opacity: 0; transform: scale(0.96) translateY(12px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes glowFloat {
                    0% { opacity: 0.1; transform: translateY(0) scale(1); }
                    50% { opacity: 0.4; transform: translateY(-15px) scale(1.15); }
                    100% { opacity: 0.1; transform: translateY(0) scale(1); }
                }
                @keyframes tipPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }

                // ✨ 皮膚動畫 Keyframes
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

                .chat-glow-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0) 70%);
                    pointer-events: none;
                    animation: glowFloat 5s ease-in-out infinite;
                }
                .chat-message-bubble {
                    max-width: 78%;
                    padding: 10px 16px;
                    border-radius: 16px;
                    font-size: 13px;
                    line-height: 1.6;
                    word-break: break-word;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
                    transition: transform 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }
                .chat-message-bubble:hover {
                    transform: scale(1.01);
                }
                .safety-tip {
                    animation: tipPulse 3s ease-in-out infinite;
                }

                // ============================================================
                // ✨ 皮膚專屬動畫（extraClass）
                // ============================================================

                // 🕯️ 燭光皮膚
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

                // 🌈 彩虹皮膚
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

                // 🌪️ 風暴皮膚
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

                // 💫 星辰皮膚
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

                // ⚡ 閃電皮膚
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

                // 🔥 鳳凰皮膚
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
                    content: '🐦';
                    position: absolute;
                    bottom: 15%;
                    left: 10%;
                    font-size: 16px;
                    opacity: 0.3;
                    animation: meteorShower 3s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                }

                // ============================================================
                // 聊天室 UI 樣式
                // ============================================================

                #chat-messages-area::-webkit-scrollbar {
                    width: 4px;
                }
                #chat-messages-area::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                #chat-messages-area::-webkit-scrollbar-thumb {
                    background: rgba(234, 179, 8, 0.25);
                    border-radius: 4px;
                }
                #chat-messages-area::-webkit-scrollbar-thumb:hover {
                    background: rgba(234, 179, 8, 0.4);
                }

                #chat-input-box:focus {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 0 20px rgba(234, 179, 8, 0.08);
                }

                .chat-send-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(234, 179, 8, 0.3);
                }
                .chat-send-btn:active {
                    transform: translateY(0) scale(0.97);
                }

                .chat-close-btn:hover {
                    color: #fff !important;
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    background: rgba(234, 179, 8, 0.1) !important;
                    transform: rotate(90deg);
                }

                @media (max-width: 480px) {
                    .chat-modal-container {
                        max-width: 100% !important;
                        height: 94dvh !important;
                        max-height: none !important;
                        border-radius: 20px 20px 0 0 !important;
                        position: absolute !important;
                        bottom: 0 !important;
                        margin: 0 !important;
                    }
                    .chat-overlay-wrapper {
                        align-items: flex-end !important;
                        padding: 0 !important;
                    }
                    .safety-tip {
                        font-size: 9px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    private createGlowParticles() {
        const container = this.container?.querySelector('.chat-modal-container');
        if (!container) return;

        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'chat-glow-particle';
            const size = 3 + Math.random() * 6;
            const x = 5 + Math.random() * 90;
            const y = 5 + Math.random() * 90;
            const delay = Math.random() * 5;
            const duration = 4 + Math.random() * 4;

            particle.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x}%; top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.1 + Math.random() * 0.25};
            `;
            container.appendChild(particle);
            this.glowParticles.push(particle);
        }
    }

    private render() {
        this.container = document.createElement('div');
        this.container.className = 'chat-overlay-wrapper';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(14, 12, 10, 0.75);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
        `;

        this.container.innerHTML = `
            <div class="chat-modal-container" style="
                background: rgba(28, 23, 20, 0.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 24px; width: 100%; max-width: 440px; height: 85vh;
                max-height: 620px; display: flex; flex-direction: column;
                box-shadow: 0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04);
                animation: chatFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
            ">
                <div style="
                    position: relative;
                    height: clamp(110px, 18vh, 150px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 70%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/ChatUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="
                                width: 34px; height: 34px; border-radius: 10px;
                                background: rgba(234, 179, 8, 0.12);
                                border: 1px solid rgba(234, 179, 8, 0.2);
                                display: flex; align-items: center; justify-content: center; font-size: 16px;
                                backdrop-filter: blur(4px);
                            ">☕</div>
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.4);">
                                    鎮民廣場
                                </div>
                                <div style="font-size: 10px; color: #d4c9b8; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">
                                    · 日光角落 ·
                                </div>
                            </div>
                        </div>
                        <button id="btn-close-chat" class="chat-close-btn" style="
                            background: rgba(18, 16, 14, 0.6); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            color: #a89f91; font-size: 14px; width: 30px; height: 30px; border-radius: 50%;
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                            transition: all 0.3s ease;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">✕</button>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 500; color: #eab308; letter-spacing: 1.2px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            WHERE DAYLIGHT PAUSES
                        </div>
                        <div style="font-size: 11px; color: #d4c9b8; font-weight: 300; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            ✦ 與歇腳的旅人分享溫暖話語 ✦
                        </div>
                    </div>
                </div>

                <div style="
                    padding: 6px 16px;
                    background: rgba(239, 68, 68, 0.04);
                    border-bottom: 1px solid rgba(239, 68, 68, 0.08);
                    flex-shrink: 0;
                ">
                    <div class="safety-tip" style="
                        font-size: 10px; color: #f87171; text-align: center;
                        font-weight: 400; letter-spacing: 0.3px;
                        line-height: 1.5;
                    ">
                        ${this.currentTip}
                    </div>
                </div>

                <div id="chat-messages-area" style="
                    flex: 1; padding: 16px 18px; overflow-y: auto; display: flex;
                    flex-direction: column; gap: 12px; background: rgba(20, 16, 13, 0.6);
                ">
                    <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 16px; font-weight: 300; letter-spacing: 0.5px;">
                        ✦ 正在連接鎮民廣場 ✦
                    </div>
                </div>

                <div style="
                    padding: 12px 16px 14px 16px;
                    background: rgba(24, 20, 17, 0.9);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border-top: 1px solid rgba(234, 179, 8, 0.08);
                    display: flex; gap: 10px; align-items: center;
                ">
                    <input type="text" id="chat-input-box" placeholder="說點溫暖的話吧 ☕" style="
                        flex: 1; background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px; padding: 10px 14px;
                        color: #f3f0ea; font-size: 13px; outline: none;
                        transition: all 0.3s ease;
                        font-weight: 300;
                        letter-spacing: 0.3px;
                    ">
                    <button id="btn-send-message" class="chat-send-btn" style="
                        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
                        color: #1c1714; border: none; border-radius: 12px;
                        padding: 0 20px; height: 40px;
                        font-weight: 700; font-size: 13px; cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 12px rgba(234, 179, 8, 0.15);
                        letter-spacing: 0.5px;
                    ">✦ 發送</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.createGlowParticles();
        this.bindEvents();
        this.startBackupTimer();
    }

    private bindEvents() {
        const closeBtn = document.getElementById('btn-close-chat');
        const sendBtn = document.getElementById('btn-send-message');
        const inputbox = document.getElementById('chat-input-box') as HTMLInputElement;

        closeBtn?.addEventListener('click', () => this.remove());

        this.container?.addEventListener('click', (e) => {
            if (e.target === this.container) this.remove();
        });

        const handleSend = () => {
            const text = inputbox.value.trim();
            if (!text) return;
            this.sendMessage(text);
            inputbox.value = '';
        };

        sendBtn?.addEventListener('click', handleSend);
        inputbox?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    private listenMessages() {
        const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const rawMessages: any[] = [];
            snapshot.forEach((doc) => {
                rawMessages.push({ id: doc.id, ...doc.data() });
            });

            const messages = rawMessages.reverse();
            this.renderMessages(messages);

            if (snapshot.size > 50) {
                this.cleanOldMessages();
            }
        }, (error) => {
            console.error('監聽聊天室失敗:', error);
        });
    }

    private renderMessages(messages: any[]) {
        const area = document.getElementById('chat-messages-area');
        if (!area) return;

        if (messages.length === 0) {
            area.innerHTML = `
                <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 30px; line-height: 1.8; font-weight: 300; letter-spacing: 0.5px;">
                    ✨ 廣場目前靜悄悄的<br>留下第一句話來溫暖大家吧 ✨
                </div>
            `;
            return;
        }

        area.innerHTML = '';
        messages.forEach((msg) => {
            const isMe = msg.uid === this.authUid;

            const skinId = msg.skinId || 'default';
            const skin = CHAT_SKINS[skinId] || CHAT_SKINS['default'];

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; flex-direction: column;
                align-items: ${isMe ? 'flex-end' : 'flex-start'};
                width: 100%;
                animation: chatFadeIn 0.2s ease forwards;
            `;

            if (!isMe) {
                const nameTag = document.createElement('div');
                nameTag.style.cssText = `
                    font-size: 10px;
                    color: #eab308;
                    margin-bottom: 3px;
                    padding: 0 4px;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    opacity: 0.8;
                `;
                nameTag.textContent = msg.nickname || '善意旅人';
                wrapper.appendChild(nameTag);
            }

            const bubble = document.createElement('div');
            bubble.className = 'chat-message-bubble';

            // ✅ 基礎樣式
            let baseStyle = '';
            if (isMe) {
                baseStyle = `
                    background: linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.15) 100%);
                    border: 1px solid rgba(234, 179, 8, 0.2);
                    color: #f5e6ca;
                    border-bottom-right-radius: 4px;
                `;
            } else {
                baseStyle = `
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    color: #e8ddd0;
                    border-bottom-left-radius: 4px;
                `;
            }

            // ✅ 套用皮膚樣式（直接覆蓋）
            if (skin) {
                let skinStyle = '';
                if (skin.bubbleStyle) {
                    skinStyle += skin.bubbleStyle;
                }
                if (skin.textStyle) {
                    skinStyle += skin.textStyle;
                }
                if (skinStyle) {
                    bubble.style.cssText = skinStyle;
                } else {
                    bubble.style.cssText = baseStyle;
                }

                // ✅ 如果有額外 CSS 類名，加入
                if (skin.extraClass) {
                    bubble.classList.add(skin.extraClass);
                }
            } else {
                bubble.style.cssText = baseStyle;
            }

            // ✅ 確保圓角方向正確
            if (isMe) {
                bubble.style.borderBottomRightRadius = '4px';
            } else {
                bubble.style.borderBottomLeftRadius = '4px';
            }

            bubble.textContent = msg.text;
            wrapper.appendChild(bubble);
            area.appendChild(wrapper);
        });

        area.scrollTop = area.scrollHeight;
    }

    private async sendMessage(text: string) {
        if (this.isSending) return;

        try {
            this.isSending = true;
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            const currentSkinId = (this.profile as any).equippedChatSkin || 'default';

            await addDoc(messagesRef, {
                uid: this.authUid,
                nickname: this.profile.nickname || '善意旅人',
                skinId: currentSkinId,
                text: text,
                timestamp: serverTimestamp()
            });

            this.addToBackupBuffer(text, currentSkinId);

        } catch (error) {
            console.error('發送訊息失敗:', error);
        } finally {
            setTimeout(() => {
                this.isSending = false;
            }, 500);
        }
    }

    private addToBackupBuffer(text: string, skinId: string) {
        this.backupBuffer.push({
            chatId: this.currentChatId,
            text: text,
            skinId: skinId,
            nickname: this.profile.nickname || '善意旅人',
            timestamp: serverTimestamp()
        });

        if (this.backupBuffer.length >= BACKUP_CONFIG.MAX_MESSAGES) {
            this.flushBackupBuffer();
        }
    }

    private startBackupTimer() {
        if (this.backupTimer) return;
        this.backupTimer = window.setInterval(() => {
            if (this.backupBuffer.length > 0) {
                this.flushBackupBuffer();
            }
        }, BACKUP_CONFIG.MAX_INTERVAL);
    }

    private async flushBackupBuffer() {
        if (this.backupBuffer.length === 0) return;

        const messagesToBackup = [...this.backupBuffer];
        this.backupBuffer = [];

        try {
            const batch = writeBatch(db);
            const backupRef = collection(db, 'chat_backups', this.authUid, 'messages');

            for (const msg of messagesToBackup) {
                const docRef = doc(backupRef);
                batch.set(docRef, {
                    ...msg,
                    backedUpAt: serverTimestamp()
                });
            }

            await batch.commit();
            console.log(`✅ 批次備份完成：${messagesToBackup.length} 則訊息`);

        } catch (error) {
            console.warn('⚠️ 批次備份失敗，將重試:', error);
            this.backupBuffer = [...messagesToBackup, ...this.backupBuffer];
        }
    }

    private async flushRemainingBackup() {
        if (this.backupBuffer.length === 0) return;
        console.log(`📝 關閉前備份剩餘 ${this.backupBuffer.length} 則訊息...`);
        await this.flushBackupBuffer();
    }

    private async cleanOldMessages() {
        try {
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            const docs = snapshot.docs;
            if (docs.length <= 30) return;

            const excessCount = docs.length - 30;
            let deletedCount = 0;
            const now = Date.now();
            const FIVE_MINUTES = 5 * 60 * 1000;

            for (let i = 0; i < docs.length && deletedCount < excessCount; i++) {
                const docSnap = docs[i];
                const data = docSnap.data();
                const timestamp = data.timestamp;

                if (timestamp && typeof timestamp.toMillis === 'function') {
                    const msgTime = timestamp.toMillis();
                    if (now - msgTime < FIVE_MINUTES) {
                        continue;
                    }
                }

                await deleteDoc(doc(db, 'chats', this.currentChatId, 'messages', docSnap.id));
                deletedCount++;
            }
        } catch (error) {
            console.error('自動清理舊訊息時發生錯誤:', error);
        }
    }

    public remove() {
        this.flushRemainingBackup();

        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
        }

        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        const styleEl = document.getElementById('chat-ui-styles');
        if (styleEl) {
            styleEl.remove();
        }

        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.onClose();
    }
}