export class TownMapUI {
    private onSelectLocation: (locationId: string) => void;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;
    private currentProfile: any = null;

    private getLocationsWithDynamicStatus() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dateOfMonth = now.getDate();

        const isForestOpen = [0, 3, 6].includes(dayOfWeek);
        const isRuinsOpen = (dateOfMonth * 7) % 3 === 0;

        return [
            { id: 'terminal', code: '01', name: '小鎮公告欄', desc: '查看最新佈告與解鎖日常任務的樞紐', status: '今日熱鬧', category: 'town', active: true },
            { id: 'cafe', code: '02', name: '寧靜咖啡館', desc: '歇腳、喝杯熱茶與交換情報的集散地', status: '營業中', category: 'town', active: true },
            { id: 'fountain', code: '03', name: '中央記憶噴泉', desc: '鎮民聚集許願與流傳傳說之處', status: '微風徐徐', category: 'town', active: true },
            { id: 'shop', code: '04', name: '時光雜貨舖', desc: '販售各式日常道具、特產與實用小物的地方', status: '營業中', category: 'town', active: true },
            { id: 'treehouse', code: '05', name: '許願樹屋', desc: '座落在大樹上的休憩所，適合沉澱心靈', status: '微光', category: 'town', active: true },
            { id: 'gallery', code: '06', name: '記憶迴廊', desc: '收藏過往點滴、回顧小鎮故事的藝廊', status: '靜謐', category: 'town', active: true },
            { id: 'alley', code: '07', name: '老街巷弄', desc: '充滿未知的舊街區，常有意外收穫', status: '可探索', category: 'adventure', active: true },
            { 
                id: 'forest', 
                code: '08', 
                name: '🌲 呢喃迷霧森林', 
                desc: '樹影婆娑的神秘林道，持有「懷錶」即可進入 (每週三、六、日開放)', 
                status: isForestOpen ? '🔑 持有懷錶可進入' : '🌙 今日休養', 
                category: 'adventure', 
                active: isForestOpen,
                requiredItem: 'item_54',
                consumeItem: true
            },
            { id: 'ruins', code: '09', name: '失落遺跡', desc: '埋藏著古老文明與危險挑戰的禁忌之地 (隨機時間開放)', status: isRuinsOpen ? '高風險' : '遺跡封印中', category: 'adventure', active: isRuinsOpen },
            { id: 'guild', code: '10', name: '冒險者工會', desc: '接受委託、挑戰各種冒險任務的地方', status: '開放中', category: 'adventure', active: true },
            { id: 'alchemist', code: '11', name: '星塵鍊金工房', desc: '將收集到的各種素材與道具進行合成與轉化', status: '營業中', category: 'workshop', active: true }
        ];
    }

    constructor(onSelectLocation: (locationId: string) => void, onClose: () => void) {
        this.onSelectLocation = onSelectLocation;
        this.onClose = onClose;

        this.loadPlayerProfile();

        this.injectGlobalStyles();
        this.render();
    }

    private async loadPlayerProfile() {
        try {
            if ((window as any).__currentProfile) {
                this.currentProfile = (window as any).__currentProfile;
            } else {
                const { getPlayerProfile } = await import('../firebase/playerData');
                const uid = localStorage.getItem('uid') || '';
                if (uid) {
                    this.currentProfile = await getPlayerProfile(uid);
                }
            }
        } catch (error) {
            console.warn('載入玩家資料失敗:', error);
        }
    }

    private checkPlayerHasItem(itemId: string): boolean {
        if (!this.currentProfile) return false;
        const inventory = this.currentProfile.inventory || [];
        return inventory.some((item: any) => item.id === itemId && (item.count || 1) > 0);
    }

    private getItemCount(itemId: string): number {
        if (!this.currentProfile) return 0;
        const inventory = this.currentProfile.inventory || [];
        const found = inventory.find((item: any) => item.id === itemId);
        return found ? (found.count || 1) : 0;
    }

    private async consumeItem(itemId: string): Promise<boolean> {
        try {
            if (!this.currentProfile) return false;
            
            const inventory = this.currentProfile.inventory || [];
            const itemIndex = inventory.findIndex((item: any) => item.id === itemId);
            
            if (itemIndex === -1) return false;
            
            if (inventory[itemIndex].count > 1) {
                inventory[itemIndex].count -= 1;
            } else {
                inventory.splice(itemIndex, 1);
            }
            
            const { db } = await import('../firebase/config');
            const { doc, updateDoc } = await import('firebase/firestore');
            const playerRef = doc(db, 'players', this.currentProfile.uid || this.currentProfile.id);
            await updateDoc(playerRef, { inventory: inventory });
            
            this.currentProfile.inventory = inventory;
            (window as any).__currentProfile = this.currentProfile;
            
            return true;
        } catch (error) {
            console.error('消耗道具失敗:', error);
            return false;
        }
    }

    private injectGlobalStyles() {
        if (!document.getElementById('town-map-styles')) {
            const style = document.createElement('style');
            style.id = 'town-map-styles';
            style.innerHTML = `
                @keyframes mapPopIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes toastFadeInTop {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes toastFadeOutTop {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -15px); }
                }
                .town-location-card:hover {
                    background: rgba(234, 179, 8, 0.08) !important;
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
                }
                .town-location-card.inactive {
                    opacity: 0.45;
                    filter: grayscale(0.5);
                    cursor: not-allowed !important;
                }
                .town-location-card.inactive:hover {
                    background: rgba(255, 255, 255, 0.02) !important;
                    border-color: rgba(255, 255, 255, 0.06) !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                .town-location-card.required-missing {
                    opacity: 0.6;
                }
                .town-location-card.required-missing .status-text {
                    color: #f87171 !important;
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

    private render() {
        this.remove();

        const locations = this.getLocationsWithDynamicStatus();
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'town-map-overlay';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box; overflow: hidden;
        `;

        const categoryTitles: { [key: string]: { label: string, icon: string } } = {
            town: { label: '城鎮日常與設施', icon: '🏠' },
            adventure: { label: '戶外探險與委託', icon: '🧭' },
            workshop: { label: '專業工坊與合成', icon: '⚗️' }
        };

        const categories = ['town', 'adventure', 'workshop'];

        this.overlayContainer.innerHTML = `
        <div class="town-map-main-card" style="
                background: #1c1714;
                border: none;
                border-radius: 0; padding: 24px 22px; 
                width: 100vw; max-width: 100vw;
                height: 100dvh; max-height: 100dvh;                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea;
                animation: mapPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex; flex-direction: column; gap: 14px;
                overflow: hidden;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <button id="map-btn-close" style="
                        background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                        border: 1px solid rgba(234, 179, 8, 0.3); color: #fde047;
                        padding: 6px 14px; border-radius: 20px; cursor: pointer;
                        font-size: 12px; font-weight: 600; transition: all 0.2s;
                    ">⬅ 返回小鎮</button>

                    <div style="font-size: 11px; font-weight: 600; color: #eab308; background: rgba(234, 179, 8, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(234, 179, 8, 0.25);">
                        今日風和日麗 🌤️
                    </div>
                </div>

                <div style="flex-shrink: 0;">
                    <div style="font-size: 11px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                        EXPLORATION GUIDE
                    </div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">
                        🧭 小鎮探索地圖
                    </h2>
                </div>

                <p style="margin: 0; font-size: 13px; color: #a89f91; line-height: 1.4; flex-shrink: 0;">
                    隨心所欲散步吧！部分秘境依據日程或天候開放，看看今天哪裡可以去。
                </p>

                <div id="town-map-content-scroll" style="
                    display: flex; flex-direction: column; gap: 14px; 
                    overflow-y: auto; flex: 1; padding-right: 2px;
                    -webkit-overflow-scrolling: touch;
                ">
                    ${categories.map(catKey => {
                        const catLocations = locations.filter(loc => loc.category === catKey);
                        if (catLocations.length === 0) return '';
                        const info = categoryTitles[catKey];

                        return `
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="font-size: 12px; font-weight: 700; color: #eab308; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; padding-left: 2px; border-bottom: 1px solid rgba(234,179,8,0.15); padding-bottom: 4px;">
                                    <span>${info.icon}</span> ${info.label}
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    ${catLocations.map(loc => {
                                        let extraClass = '';
                                        let statusText = loc.status;
                                        let isClickable = loc.active;
                                        
                                        if (loc.requiredItem && loc.active) {
                                            const hasItem = this.checkPlayerHasItem(loc.requiredItem);
                                            if (!hasItem) {
                                                extraClass = 'required-missing';
                                                statusText = '🔒 需要懷錶';
                                                isClickable = false;
                                            } else {
                                                const count = this.getItemCount(loc.requiredItem);
                                                statusText = `✅ 懷錶 x${count}`;
                                            }
                                        }
                                        
                                        return `
                                            <div class="town-location-card ${loc.active ? '' : 'inactive'} ${extraClass}" 
                                                 data-id="${loc.id}" 
                                                 data-active="${isClickable ? 'true' : 'false'}"
                                                 data-required="${loc.requiredItem || ''}"
                                                 data-consume="${loc.consumeItem ? 'true' : 'false'}"
                                                 style="
                                                background: rgba(255, 255, 255, 0.02);
                                                border: 1px solid rgba(255, 255, 255, 0.06);
                                                border-radius: 14px; padding: 12px 16px;
                                                cursor: ${isClickable ? 'pointer' : 'not-allowed'};
                                                transition: all 0.2s ease;
                                                display: flex; justify-content: space-between; align-items: center;
                                                opacity: ${isClickable ? '1' : '0.6'};
                                            ">
                                                <div style="display: flex; align-items: center; gap: 14px; pointer-events: none;">
                                                    <div style="font-size: 13px; font-weight: 700; color: #eab308; background: rgba(234,179,8,0.1); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(234, 179, 8, 0.2); flex-shrink: 0;">
                                                        ${loc.code}
                                                    </div>
                                                    <div>
                                                        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px;">${loc.name}</div>
                                                        <div style="font-size: 12px; color: #a89f91; line-height: 1.3;">${loc.desc}</div>
                                                    </div>
                                                </div>
                                                <div class="status-text" style="font-size: 11px; font-weight: 500; color: ${isClickable ? '#eab308' : '#a89f91'}; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 8px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; pointer-events: none;">
                                                    ${statusText}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="
                    background: rgba(234, 179, 8, 0.06);
                    border: 1px dashed rgba(234, 179, 8, 0.3);
                    border-radius: 12px; padding: 10px 14px;
                    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
                ">
                    <span style="font-size: 16px;">💡</span>
                    <div style="font-size: 12px; color: #fde047; line-height: 1.4;">
                        <strong>小鎮小貼士：</strong> 巷弄、工坊與日常設施天天開放，迷霧森林需要「懷錶」才能進入（每週三、六、日開放）！
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        if (!this.overlayContainer) return;

        this.overlayContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            if (target.id === 'map-btn-close' || target.closest('#map-btn-close')) {
                this.onClose();
                this.remove();
                e.stopPropagation();
                return;
            }

            const card = target.closest('.town-location-card') as HTMLElement;
            if (!card) return;

            e.stopPropagation();

            const isActive = card.getAttribute('data-active') === 'true';
            if (!isActive) {
                this.showUnavailableFeedback(card);
                return;
            }

            const locId = card.getAttribute('data-id') || '';
            const requiredItem = card.getAttribute('data-required') || '';
            const consumeItem = card.getAttribute('data-consume') === 'true';

            if (requiredItem) {
                const hasItem = this.checkPlayerHasItem(requiredItem);
                if (!hasItem) {
                    this.showToast('🔒 進入「呢喃迷霧森林」需要「懷錶」\n⌚ 可以在每日獎勵中獲得');
                    return;
                }

                if (consumeItem) {
                    const count = this.getItemCount(requiredItem);
                    this.showConfirmModal(
                        '🌲 進入迷霧森林',
                        `你將消耗 1 枚「懷錶」進入呢喃迷霧森林。\n\n你目前持有 ${count} 枚懷錶。\n\n🌲 森林中藏有稀有素材與神秘故事...\n⏰ 今日開放時間有限，好好探索吧！`,
                        async () => {
                            const success = await this.consumeItem(requiredItem);
                            if (success) {
                                this.showToast(`🌲 你進入了呢喃迷霧森林...\n⌚ 消耗了 1 枚懷錶`);
                                this.onSelectLocation(locId);
                                this.remove();
                            } else {
                                this.showToast('❌ 消耗懷錶失敗，請稍後再試');
                            }
                        },
                        () => {
                            console.log('🚫 取消進入森林');
                        }
                    );
                    return;
                }
            }

            if (locId) {
                this.onSelectLocation(locId);
                this.remove();
            }
        });
    }

    // ✅ 修正：Toast 移到頂部
    private showToast(message: string) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(28, 23, 20, 0.95);
            border: 2px solid rgba(234, 179, 8, 0.3);
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
        }, 3000);
    }

    private showConfirmModal(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(18, 16, 14, 0.8); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center;
            z-index: 2000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 16px; box-sizing: border-box;
            animation: mapPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `;
        backdrop.innerHTML = `
            <div style="
                background: #1c1714; border: 1px solid rgba(234, 179, 8, 0.3);
                border-radius: 20px; padding: 24px; width: 100%; max-width: 360px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8); text-align: center;
                box-sizing: border-box;
            ">
                <div style="font-size: 32px; margin-bottom: 8px;">${title.split(' ')[0]}</div>
                <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #fff;">${title}</h3>
                <p style="margin: 0 0 20px 0; font-size: 13px; color: #a89f91; line-height: 1.6; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 10px;">
                    <button id="modal-cancel-btn" style="
                        flex: 1; padding: 10px; background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #a89f91;
                        font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    ">再想想</button>
                    <button id="modal-confirm-btn" style="
                        flex: 1; padding: 10px; background: rgba(234, 179, 8, 0.15);
                        border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 10px; color: #fde047;
                        font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                    ">🌲 進入森林</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);

        const confirmBtn = backdrop.querySelector('#modal-confirm-btn');
        const cancelBtn = backdrop.querySelector('#modal-cancel-btn');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                backdrop.remove();
                onConfirm();
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                backdrop.remove();
                if (onCancel) onCancel();
            });
        }
    }

    private showUnavailableFeedback(card: HTMLElement) {
        const originalBorder = card.style.borderColor;
        card.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        card.style.transition = 'border-color 0.2s';
        setTimeout(() => {
            card.style.borderColor = originalBorder || 'rgba(255, 255, 255, 0.06)';
        }, 400);
    }

    public remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}