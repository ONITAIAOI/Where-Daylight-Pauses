import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlayerProfile } from '../firebase/playerData';

export interface ChatMessage {
    id?: string;
    uid: string;
    nickname: string;
    avatarColor: string;
    chatSkin?: string;
    text: string;
    createdAt: Timestamp | Date | any;
}

const CHAT_SKINS: Record<string, { bubble: string; text: string }> = {
    default: {
        bubble: 'background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #1c1714; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2); font-weight: 500;',
        text: ''
    },
    gold_luxury: {
        bubble: 'background: linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%); color: #422006; border: 1px solid #fef08a; box-shadow: 0 0 15px rgba(254, 240, 138, 0.5); font-weight: 700;',
        text: 'letter-spacing: 0.5px;'
    },
    starry_night: {
        bubble: 'background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #e0e7ff; border: 1px solid #818cf8; box-shadow: 0 4px 15px rgba(129, 140, 248, 0.3); font-weight: 500;',
        text: ''
    }
};

export class ChatUI {
    private uid: string;
    private profile: PlayerProfile;
    private container: HTMLDivElement | null = null;
    private unsubscribe: (() => void) | null = null;
    private onClose: () => void;

    constructor(uid: string, profile: PlayerProfile, onClose: () => void) {
        this.uid = uid;
        this.profile = profile;
        this.onClose = onClose;

        this.render();
        this.listenToMessages();
    }

