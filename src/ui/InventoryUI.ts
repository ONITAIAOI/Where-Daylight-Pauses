import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ITEM_DATABASE } from '../config/itemRegistry';

export interface DisplayInventoryItem {
    id: string;
    name: string;
    category: 'consumable' | 'equipment' | 'material';
    icon: string;
    desc: string;
    rarity?: 'common' | 'rare' | 'epic';
    effect?: {
        resilience?: number;
        perception?: number;
        energy?: number;
    };
    usage?: string;
    count: number;
}

type TabType = 'all' | 'consumable' | 'equipment' | 'material';

export class InventoryUI {
    private uid: string;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;
    private currentTab: TabType = 'all';
    private selectedItem: DisplayInventoryItem | null = null;
    private items: DisplayInventoryItem[] = [];
    private isToastActive: boolean = false;
    private isActionLoading: boolean = false;
    private glowParticles: HTMLDivElement[] = [];

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
                @keyframes glowFloat {
                    0% { opacity: 0.1; transform: translateY(0) scale(1); }
                    50% { opacity: 0.4; transform: translateY(-15px) scale(1.15); }
                    100% { opacity: 0.1; transform: translateY(0) scale(1); }
                }
                .inv-glow-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0) 70%);
                    pointer-events: none;
                    animation: glowFloat 5s ease-in-out infinite;
                }
                .inv-slot {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .inv-slot:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.08) !important;
                    transform: translateY(-2px);
                }
                .inv-slot.selected {
                    border-color: #eab308 !important;
                    background: rgba(234, 179, 8, 0.15) !important;
                    box-shadow: 0 0 20px rgba(234, 179, 8, 0.15);
                }
                .inv-tab {
                    transition: all 0.2s ease;
                }
                .inv-tab:hover {
                    color: #fff !important;
                    background: rgba(234, 179, 8, 0.08) !important;
                }
                .inv-close-btn {
                    transition: all 0.2s ease;
                }
                .inv-close-btn:hover {
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    background: rgba(234, 179, 8, 0.1) !important;
                    color: #fde047 !important;
                }
                .inv-action-btn {
                    transition: all 0.2s ease;
                }
                .inv-action-btn:hover {
                    background: rgba(234, 179, 8, 0.2) !important;
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    transform: translateY(-1px);
                }
                .inv-action-btn:active {
                    transform: translateY(0) scale(0.97);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
                .rarity-common { color: #a89f91; }
                .rarity-rare { color: #60a5fa; }
                .rarity-epic { color: #d8b4fe; }

                .inv-item-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    max-height: 160px;
                    overflow-y: auto;
                    padding-right: 2px;
                    flex-shrink: 0;
                }

                @media (max-width: 480px) {
                    .inv-modal-container {
                        padding: 16px 14px !important;
                    }
                    .inv-item-grid {
                        max-height: 140px !important;
                        gap: 6px !important;
                    }
                    .inv-tab {
                        font-size: 9px !important;
                        padding: 4px !important;
                    }
                    .inv-detail-area {
                        min-height: 70px !important;
                        padding: 10px 12px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    private createGlowParticles() {
        const container = this.overlayContainer?.querySelector('.inv-modal-container');
        if (!container) return;

        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'inv-glow-particle';
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
                opacity: ${0.08 + Math.random() * 0.2};
            `;
            container.appendChild(particle);
            this.glowParticles.push(particle);
        }
    }

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
            max-width: 90vw;
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

    private async loadInventoryAndRender() {
        try {
            const playerDocRef = doc(db, 'players', this.uid);
            const snapshot = await getDoc(playerDocRef);

            if (snapshot.exists()) {
                const data = snapshot.data();
                const rawInventory: { id: string; count: number }[] = data.inventory || [];

                this.items = rawInventory.map(invItem => {
                    const def = ITEM_DATABASE[invItem.id];
                    if (def) {
                        return {
                            ...def,
                            count: invItem.count
                        };
                    }
                    return {
                        id: invItem.id,
                        name: '未知道具',
                        category: 'material' as const,
                        icon: '📦',
                        desc: '一個神秘的未知物品。',
                        rarity: 'common' as const,
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
        const gridEl = document.getElementById('inv-item-grid');
        const currentScrollTop = gridEl ? gridEl.scrollTop : 0;

        this.removeOverlay();

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.className = 'inv-overlay-wrapper';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(14, 12, 10, 0.75);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 0;
            box-sizing: border-box;
        `;

        const filteredItems = this.currentTab === 'all' 
            ? this.items 
            : this.items.filter(i => i.category === this.currentTab);

        if (filteredItems.length > 0 && (!this.selectedItem || !filteredItems.some(i => i.id === this.selectedItem?.id))) {
            this.selectedItem = filteredItems[0];
        } else if (filteredItems.length === 0) {
            this.selectedItem = null;
        }

        const getRarityColor = (rarity?: string) => {
            if (rarity === 'epic') return '#d8b4fe';
            if (rarity === 'rare') return '#60a5fa';
            return '#a89f91';
        };
        const getRarityLabel = (rarity?: string) => {
            if (rarity === 'epic') return '✨ 史詩';
            if (rarity === 'rare') return '⭐ 稀有';
            return '• 一般';
        };

        this.overlayContainer.innerHTML = `
            <div class="no-scrollbar inv-modal-container" style="
                background: rgba(28, 23, 20, 0.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: none;
                border-radius: 0;
                padding: 20px 24px;
                width: 100vw;
                max-width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                color: #f3f0ea;
                animation: inventoryPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 14px;
                position: relative;
                overflow: hidden;
            ">
                <!-- 🌟 Banner 區塊 -->
                <div style="
                    position: relative;
                    height: clamp(100px, 16vh, 140px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 70%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/InventoryUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 12px 18px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="inv-btn-close" class="inv-close-btn" style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(234, 179, 8, 0.2);
                            color: #fde047;
                            padding: 5px 14px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">⬅ 返回</button>

                        <div style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            padding: 3px 12px;
                            border-radius: 16px;
                            border: 1px solid rgba(234, 179, 8, 0.15);
                            font-size: 10px;
                            font-weight: 600;
                            color: #eab308;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">
                            🎒 行囊
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 500; color: #eab308; letter-spacing: 1.2px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            PERSONAL INVENTORY
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6);">
                            旅人收藏 · ${this.items.length} 件
                        </div>
                    </div>
                </div>

                <!-- 📂 分類頁籤 -->
                <div style="
                    display: flex;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    padding: 3px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.04);
                    flex-shrink: 0;
                ">
                    <button class="inv-tab" data-tab="all" style="
                        flex: 1;
                        padding: 6px 0;
                        background: ${this.currentTab === 'all' ? 'rgba(234,179,8,0.12)' : 'transparent'};
                        border: ${this.currentTab === 'all' ? '1px solid rgba(234,179,8,0.2)' : '1px solid transparent'};
                        border-radius: 8px;
                        color: ${this.currentTab === 'all' ? '#fde047' : '#a89f91'};
                        font-size: 10px;
                        font-weight: 600;
                        cursor: pointer;
                    ">📋 全部</button>
                    <button class="inv-tab" data-tab="consumable" style="
                        flex: 1;
                        padding: 6px 0;
                        background: ${this.currentTab === 'consumable' ? 'rgba(234,179,8,0.12)' : 'transparent'};
                        border: ${this.currentTab === 'consumable' ? '1px solid rgba(234,179,8,0.2)' : '1px solid transparent'};
                        border-radius: 8px;
                        color: ${this.currentTab === 'consumable' ? '#fde047' : '#a89f91'};
                        font-size: 10px;
                        font-weight: 600;
                        cursor: pointer;
                    ">☕ 消耗品</button>
                    <button class="inv-tab" data-tab="equipment" style="
                        flex: 1;
                        padding: 6px 0;
                        background: ${this.currentTab === 'equipment' ? 'rgba(234,179,8,0.12)' : 'transparent'};
                        border: ${this.currentTab === 'equipment' ? '1px solid rgba(234,179,8,0.2)' : '1px solid transparent'};
                        border-radius: 8px;
                        color: ${this.currentTab === 'equipment' ? '#fde047' : '#a89f91'};
                        font-size: 10px;
                        font-weight: 600;
                        cursor: pointer;
                    ">⚙️ 裝備</button>
                    <button class="inv-tab" data-tab="material" style="
                        flex: 1;
                        padding: 6px 0;
                        background: ${this.currentTab === 'material' ? 'rgba(234,179,8,0.12)' : 'transparent'};
                        border: ${this.currentTab === 'material' ? '1px solid rgba(234,179,8,0.2)' : '1px solid transparent'};
                        border-radius: 8px;
                        color: ${this.currentTab === 'material' ? '#fde047' : '#a89f91'};
                        font-size: 10px;
                        font-weight: 600;
                        cursor: pointer;
                    ">🌾 材料</button>
                </div>

                <!-- 📦 物品網格 -->
                <div id="inv-item-grid" class="inv-item-grid no-scrollbar">
                    ${filteredItems.length > 0 ? filteredItems.map(item => `
                        <div class="inv-slot ${this.selectedItem?.id === item.id ? 'selected' : ''}" 
                             data-id="${item.id}" 
                             style="
                                position: relative;
                                background: rgba(255, 255, 255, 0.02);
                                border: 1px solid ${this.selectedItem?.id === item.id ? 'rgba(234,179,8,0.4)' : 'rgba(255, 255, 255, 0.05)'};
                                border-radius: 10px;
                                aspect-ratio: 1;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s ease;
                             ">
                            <span style="font-size: 22px;">${item.icon}</span>
                            ${item.count > 1 ? `
                                <span style="
                                    position: absolute;
                                    bottom: 3px;
                                    right: 5px;
                                    font-size: 9px;
                                    font-weight: 700;
                                    color: #eab308;
                                    background: rgba(28, 23, 20, 0.9);
                                    padding: 1px 5px;
                                    border-radius: 4px;
                                    border: 1px solid rgba(234,179,8,0.15);
                                ">${item.count}</span>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <div style="
                            grid-column: span 4;
                            text-align: center;
                            padding: 24px 0;
                            color: #6b635b;
                            font-size: 12px;
                            font-weight: 300;
                            letter-spacing: 0.5px;
                        ">
                            ✦ 此分類目前空無一物 ✦
                        </div>
                    `}
                </div>

                <!-- 📝 物品詳情區 -->
                <div class="inv-detail-area" style="
                    background: rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(234, 179, 8, 0.08);
                    border-radius: 12px;
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex-shrink: 0;
                    min-height: 80px;
                    transition: all 0.3s ease;
                ">
                    ${this.selectedItem ? `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 28px;">${this.selectedItem.icon}</span>
                                <div>
                                    <div style="font-size: 13px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
                                        ${this.selectedItem.name}
                                        <span style="font-size: 9px; color: ${getRarityColor(this.selectedItem.rarity)}; font-weight: 400;">
                                            ${getRarityLabel(this.selectedItem.rarity)}
                                        </span>
                                    </div>
                                    <div style="font-size: 10px; color: #a89f91; line-height: 1.3;">
                                        持有數量：<span style="color: #fde047; font-weight: 600;">${this.selectedItem.count}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 11px; color: #d4c9b8; line-height: 1.5; padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.04);">
                            ${this.selectedItem.desc}
                        </div>
                        ${this.selectedItem.usage ? `
                            <div style="
                                font-size: 10px;
                                color: #eab308;
                                line-height: 1.5;
                                background: rgba(234,179,8,0.06);
                                padding: 4px 10px;
                                border-radius: 6px;
                                border: 1px solid rgba(234,179,8,0.08);
                            ">
                                ${this.selectedItem.category === 'equipment' ? '⚙️ 裝備後效果' : '✨ 使用後效果'}：${this.selectedItem.usage}
                            </div>
                        ` : ''}
                        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px;">
                            <button id="inv-use-btn" class="inv-action-btn" style="
                                background: ${this.selectedItem.category === 'consumable' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255,255,255,0.03)'};
                                border: 1px solid ${this.selectedItem.category === 'consumable' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.06)'};
                                color: ${this.selectedItem.category === 'consumable' ? '#fde047' : '#a89f91'};
                                padding: 5px 16px;
                                border-radius: 8px;
                                font-size: 11px;
                                font-weight: 600;
                                cursor: ${this.selectedItem.category === 'consumable' ? 'pointer' : 'default'};
                                transition: all 0.2s;
                                opacity: ${this.selectedItem.category === 'consumable' ? '1' : '0.6'};
                            ">${this.selectedItem.category === 'consumable' ? '☀️ 使用' : '📜 收藏'}</button>
                        </div>
                    ` : `
                        <div style="
                            text-align: center;
                            color: #6b635b;
                            font-size: 11px;
                            padding: 12px 0;
                            font-weight: 300;
                            letter-spacing: 0.5px;
                        ">
                            ✦ 輕觸上方物品查看詳情 ✦
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);

        this.createGlowParticles();

        const newGridEl = document.getElementById('inv-item-grid');
        if (newGridEl) newGridEl.scrollTop = currentScrollTop;

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
                const newTab = (target.getAttribute('data-tab') || 'all') as TabType;
                
                // ✅ 只有當 tab 真的變更時才重新渲染
                if (this.currentTab !== newTab) {
                    this.currentTab = newTab;
                    const filtered = this.currentTab === 'all' 
                        ? this.items 
                        : this.items.filter(i => i.category === this.currentTab);
                    this.selectedItem = filtered.length > 0 ? filtered[0] : null;
                    this.render();
                }
            });
        });

        document.querySelectorAll('.inv-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const itemId = target.getAttribute('data-id');
                const found = this.items.find(i => i.id === itemId);
                if (found && this.selectedItem?.id !== found.id) {
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

    private async handleUseItem() {
        if (!this.selectedItem || this.isActionLoading) return;

        if (this.selectedItem.category === 'consumable') {
            this.isActionLoading = true;

            const effectText = this.selectedItem.usage || '精神獲得了恢復 ✨';
            this.showToast(`✨ 你使用了「${this.selectedItem.name}」\n${effectText}`);

            this.selectedItem.count -= 1;

            let rawInventory = this.items.map(i => ({
                id: i.id,
                count: i.count
            })).filter(i => i.count > 0);

            try {
                const playerDocRef = doc(db, 'players', this.uid);
                await updateDoc(playerDocRef, { inventory: rawInventory });
            } catch (err) {
                console.error('更新背包存檔失敗:', err);
            } finally {
                this.isActionLoading = false;
            }

            this.loadInventoryAndRender();
        } else {
            const usageInfo = this.selectedItem.usage ? `\n\n⚙️ ${this.selectedItem.usage}` : '';
            this.showToast(`📜 ${this.selectedItem.name}\n${this.selectedItem.desc}${usageInfo}`);
        }
    }

    private removeOverlay() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }

    public remove() {
        this.glowParticles.forEach(p => p.remove());
        this.glowParticles = [];

        const toast = document.getElementById('inventory-toast');
        if (toast) toast.remove();
        
        const styleEl = document.getElementById('inventory-styles');
        if (styleEl) {
            styleEl.remove();
        }

        this.removeOverlay();
    }
}