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
                @keyframes detailExpand {
                    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .inv-glow-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0) 70%);
                    pointer-events: none;
                    animation: glowFloat 5s ease-in-out infinite;
                }
                .inv-list-item {
                    display: flex;
                    flex-direction: column;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .inv-list-item:hover {
                    border-color: rgba(234, 179, 8, 0.25);
                    background: rgba(234, 179, 8, 0.04);
                }
                .inv-list-item.selected {
                    border-color: #eab308;
                    background: rgba(234, 179, 8, 0.06);
                }
                .inv-list-item .item-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                }
                .inv-list-item .item-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                    width: 32px;
                    text-align: center;
                }
                .inv-list-item .item-info {
                    flex: 1;
                    min-width: 0;
                }
                .inv-list-item .item-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                }
                .inv-list-item .item-desc {
                    font-size: 11px;
                    color: #a89f91;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .inv-list-item .item-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }
                .inv-list-item .item-count {
                    font-size: 11px;
                    color: #eab308;
                    background: rgba(234, 179, 8, 0.1);
                    padding: 1px 8px;
                    border-radius: 12px;
                    border: 1px solid rgba(234, 179, 8, 0.1);
                }
                .inv-list-item .item-rarity {
                    font-size: 9px;
                    padding: 1px 6px;
                    border-radius: 4px;
                }
                .inv-list-item .item-rarity.common { color: #a89f91; }
                .inv-list-item .item-rarity.rare { color: #60a5fa; background: rgba(96, 165, 250, 0.08); }
                .inv-list-item .item-rarity.epic { color: #d8b4fe; background: rgba(216, 180, 254, 0.08); }

                .inv-item-detail {
                    padding: 0 12px 12px 12px;
                    animation: detailExpand 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    border-top: 1px solid rgba(234, 179, 8, 0.06);
                    padding-top: 10px;
                    margin-top: 2px;
                }
                .inv-item-detail .detail-desc {
                    font-size: 12px;
                    color: #d4c9b8;
                    line-height: 1.5;
                }
                .inv-item-detail .detail-usage {
                    font-size: 10px;
                    color: #eab308;
                    background: rgba(234, 179, 8, 0.05);
                    padding: 4px 10px;
                    border-radius: 6px;
                    border: 1px solid rgba(234, 179, 8, 0.06);
                    margin-top: 6px;
                }
                .inv-item-detail .detail-action {
                    margin-top: 8px;
                    display: flex;
                    justify-content: flex-end;
                }
                .inv-item-detail .detail-action button {
                    padding: 4px 16px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                .inv-item-detail .detail-action button.can-use {
                    background: rgba(234, 179, 8, 0.15);
                    border: 1px solid rgba(234, 179, 8, 0.3);
                    color: #fde047;
                }
                .inv-item-detail .detail-action button.can-use:hover {
                    background: rgba(234, 179, 8, 0.25);
                    transform: translateY(-1px);
                }
                .inv-item-detail .detail-action button.can-use:active {
                    transform: translateY(0) scale(0.97);
                }
                .inv-item-detail .detail-action button.cannot-use {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #6b635b;
                    cursor: default;
                }

                .inv-tab {
                    transition: all 0.2s ease;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .inv-tab:hover {
                    color: #fff !important;
                    background: rgba(234, 179, 8, 0.06) !important;
                }
                .inv-close-btn {
                    transition: all 0.2s ease;
                }
                .inv-close-btn:hover {
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    background: rgba(234, 179, 8, 0.1) !important;
                    color: #fde047 !important;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }

                .inv-list-container {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding-right: 2px;
                    min-height: 0;
                }

                .inv-list-empty {
                    color: #6b635b;
                    font-size: 13px;
                    font-weight: 300;
                    letter-spacing: 0.5px;
                    padding: 30px 0;
                    text-align: center;
                }

                /* ✅ 自定義滾動條 */
                .inv-list-container::-webkit-scrollbar {
                    width: 4px;
                }
                .inv-list-container::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.03);
                    border-radius: 4px;
                }
                .inv-list-container::-webkit-scrollbar-thumb {
                    background: rgba(234, 179, 8, 0.2);
                    border-radius: 4px;
                }
                .inv-list-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(234, 179, 8, 0.35);
                }

                @media (max-width: 480px) {
                    .inv-modal-container {
                        padding: 12px 12px 16px 12px !important;
                    }
                    .inv-list-item .item-row {
                        padding: 6px 10px !important;
                        gap: 8px !important;
                    }
                    .inv-list-item .item-icon {
                        font-size: 16px !important;
                        width: 26px !important;
                    }
                    .inv-list-item .item-name {
                        font-size: 12px !important;
                    }
                    .inv-list-item .item-desc {
                        font-size: 10px !important;
                    }
                    .inv-list-item .item-count {
                        font-size: 10px !important;
                        padding: 0 6px !important;
                    }
                    .inv-tab {
                        font-size: 9px !important;
                        padding: 4px 0 !important;
                    }
                    .inv-item-detail {
                        padding: 0 10px 10px 10px !important;
                    }
                    .inv-item-detail .detail-desc {
                        font-size: 11px !important;
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

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'inv-glow-particle';
            const size = 3 + Math.random() * 5;
            const x = 5 + Math.random() * 90;
            const y = 5 + Math.random() * 90;
            const delay = Math.random() * 5;
            const duration = 4 + Math.random() * 4;

            particle.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x}%; top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                opacity: ${0.06 + Math.random() * 0.15};
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
        this.removeOverlay();

        const filteredItems = this.currentTab === 'all' 
            ? this.items 
            : this.items.filter(i => i.category === this.currentTab);

        if (this.selectedItem && !filteredItems.some(i => i.id === this.selectedItem?.id)) {
            this.selectedItem = null;
        }

        if (filteredItems.length > 0 && !this.selectedItem) {
            this.selectedItem = filteredItems[0];
        }

        const getRarityClass = (rarity?: string) => {
            if (rarity === 'epic') return 'epic';
            if (rarity === 'rare') return 'rare';
            return 'common';
        };
        const getRarityLabel = (rarity?: string) => {
            if (rarity === 'epic') return '✨史詩';
            if (rarity === 'rare') return '⭐稀有';
            return '';
        };

        let listHtml = '';
        if (filteredItems.length > 0) {
            listHtml = filteredItems.map(item => {
                const isSelected = this.selectedItem?.id === item.id;
                const isConsumable = item.category === 'consumable';
                
                return `
                    <div class="inv-list-item ${isSelected ? 'selected' : ''}" 
                         data-id="${item.id}">
                        <div class="item-row">
                            <span class="item-icon">${item.icon}</span>
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-desc">${item.desc}</div>
                            </div>
                            <div class="item-meta">
                                ${item.rarity && item.rarity !== 'common' ? 
                                    `<span class="item-rarity ${getRarityClass(item.rarity)}">${getRarityLabel(item.rarity)}</span>` : ''}
                                ${item.count > 1 ? `<span class="item-count">×${item.count}</span>` : ''}
                            </div>
                        </div>
                        ${isSelected ? `
                            <div class="inv-item-detail">
                                <div class="detail-desc">${item.desc}</div>
                                ${item.usage ? `
                                    <div class="detail-usage">
                                        ${item.category === 'equipment' ? '⚙️ 裝備後' : '✨ 使用後'}：${item.usage}
                                    </div>
                                ` : ''}
                                <div class="detail-action">
                                    <button class="${isConsumable ? 'can-use' : 'cannot-use'}" 
                                            data-action="use"
                                            ${!isConsumable ? 'disabled' : ''}>
                                        ${isConsumable ? '☀️ 使用' : '📜 收藏品'}
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            listHtml = `<div class="inv-list-empty">✦ 此分類目前空無一物 ✦</div>`;
        }

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

        this.overlayContainer.innerHTML = `
            <div class="no-scrollbar inv-modal-container" style="
                background: rgba(28, 23, 20, 0.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: none;
                border-radius: 0;
                padding: 16px 24px 18px 24px;
                width: 100vw;
                max-width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                color: #f3f0ea;
                animation: inventoryPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: relative;
                overflow: hidden;
            ">
                <!-- Banner 區塊 -->
                <div style="
                    position: relative;
                    height: clamp(85px, 13vh, 115px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 30%, rgba(28, 23, 20, 0.92) 70%, rgba(28, 23, 20, 1) 100%), 
                                url('./assets/images/InventoryUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 10px 16px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="inv-btn-close" class="inv-close-btn" style="
                            background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px);
                            -webkit-backdrop-filter: blur(6px);
                            border: 1px solid rgba(234, 179, 8, 0.2);
                            color: #fde047;
                            padding: 4px 12px;
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
                            padding: 2px 10px;
                            border-radius: 14px;
                            border: 1px solid rgba(234, 179, 8, 0.12);
                            font-size: 10px;
                            font-weight: 600;
                            color: #eab308;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        ">
                            🎒 ${this.items.length} 件
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 8px; font-weight: 500; color: #eab308; letter-spacing: 1.2px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            PERSONAL INVENTORY
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6);">
                            旅人收藏
                        </div>
                    </div>
                </div>

                <!-- 分類頁籤 -->
                <div style="
                    display: flex;
                    gap: 3px;
                    background: rgba(0,0,0,0.2);
                    padding: 3px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.04);
                    flex-shrink: 0;
                ">
                    ${(['all', 'consumable', 'equipment', 'material'] as TabType[]).map(tab => {
                        const labels: Record<TabType, string> = {
                            all: '📋 全部',
                            consumable: '☕ 消耗品',
                            equipment: '⚙️ 裝備',
                            material: '🌾 材料'
                        };
                        const isActive = this.currentTab === tab;
                        return `
                            <button class="inv-tab" data-tab="${tab}" style="
                                flex: 1;
                                padding: 5px 0;
                                background: ${isActive ? 'rgba(234,179,8,0.1)' : 'transparent'};
                                border: ${isActive ? '1px solid rgba(234,179,8,0.15)' : '1px solid transparent'};
                                border-radius: 7px;
                                color: ${isActive ? '#fde047' : '#a89f91'};
                                font-size: 10px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">${labels[tab]}</button>
                        `;
                    }).join('')}
                </div>

                <!-- ✅ 物品列表（滿版 + 可滾動） -->
                <div class="inv-list-container no-scrollbar">
                    ${listHtml}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);

        this.createGlowParticles();
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

        document.querySelectorAll('.inv-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).closest('button')) return;

                const target = e.currentTarget as HTMLElement;
                const itemId = target.getAttribute('data-id');
                const found = this.items.find(i => i.id === itemId);
                if (found) {
                    if (this.selectedItem?.id === found.id) {
                        this.selectedItem = null;
                    } else {
                        this.selectedItem = found;
                    }
                    this.render();
                }
            });
        });

        document.querySelectorAll('[data-action="use"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.selectedItem) return;
                this.handleUseItem();
            });
        });
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