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

export class ChatUI {
    private authUid: string;
    private profile: PlayerProfile;
    private onClose: () => void;
    private container: HTMLDivElement | null = null;
    private unsubscribe: (() => void) | null = null;
    
    // 🌟 固定聊天室 ID（所有人都共用這一個大廳，不會在 chats 產生一堆亂數檔案）
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
                    max-width: 75%;
                    padding: 10px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    line-height: 1.4;
                    word-break: break-all;
                }
            `;
            document.head.appendChild(style);
        }
    }

    private render() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
        `;

        this.container.innerHTML = `
            <div style="
                background: #1c1714; border: 1px solid rgba(234, 179, 8, 0.3);
                border-radius: 20px; width: 100%; max-width: 440px; height: 85vh;
                max-height: 600px; display: flex; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.7); overflow: hidden;
                animation: chatFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            ">
                <!-- 標題列 -->
                <div style="
                    padding: 16px 20px; background: rgba(28, 23, 20, 0.95);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">💬</span>
                        <div>
                            <div style="font-size: 15px; font-weight: 700; color: #fff;">鎮民廣場</div>
                            <div style="font-size: 11px; color: #a89f91;">與歇腳的旅人對話 (顯示最近 20 則)</div>
                        </div>
                    </div>
                    <button id="btn-close-chat" style="
                        background: none; border: none; color: #a89f91; font-size: 18px;
                        cursor: pointer; padding: 4px 8px; border-radius: 6px;
                    ">✕</button>
                </div>

                <!-- 訊息顯示區 -->
                <div id="chat-messages-area" style="
                    flex: 1; padding: 16px; overflow-y: auto; display: flex;
                    flex-direction: column; gap: 12px; background: #15110e;
                ">
                    <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 10px;">
                        正在連接鎮民廣場...
                    </div>
                </div>

                <!-- 輸入送出區 -->
                <div style="
                    padding: 14px 16px; background: rgba(28, 23, 20, 0.95);
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex; gap: 10px;
                ">
                    <input type="text" id="chat-input-box" placeholder="說點溫暖的話吧..." style="
                        flex: 1; background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px;
                        padding: 10px 14px; color: #fff; font-size: 13px; outline: none;
                    ">
                    <button id="btn-send-message" style="
                        background: #eab308; color: #1c1714; border: none; border-radius: 10px;
                        padding: 0 16px; font-weight: 600; font-size: 13px; cursor: pointer;
                        transition: opacity 0.2s;
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
        // 🌟 正確路徑：固定讀取 chats/town_square 底下的 messages
        const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
        
        // 🌟 關鍵優化：只抓取最新 20 筆訊息（依時間降序排列再反轉，確保畫面上最新在下方）
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const rawMessages: any[] = [];
            snapshot.forEach((doc) => {
                rawMessages.push({ id: doc.id, ...doc.data() });
            });

            // 反轉順序，讓最舊的在上面、最新的在下面
            const messages = rawMessages.reverse();
            this.renderMessages(messages);

            // 🌟 附加安全機制：當伺服器端抓回來的總數大於 30 則時，自動背景清理超出的舊訊息
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
                <div style="text-align: center; color: #6b635b; font-size: 12px; margin-top: 20px;">
                    廣場目前靜悄悄的，留下第一句話吧～
                </div>
            `;
            return;
        }

        area.innerHTML = '';
        messages.forEach((msg) => {
            const isMe = msg.uid === this.authUid;
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; flex-direction: column;
                align-items: ${isMe ? 'flex-end' : 'flex-start'};
                width: 100%;
            `;

            // 發言者暱稱
            const nameTag = document.createElement('div');
            nameTag.style.cssText = `font-size: 11px; color: #8c8275; margin-bottom: 2px; padding: 0 4px;`;
            nameTag.textContent = msg.nickname || '善意旅人';

            // 訊息泡泡本體
            const bubble = document.createElement('div');
            bubble.className = 'chat-message-bubble';
            bubble.style.cssText += `
                background: ${isMe ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.04)'};
                border: 1px solid ${isMe ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
                color: ${isMe ? '#fde047' : '#f3f0ea'};
            `;
            bubble.textContent = msg.text;

            wrapper.appendChild(nameTag);
            wrapper.appendChild(bubble);
            area.appendChild(wrapper);
        });

        // 自動捲動到最底部
        area.scrollTop = area.scrollHeight;
    }

    private async sendMessage(text: string) {
        try {
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            await addDoc(messagesRef, {
                uid: this.authUid,
                nickname: this.profile.nickname || '善意旅人',
                avatarColor: (this.profile as any).avatarColor || '#eab308',
                text: text,
                timestamp: serverTimestamp() // 讓 Firebase 記錄伺服器精準時間
            });
        } catch (error) {
            console.error('發送訊息失敗:', error);
        }
    }

    /**
     * 🌟 定期清理機制：
     * 當訊息累積過多時，在背景自動刪除最舊的訊息。
     * 具有安全時間鎖：絕不刪除 5 分鐘之內發送的訊息，保護剛發言完的使用者。
     */
    private async cleanOldMessages() {
        try {
            const messagesRef = collection(db, 'chats', this.currentChatId, 'messages');
            // 抓出歷史全部訊息，照時間由舊到新排序
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            const docs = snapshot.docs;
            // 如果總數未超過 30 則，不需要清理
            if (docs.length <= 30) return;

            // 計算需要被清理的超額數量
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
                    // 🛡️ 安全鎖：如果這則訊息在 5 分鐘之內，絕對跳過不刪除！
                    if (now - msgTime < FIVE_MINUTES) {
                        continue;
                    }
                }

                // 執行刪除過期舊訊息
                await deleteDoc(doc(db, 'chats', this.currentChatId, 'messages', docSnap.id));
                deletedCount++;
            }

            if (deletedCount > 0) {
                console.log(`🧹 系統背景清理完成，已安全移除 ${deletedCount} 則過期舊訊息。`);
            }
        } catch (error) {
            console.error('自動清理舊訊息時發生錯誤:', error);
        }
    }

    public remove() {
        if (this.unsubscribe) {
            this.unsubscribe(); // 關閉即時監聽，節省流量
            this.unsubscribe = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.onClose();
    }
}