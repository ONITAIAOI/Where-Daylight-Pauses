import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ITEM_DATABASE, ItemDefinition } from '../config/itemRegistry';

// 組合後的完整道具介面（包含數量與圖鑑資訊）
export interface DisplayInventoryItem extends ItemDefinition {
    count: number;
}

export class InventoryUI {
    private uid: string;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;
    private currentTab: 'all' | 'consumable' | 'equipment' | 'material' = 'all';
    private selectedItem: DisplayInventoryItem | null = null;
    private items: DisplayInventoryItem[] = []; 
    private isToastActive: boolean = false;

    constructor(uid: string, onClose: () => void) {
        this.uid = uid;
        this.onClose = onClose;
        this.injectGlobalStyles();
        this.loadInventoryAndRender();
    }

    private injectGlobalStyles() {
        if (!document.getElementById('inventory-styles')) {
            const style = document.createElement('style');
            style.id = 'inventory-styles';
            style.innerHTML = `
                @keyframes inventoryPopIn {
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
                .inv-slot:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.08) !important;
                    transform: translateY(-2px);
                }
                .inv-slot.selected {
                    border-color: #eab308 !important;
                    background: rgba(234, 179, 8, 0.15) !important;
                    box-shadow: 0 0 12px rgba(234, 179, 8, 0.25);
                }
                .inv-tab:hover {
                    color: #fff !important;
                    background: rgba(234, 179, 8, 0.1) !important;
                }
                .inv-close-btn:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.1) !important;
                    color: #fde047 !important;
                }
                .inv-action-btn:hover {
                    background: rgba(234, 179, 8, 0.25) !important;
                    border-color: rgba(234, 179, 8, 0.6) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 🌟 統一的 Toast 提示方法
    private showToast(message: string) {
        if (this.isToastActive) return; 
        this.isToastActive = true;

        const oldToast = document.getElementById('inventory-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.id = 'inventory-toast';
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

    // 🌟 從 Firebase 讀取簡易背包，並透過 ITEM_DATABASE 展開完整圖鑑資訊
    private async loadInventoryAndRender() {
        try {
            const playerDocRef = doc(db, 'players', this.uid);
            const snapshot = await getDoc(playerDocRef);

            if (snapshot.exists()) {
                const data = snapshot.data();
                const rawInventory: { id: string; count: number }[] = data.inventory || [];

                // 將資料庫的 {id, count} 對照圖鑑轉換成帶有圖標、名稱、說明的完整物件
                this.items = rawInventory.map(invItem => {
                    const def = ITEM_DATABASE[invItem.id] || {
                        id: invItem.id,
                        name: '未知道具',
                        category: 'material' as const,
                        icon: '📦',
                        desc: '一個神秘的未知物品。',
                        rarity: 'common' as const
                    };
                    return {
                        ...def,
                        count: invItem.count
                    };
                });
            } else {
                this.items = [];
            }
        } catch (error) {
            console.error('讀取行囊失敗:', error);
            this.items = [];
        }

        this.render();
    }

    private render() {
        this.removeOverlay();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'inventory-overlay';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px; box-sizing: border-box;
        `;

        const filteredItems = this.currentTab === 'all' 
            ? this.items 
            : this.items.filter(i => i.category === this.currentTab);

        if (filteredItems.length > 0 && (!this.selectedItem || !filteredItems.some(i => i.id === this.selectedItem?.id))) {
            this.selectedItem = filteredItems[0];
        } else if (filteredItems.length === 0) {
            this.selectedItem = null;
        }

        this.overlayContainer.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.25);
                border-radius: 20px; padding: 28px; width: 100%; max-width: 480px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea;
                animation: inventoryPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex; flex-direction: column; gap: 20px;
                max-height: 90vh; overflow: hidden;
            ">
                <!-- 頂部返回按鈕與標籤區 -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button id="inv-btn-close" class="inv-close-btn" style="
                        background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                        border: 1px solid rgba(234, 179, 8, 0.3); color: #fde047;
                        padding: 6px 14px; border-radius: 20px; cursor: pointer;
                        font-size: 12px; font-weight: 600; transition: all 0.2s;
                    ">⬅ 返回小鎮</button>

                    <div style="font-size: 11px; font-weight: 600; color: #eab308; background: rgba(234, 179, 8, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(234, 179, 8, 0.25);">
                        個人行囊
                    </div>
                </div>

                <!-- 標題區 -->
                <div>
                    <div style="font-size: 11px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                        PERSONAL INVENTORY
                    </div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">
                        🎒 收藏與行囊
                    </h2>
                </div>

                <!-- 分類頁籤 Tabs -->
                <div style="display: flex; gap: 6px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
                    <button class="inv-tab" data-tab="all" style="flex: 1; padding: 6px; background: ${this.currentTab === 'all' ? 'rgba(234,179,8,0.15)' : 'transparent'}; border: ${this.currentTab === 'all' ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent'}; border-radius: 8px; color: ${this.currentTab === 'all' ? '#fde047' : '#a89f91'}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">全部</button>
                    <button class="inv-tab" data-tab="consumable" style="flex: 1; padding: 6px; background: ${this.currentTab === 'consumable' ? 'rgba(234,179,8,0.15)' : 'transparent'}; border: ${this.currentTab === 'consumable' ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent'}; border-radius: 8px; color: ${this.currentTab === 'consumable' ? '#fde047' : '#a89f91'}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">消耗品</button>
                    <button class="inv-tab" data-tab="equipment" style="flex: 1; padding: 6px; background: ${this.currentTab === 'equipment' ? 'rgba(234,179,8,0.15)' : 'transparent'}; border: ${this.currentTab === 'equipment' ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent'}; border-radius: 8px; color: ${this.currentTab === 'equipment' ? '#fde047' : '#a89f91'}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">裝備</button>
                    <button class="inv-tab" data-tab="material" style="flex: 1; padding: 6px; background: ${this.currentTab === 'material' ? 'rgba(234,179,8,0.15)' : 'transparent'}; border: ${this.currentTab === 'material' ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent'}; border-radius: 8px; color: ${this.currentTab === 'material' ? '#fde047' : '#a89f91'}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">材料</button>
                </div>

                <!-- 物品網格區 (Slot Grid) -->
                <div style="
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
                    max-height: 180px; overflow-y: auto; padding-right: 4px;
                ">
                    ${filteredItems.length > 0 ? filteredItems.map(item => `
                        <div class="inv-slot ${this.selectedItem?.id === item.id ? 'selected' : ''}" data-id="${item.id}" style="
                            position: relative; background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px;
                            aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
                            cursor: pointer; transition: all 0.2s;
                        ">
                            <span style="font-size: 24px;">${item.icon}</span>
                            ${item.count > 1 ? `
                                <span style="
                                    position: absolute; bottom: 4px; right: 6px;
                                    font-size: 10px; font-weight: 700; color: #eab308;
                                    background: rgba(28, 23, 20, 0.9); padding: 1px 4px; border-radius: 4px;
                                ">${item.count}</span>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <div style="grid-column: span 4; text-align: center; padding: 24px; color: #a89f91; font-size: 13px;">
                            此分類目前沒有物品
                        </div>
                    `}
                </div>

                <!-- 底部物品詳情與操作區 -->
                <div style="
                    background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(234, 179, 8, 0.2);
                    border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
                ">
                    ${this.selectedItem ? `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px;">
                                    ${this.selectedItem.name} <span style="font-size: 11px; color: #eab308; font-weight: 500;">(持有: ${this.selectedItem.count})</span>
                                </div>
                                <div style="font-size: 12px; color: #a89f91; line-height: 1.4;">
                                    ${this.selectedItem.desc}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px;">
                            <button id="inv-use-btn" class="inv-action-btn" style="
                                background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4);
                                color: #fde047; padding: 6px 14px; border-radius: 8px; font-size: 12px;
                                font-weight: 600; cursor: pointer; transition: all 0.2s;
                            ">${this.selectedItem.category === 'consumable' ? '使用道具' : '查看詳情'}</button>
                        </div>
                    ` : `
                        <div style="text-align: center; color: #a89f91; font-size: 12px; padding: 6px;">
                            請選擇一項物品以查看詳細資訊
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        const closeBtn = document.getElementById('inv-btn-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.onClose();
                this.remove();
            };
        }

        document.querySelectorAll('.inv-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                this.currentTab = (target.getAttribute('data-tab') || 'all') as any;
                const filtered = this.currentTab === 'all' 
                    ? this.items 
                    : this.items.filter(i => i.category === this.currentTab);
                this.selectedItem = filtered.length > 0 ? filtered[0] : null;
                this.render();
            });
        });

        document.querySelectorAll('.inv-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const itemId = target.getAttribute('data-id');
                const found = this.items.find(i => i.id === itemId);
                if (found) {
                    this.selectedItem = found;
                    this.render();
                }
            });
        });

        const useBtn = document.getElementById('inv-use-btn');
        if (useBtn && this.selectedItem) {
            useBtn.onclick = () => this.handleUseItem();
        }
    }

    // 🌟 處理道具使用或查看詳情邏輯（全部改用 Toast 顯示）
    private async handleUseItem() {
        if (!this.selectedItem) return;

        if (this.selectedItem.category === 'consumable') {
            this.showToast(`✨ 你使用了 ${this.selectedItem.name}，精神獲得了恢復！`);
            
            // 扣除數量
            this.selectedItem.count -= 1;
            
            // 轉換回資料庫要存的輕量格式 ({ id, count })
            let rawInventory = this.items.map(i => ({
                id: i.id,
                count: i.count
            })).filter(i => i.count > 0); // 數量歸零自動濾掉

            try {
                const playerDocRef = doc(db, 'players', this.uid);
                await updateDoc(playerDocRef, { inventory: rawInventory });
            } catch (err) {
                console.error('更新背包存檔失敗:', err);
            }

            // 重新讀取渲染
            this.loadInventoryAndRender();
        } else {
            // 非消耗品（裝備、材料等）點擊查看詳情改用 Toast
            this.showToast(`📜 關於 ${this.selectedItem.name}：\n${this.selectedItem.desc}`);
        }
    }

    private removeOverlay() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }

    public remove() {
        const toast = document.getElementById('inventory-toast');
        if (toast) toast.remove();
        
        // 🌟 移除全域注入的 CSS 樣式，防止 DOM 污染與重複堆疊
        const styleEl = document.getElementById('inventory-styles');
        if (styleEl) {
            styleEl.remove();
        }

        this.removeOverlay();
    }
}