    private render() {
        this.remove();

        this.container = document.createElement('div');
        this.container.id = 'chat-ui-container';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #1f1a17 0%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px; box-sizing: border-box;
            animation: hudFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        this.container.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 24px; width: 100%; max-width: 500px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea; overflow: hidden;
                box-sizing: border-box; display: flex; flex-direction: column;
                max-height: 92vh; height: 85vh;
            ">
                <div style="
                    position: relative; height: 140px; min-height: 140px;
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.2) 0%, rgba(28, 23, 20, 0.4) 50%, #1c1714 100%), 
                                url('./assets/images/main.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 20px 24px; box-sizing: border-box;
                    overflow: hidden; border-top-left-radius: 24px; border-top-right-radius: 24px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; z-index: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">💬</span>
                            <span style="font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">鎮民廣場</span>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div style="
                                background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                                border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 20px;
                                padding: 4px 10px; display: flex; align-items: center; gap: 5px;
                                font-size: 11px; font-weight: 600; color: #fde047;
                            ">
                                <span>☀️</span> <span>${this.profile.sunCoins ?? 100}</span>
                            </div>
                            <button id="btn-close-chat" style="
                                background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                                border: 1px solid rgba(255, 255, 255, 0.2); color: #f3f0ea;
                                width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 12px; transition: all 0.2s;
                            ">✕</button>
                        </div>
                    </div>
                    <div style="z-index: 1;">
                        <div style="font-size: 10px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                            TOWNSFOLK PLAZA
                        </div>
                        <div style="font-size: 12px; color: #d1c7bd; text-shadow: 0 1px 3px rgba(0,0,0,0.6);">
                            與所有駐足小鎮的旅人交流心境，留下溫暖的足跡
                        </div>
                    </div>
                </div>

                <div id="chat-messages-scroll" style="
                    flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
                    scroll-behavior: smooth; background: #1c1714;
                ">
                    <div style="text-align: center; color: #8c8175; font-size: 12px; margin: 10px 0;">
                        ✨ 歡迎來到鎮民廣場，請保持溫暖與禮貌。
                    </div>
                </div>

                <div style="
                    padding: 16px 22px; background: rgba(28, 23, 20, 0.95);
                    border-top: 1px solid rgba(234, 179, 8, 0.15);
                    display: flex; gap: 10px; align-items: center;
                ">
                    <input type="text" id="chat-input-text" placeholder="寫下想說的話..." maxlength="150" style="
                        flex: 1; background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
                        padding: 12px 16px; color: #fff; font-size: 13px; outline: none;
                        transition: border-color 0.2s;
                    " />
                    <button id="btn-send-chat" style="
                        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
                        color: #1c1714; border: none; border-radius: 12px;
                        padding: 12px 20px; font-weight: 700; font-size: 13px;
                        cursor: pointer; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
                        transition: transform 0.1s, opacity 0.2s;
                    ">發送</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }

    private bindEvents() {
        const closeBtn = document.getElementById('btn-close-chat');
        closeBtn?.addEventListener('click', () => this.remove());

        const containerBg = this.container;
        containerBg?.addEventListener('click', (e) => {
            if (e.target === containerBg) {
                this.remove();
            }
        });

        const sendBtn = document.getElementById('btn-send-chat');
        const inputField = document.getElementById('chat-input-text') as HTMLInputElement;

        const handleSend = async () => {
            if (!inputField) return;
            const text = inputField.value.trim();
            if (!text) return;

            const myNickname = this.profile.nickname || '神秘旅人';

            sendBtn?.setAttribute('disabled', 'true');
            inputField.value = '';

            try {
                await addDoc(collection(db, 'chats'), {
                    uid: myNickname, // 讓資料庫的 uid 欄位也存入當前暱稱，維持一致性
                    nickname: myNickname,
                    avatarColor: this.profile.avatarColor || '#eab308',
                    chatSkin: (this.profile as any).equippedChatSkin || 'default',
                    text: text,
                    createdAt: serverTimestamp()
                });
            } catch (error) {
                console.error('發送聊天訊息失敗:', error);
                alert('發送訊息失敗，請檢查網路連線或 Firebase 規則');
            } finally {
                sendBtn?.removeAttribute('disabled');
                inputField.focus();
            }
        };

        sendBtn?.addEventListener('click', handleSend);
        inputField?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });
    }

    private listenToMessages() {
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'asc'), limit(50));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const scrollArea = document.getElementById('chat-messages-scroll');
            if (!scrollArea) return;

            let html = `
                <div style="text-align: center; color: #8c8175; font-size: 12px; margin: 10px 0;">
                    ✨ 歡迎來到鎮民廣場，請保持溫暖與禮貌。
                </div>
            `;

            snapshot.forEach((docSnap) => {
                const msg = docSnap.data() as ChatMessage;
                const myNickname = this.profile.nickname || '神秘旅人';
                
                // 🌟 改用暱稱進行雙重判定（只要訊息裡的 uid 或 nickname 跟我的暱稱一樣，就視為我自己）
                const isMe = (msg.uid === myNickname) || (msg.nickname === myNickname) || (msg.uid === this.uid);
                
                let timeStr = '';
                if (msg.createdAt && typeof msg.createdAt.toDate === 'function') {
                    const date = msg.createdAt.toDate();
                    timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                } else {
                    timeStr = '剛剛';
                }

                const skinKey = msg.chatSkin && CHAT_SKINS[msg.chatSkin] ? msg.chatSkin : 'default';
                const skinConfig = CHAT_SKINS[skinKey];

                if (isMe) {
                    html += `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 12px; width: 100%;">
                            <div style="font-size: 11px; color: #8c8175; margin-bottom: 2px; padding: 0 4px;">
                                我 · ${timeStr}
                            </div>
                            <div style="
                                ${skinConfig.bubble}
                                padding: 10px 14px; border-radius: 14px 14px 2px 14px;
                                max-width: 75%; word-break: break-word; font-size: 13px; line-height: 1.4;
                                ${skinConfig.text}
                            ">${this.escapeHtml(msg.text)}</div>
                        </div>
                    `;
                } else {
                    html += `
                        <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 12px; width: 100%;">
                            <div style="font-size: 11px; color: #8c8175; margin-bottom: 2px; padding: 0 4px;">
                                <span style="color: ${msg.avatarColor || '#eab308'}; font-weight: 600;">${this.escapeHtml(msg.nickname || '神秘旅人')}</span> · ${timeStr}
                            </div>
                            <div style="
                                background: rgba(255, 255, 255, 0.08);
                                color: #f3f0ea;
                                padding: 10px 14px; border-radius: 14px 14px 14px 2px;
                                max-width: 75%; word-break: break-word; font-size: 13px; line-height: 1.4;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                            ">${this.escapeHtml(msg.text)}</div>
                        </div>
                    `;
                }
            });

            scrollArea.innerHTML = html;
            scrollArea.scrollTop = scrollArea.scrollHeight;
        }, (error) => {
            console.error('監聽聊天訊息失敗:', error);
        });
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public remove() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.onClose();
    }
}