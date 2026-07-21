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
    doc 
} from 'firebase/firestore';
import { PlayerProfile } from '../firebase/playerData';
import { CHAT_SKINS } from '../config/chatSkinsConfig'; // 🌟 引入你的聊天外觀設定檔

export class ChatUI {
    private authUid: string;
    private profile: PlayerProfile;
    private onClose: () => void;
    private container: HTMLDivElement | null = null;
    private unsubscribe: (() => void) | null = null;
    
    // 固定聊天室 ID（共用大廳）
    private currentChatId: string = 'town_square';

    constructor(authUid: string, profile: PlayerProfile, onClose: () => void) {
        this.authUid = authUid;
        this.profile = profile;
        this.onClose = onClose;

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
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .chat-message-bubble {
                    max-width: 78%;
                    padding: 10px 14px;
                    border-radius: 14px;
                    font-size: 13px;
                    line-height: 1.5;
                    word-break: break-all;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                /* 自定義美化捲軸 */
                #chat-messages-area::-webkit-scrollbar {
                    width: 5px;
                }
                #chat-messages-area::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                #chat-messages-area::-webkit-scrollbar-thumb {
                    background: rgba(234, 179, 8, 0.2);
                    border-radius: 4px;
                }
                #chat-messages-area::-webkit-scrollbar-thumb:hover {
                    background: rgba(234, 179, 8, 0.4);
                }
                #chat-input-box:focus {
                    border-color: rgba(234, 179, 8, 0.6) !important;
                    background: rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 0 10px rgba(234, 179, 8, 0.15);
                }
                .chat-send-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }

    private render() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(14, 12, 10, 0.8); backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
        `;

        this.container.innerHTML = `
            <div style="
                background: #1c1714; 
                border: 1px solid rgba(234, 179, 8, 0.35);
                border-radius: 20px; width: 100%; max-width: 440px; height: 85vh;
                max-height: 600px; display: flex; flex-direction: column;
                box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden;
                animation: chatFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            ">
                <!-- 標題列 -->
                <div style="
                    padding: 16px 20px; background: rgba(24, 20, 17, 0.95);
                    border-bottom: 1px solid rgba(234, 179, 8, 0.15);
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 36px; height: 36px; border-radius: 10px;
                            background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25);
                            display: flex; align-items: center; justify-content: center; font-size: 18px;
                        ">💬</div>
                        <div>
                            <div style="font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">鎮民廣場</div>
                            <div style="font-size: 11px; color: #a89f91;">與歇腳的旅人對話（顯示最近 20 則）</div>
                        </div>
                    </div>
                    <button id="btn-close-chat" style="
                        background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
                        color: #a89f91; font-size: 14px; width: 30px; height: 30px; border-radius: 50%;
                        cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
                    ">✕</button>
                </div>

                <!-- 訊息顯示區 -->
                <div id="chat-messages-area" style="
                    flex: 1; padding: 18px; overflow-y: auto; display: flex;
                    flex-direction: column; gap: 14px; background: #14100d;
                ">
                    <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 10px;">
                        正在連接鎮民廣場...
                    </div>
                </div>

                <!-- 輸入送出區 -->
                <div style="
                    padding: 14px 18px; background: rgba(24, 20, 17, 0.95);
                    border-top: 1px solid rgba(234, 179, 8, 0.15);
                    display: flex; gap: 10px; align-items: center;
                ">
                    <input type="text" id="chat-input-box" placeholder="說點溫暖的話吧..." style="
                        flex: 1; background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
                        padding: 11px 14px; color: #fff; font-size: 13px; outline: none;
                        transition: all 0.2s;
                    ">
                    <button id="btn-send-message" class="chat-send-btn" style="
                        background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); 
                        color: #1c1714; border: none; border-radius: 12px;
                        padding: 0 18px; height: 41px; font-weight: 700; font-size: 13px; cursor: pointer;
                        transition: all 0.2s; box-shadow: 0 2px 8px rgba(234, 179, 8, 0.2);
                    ">發送</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }

    private bindEvents() {
        const closeBtn = document.getElementById('btn-close-chat');
        const sendBtn = document.getElementById('btn-send-message');
        const inputbox = document.getElementById('chat-input-box') as HTMLInputElement;

        closeBtn?.addEventListener('click', () => this.remove());
        
        // 懸停關閉按鈕時的微互動
        closeBtn?.addEventListener('mouseenter', () => {
            closeBtn.style.color = '#fff';
            closeBtn.style.borderColor = 'rgba(234, 179, 8, 0.4)';
            closeBtn.style.background = 'rgba(234, 179, 8, 0.1)';
        });
        closeBtn?.addEventListener('mouseleave', () => {
            closeBtn.style.color = '#a89f91';
            closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            closeBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        });

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
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const rawMessages: any[] = [];
            snapshot.forEach((doc) => {
                rawMessages.push({ id: doc.id, ...doc.data() });
            });

            const messages = rawMessages.reverse();
            this.renderMessages(messages);

            if (snapshot.size > 30) {
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
                <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 30px; line-height: 1.6;">
                    ✨ 廣場目前靜悄悄的<br>留下第一句話來溫暖大家吧～
                </div>
            `;
            return;
        }

        area.innerHTML = '';
        messages.forEach((msg) => {
            const isMe = msg.uid === this.authUid;
            
            // 🌟 取得該則訊息對應的外觀設定（若找不到則預設為 default）
            const skinId = msg.skinId || 'default';
            const skin = CHAT_SKINS[skinId] || CHAT_SKINS['default'];

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; flex-direction: column;
                align-items: ${isMe ? 'flex-end' : 'flex-start'};
                width: 100%;
            `;

            // 🌟 只有「不是自己」的訊息，才顯示上方暱稱
            if (!isMe) {
                const nameTag = document.createElement('div');
                nameTag.style.cssText = `
                    font-size: 11px; 
                    color: #eab308; 
                    margin-bottom: 3px; 
                    padding: 0 4px;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                `;
                nameTag.textContent = msg.nickname || '善意旅人';
                wrapper.appendChild(nameTag);
            }

            // 訊息泡泡本體
            const bubble = document.createElement('div');
            bubble.className = 'chat-message-bubble';
            
            if (isMe) {
                bubble.style.cssText += skin.bubbleStyle;
                if (skin.textStyle) {
                    bubble.style.cssText += skin.textStyle;
                }
            } else {
                bubble.style.cssText += skin.bubbleStyle;
                if (skin.textStyle) {
                    bubble.style.cssText += skin.textStyle;
                }
            }
            
            bubble.textContent = msg.text;
            wrapper.appendChild(bubble);
            area.appendChild(wrapper);
        });

        area.scrollTop = area.scrollHeight;
    }

    private async sendMessage(text: string) {
        try {
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            
            // 🌟 讀取 profile 中記錄的已裝備外觀 ID
            const currentSkinId = (this.profile as any).equippedChatSkin || 'default';

            await addDoc(messagesRef, {
                uid: this.authUid,
                nickname: this.profile.nickname || '善意旅人',
                skinId: currentSkinId, // 🌟 把選中的外觀 ID 寫入資料庫
                text: text,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('發送訊息失敗:', error);
        }
    }

    private async cleanOldMessages() {
        try {
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            const docs = snapshot.docs;
            if (docs.length <= 30) return;

            const excessCount = docs.length - 20; 
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
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // 🌟 移除全域注入的 CSS 樣式，防止 DOM 污染與重複堆疊
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