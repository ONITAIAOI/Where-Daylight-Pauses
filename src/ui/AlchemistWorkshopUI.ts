import { ITEM_DATABASE, ALCHEMY_RECIPES } from '../config/itemRegistry';
import { getPlayerProfile, savePlayerProfile } from '../firebase/playerData';

// 心情狀態定義
const MOOD_STATES: Record<string, { icon: string; bonus: number }> = {
    '平安沉靜': { icon: '🍵', bonus: 15 },
    '些許疲憊': { icon: '🌙', bonus: -20 },
    '期待探險': { icon: '🧭', bonus: 5 },
    '悠閒隨性': { icon: '🍃', bonus: 0 }
};

// 稀有度基礎成功率
const RARITY_BASE_SUCCESS: Record<string, number> = {
    'common': 70,
    'rare': 55,
    'epic': 40
};

export interface RecipeDisplay {
    resultId: string;
    resultName: string;
    resultIcon: string;
    resultRarity: string;
    materials: { itemId: string; itemName: string; icon: string; need: number; has: number }[];
    canCraft: boolean;
    successRate: number;
}

export class AlchemistWorkshopUI {
    private userId: string;
    private onCraft: (recipeId: string, refreshUI: () => void) => void;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;
    private currentTab: 'all' | 'potion' | 'material' | 'special' = 'all';
    private playerInventory: Record<string, number> = {};
    private currentMood: string = '平安沉靜';
    private isLoading: boolean = false;

    constructor(
        userId: string,
        onCraft: (recipeId: string, refreshUI: () => void) => void,
        onClose: () => void
    ) {
        this.userId = userId;
        this.onCraft = onCraft;
        this.onClose = onClose;

        this.injectGlobalStyles();
        this.loadPlayerData().then(() => {
            this.render();
        });
    }

    private async loadPlayerData() {
        try {
            const profile = await getPlayerProfile(this.userId);
            if (profile) {
                const rawInventory = (profile as any).inventory || {};
                
                // ✅ 轉換陣列為物件
                if (Array.isArray(rawInventory)) {
                    this.playerInventory = {};
                    for (const item of rawInventory) {
                        const id = item.id || item.itemId;
                        if (id) {
                            this.playerInventory[id] = (this.playerInventory[id] || 0) + (item.count || 1);
                        }
                    }
                } else {
                    this.playerInventory = rawInventory;
                }
                
                this.currentMood = (profile as any).mood || '平安沉靜';
                
                console.log('📦 背包已載入:', this.playerInventory);
            }
        } catch (error) {
            console.error('讀取玩家資料失敗:', error);
        }
    }

    private getRecipes(): RecipeDisplay[] {
        const result: RecipeDisplay[] = [];

        for (const recipe of ALCHEMY_RECIPES) {
            const resultItem = ITEM_DATABASE[recipe.resultId];
            if (!resultItem) continue;

            const materials = recipe.materials.map(mat => {
                const itemDef = ITEM_DATABASE[mat.itemId];
                const has = this.playerInventory[mat.itemId] || 0;
                return {
                    itemId: mat.itemId,
                    itemName: itemDef?.name || mat.itemId,
                    icon: itemDef?.icon || '❓',
                    need: mat.count,
                    has: has
                };
            });

            const canCraft = materials.every(m => m.has >= m.need);

            const rarity = resultItem.rarity || 'common';
            const baseRate = RARITY_BASE_SUCCESS[rarity] || 60;
            const moodBonus = MOOD_STATES[this.currentMood]?.bonus || 0;
            const recipeBonus = recipe.successRateBonus || 0;
            const successRate = Math.min(Math.max(baseRate + moodBonus + recipeBonus, 5), 95);

            result.push({
                resultId: recipe.resultId,
                resultName: resultItem.name,
                resultIcon: resultItem.icon,
                resultRarity: resultItem.rarity || 'common',
                materials: materials,
                canCraft: canCraft,
                successRate: successRate
            });
        }

        return result;
    }

    private injectGlobalStyles() {
        if (!document.getElementById('workshop-styles')) {
            const style = document.createElement('style');
            style.id = 'workshop-styles';
            style.innerHTML = `
                @keyframes workshopPopIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes craftSuccess {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); background: rgba(52, 211, 153, 0.2); }
                    100% { transform: scale(1); }
                }
                @keyframes craftFail {
                    0% { transform: scale(1); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                    100% { transform: translateX(0); }
                }
                @keyframes toastFadeInTop {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes toastFadeOutTop {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -15px); }
                }
                .workshop-recipe-card:hover {
                    background: rgba(234, 179, 8, 0.06) !important;
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
                }
                .workshop-tab-btn.active {
                    background: rgba(234, 179, 8, 0.15) !important;
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    color: #fde047 !important;
                }
                .craft-btn.can-craft:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
                }
                .craft-btn.can-craft:active {
                    transform: translateY(0) scale(0.97);
                }

                #workshop-content-scroll::-webkit-scrollbar {
                    display: none !important;
                    width: 0px !important;
                    height: 0px !important;
                }
                #workshop-content-scroll {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    private showToast(message: string, isSuccess: boolean = true) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(28, 23, 20, 0.95);
            border: 2px solid ${isSuccess ? 'rgba(52, 211, 153, 0.6)' : 'rgba(239, 68, 68, 0.6)'};
            color: #f3f0ea; padding: 14px 24px; border-radius: 14px;
            font-size: 14px; font-weight: 600; text-align: center;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
            z-index: 9999; backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            animation: toastFadeInTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            max-width: 80vw; box-sizing: border-box;
            line-height: 1.6;
            white-space: pre-line;
        `;
        toast.innerHTML = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 2500);
    }

    public render() {
        this.remove();

        const recipes = this.getRecipes();
        const filteredRecipes = this.currentTab === 'all'
            ? recipes
            : recipes.filter(r => {
                const item = ITEM_DATABASE[r.resultId];
                if (!item) return false;
                if (this.currentTab === 'potion') return item.category === 'consumable';
                if (this.currentTab === 'material') return item.category === 'material';
                if (this.currentTab === 'special') return item.category === 'equipment';
                return true;
            });

        const moodInfo = MOOD_STATES[this.currentMood] || MOOD_STATES['平安沉靜'];
        const moodIcon = moodInfo.icon;
        const moodBonus = moodInfo.bonus;

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'alchemist-workshop-overlay';
        this.overlayContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 0; box-sizing: border-box; overflow: hidden;
        `;

        this.overlayContainer.innerHTML = `
            <div class="workshop-main-card" style="
                background: #1c1714;
                border: none;
                border-radius: 0;
                width: 100vw;
                max-width: 100vw;
                height: 100dvh;
                max-height: 100dvh;
                color: #f3f0ea;
                animation: workshopPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- 🌟 Banner 區塊 -->
                <div style="
                    position: relative;
                    height: clamp(130px, 22vh, 170px);
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.05) 35%, rgba(28, 23, 20, 0.92) 75%, #1c1714 100%), 
                                url('./assets/images/AlchemistWorkshopUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 14px 18px;
                    box-sizing: border-box;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 1;">
                        <button id="workshop-btn-close" style="
                            background: rgba(18, 16, 14, 0.75); backdrop-filter: blur(8px);
                            -webkit-backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.3); color: #fde047;
                            padding: 5px 14px; border-radius: 20px; cursor: pointer;
                            font-size: 12px; font-weight: 600; transition: all 0.2s;
                            display: flex; align-items: center; gap: 4px;
                        ">🗺️ 返回地圖</button>

                        <div style="display: flex; align-items: center; gap: 6px; background: rgba(18, 16, 14, 0.7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(234, 179, 8, 0.2);">
                            <span style="font-size: 14px;">${moodIcon}</span>
                            <span style="font-size: 10px; font-weight: 600; color: #eab308;">
                                ${this.currentMood} ${moodBonus >= 0 ? `+${moodBonus}%` : `${moodBonus}%`}
                            </span>
                        </div>
                    </div>

                    <div style="z-index: 1;">
                        <div style="font-size: 9px; font-weight: 600; color: #eab308; letter-spacing: 1.2px; margin-bottom: 1px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
                            ALCHEMICAL WORKSHOP
                        </div>
                        <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 8px;">
                            ⚗️ 星塵鍊金工房
                            <span style="font-size: 10px; font-weight: 400; color: #d4c9b8; text-shadow: none; letter-spacing: 0;">
                                · 今日加成 ${moodBonus >= 0 ? `+${moodBonus}%` : `${moodBonus}%`}
                            </span>
                        </h2>
                    </div>
                </div>

                <!-- 📂 分類 Tab 切換列 -->
                <div style="
                    display: flex; gap: 6px; padding: 12px 18px 0 18px; flex-shrink: 0;
                    flex-wrap: wrap;
                    background: #1c1714;
                ">
                    <button class="workshop-tab-btn ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all" style="
                        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #a89f91; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    ">📋 全部</button>
                    <button class="workshop-tab-btn ${this.currentTab === 'potion' ? 'active' : ''}" data-tab="potion" style="
                        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #a89f91; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    ">🧪 飲品茶點</button>
                    <button class="workshop-tab-btn ${this.currentTab === 'material' ? 'active' : ''}" data-tab="material" style="
                        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #a89f91; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    ">🌾 素材</button>
                    <button class="workshop-tab-btn ${this.currentTab === 'special' ? 'active' : ''}" data-tab="special" style="
                        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #a89f91; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    ">🎐 紀念物</button>
                </div>

                <!-- 📜 配方列表區塊 -->
                <div id="workshop-content-scroll" style="
                    display: flex; flex-direction: column; gap: 10px; 
                    overflow-y: auto; flex: 1; padding: 14px 18px 14px 18px;
                    -webkit-overflow-scrolling: touch;
                    background: #1c1714;
                ">
                    ${filteredRecipes.length === 0 ? `
                        <div style="text-align: center; color: #a89f91; padding: 40px 0; font-size: 14px;">
                            🌿 這個分類還沒有可合成的配方喔
                        </div>
                    ` : filteredRecipes.map(recipe => {
                        const rarityColor = recipe.resultRarity === 'epic' ? '#d8b4fe' : 
                                           recipe.resultRarity === 'rare' ? '#60a5fa' : '#a89f91';
                        const rarityLabel = recipe.resultRarity === 'epic' ? '✨ 史詩' : 
                                           recipe.resultRarity === 'rare' ? '⭐ 稀有' : '• 一般';
                        const successColor = recipe.successRate >= 70 ? '#34d399' :
                                            recipe.successRate >= 40 ? '#fbbf24' : '#f87171';

                        return `
                            <div class="workshop-recipe-card" style="
                                background: rgba(255, 255, 255, 0.02);
                                border: 1px solid rgba(255, 255, 255, 0.06);
                                border-radius: 14px; padding: 12px 14px;
                                display: flex; flex-direction: column; gap: 8px;
                                transition: all 0.2s ease;
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="font-size: 22px; background: rgba(234,179,8,0.08); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(234, 179, 8, 0.2); flex-shrink: 0;">
                                            ${recipe.resultIcon}
                                        </div>
                                        <div>
                                            <div style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 1px;">
                                                ${recipe.resultName}
                                                <span style="font-size: 9px; font-weight: 400; color: ${rarityColor}; margin-left: 6px;">${rarityLabel}</span>
                                            </div>
                                            <div style="font-size: 11px; color: #a89f91; line-height: 1.3;">
                                                ${ITEM_DATABASE[recipe.resultId]?.desc || ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style="
                                    background: rgba(0, 0, 0, 0.25); border-radius: 10px; padding: 8px 12px;
                                    display: flex; align-items: center; justify-content: space-between; font-size: 11px;
                                    flex-wrap: wrap; gap: 6px;
                                ">
                                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                        ${recipe.materials.map(mat => {
                                            const isEnough = mat.has >= mat.need;
                                            return `<span style="color: ${isEnough ? '#a89f91' : '#f87171'}; display: flex; align-items: center; gap: 2px;">
                                                ${mat.icon} ${mat.itemName}: <strong style="color: ${isEnough ? '#fff' : '#f87171'};">${mat.has}/${mat.need}</strong>
                                            </span>`;
                                        }).join('')}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                                        <span style="font-size: 10px; color: ${successColor}; font-weight: 500;">
                                            🎯 ${recipe.successRate}%
                                        </span>
                                        <button class="craft-btn ${recipe.canCraft ? 'can-craft' : ''}" 
                                                data-id="${recipe.resultId}" 
                                                data-can="${recipe.canCraft}"
                                                ${!recipe.canCraft ? 'disabled' : ''}
                                                style="
                                                    background: ${recipe.canCraft ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'rgba(255,255,255,0.05)'};
                                                    color: ${recipe.canCraft ? '#1c1714' : '#6b655b'};
                                                    border: none; padding: 5px 14px; border-radius: 8px;
                                                    font-size: 11px; font-weight: 700; 
                                                    cursor: ${recipe.canCraft ? 'pointer' : 'not-allowed'};
                                                    transition: all 0.2s; white-space: nowrap;
                                                    opacity: ${recipe.canCraft ? '1' : '0.5'};
                                                ">${recipe.canCraft ? '⚗️ 合成' : '材料不足'}</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- 💡 底部提示列 -->
                <div style="
                    background: rgba(234, 179, 8, 0.06); border-top: 1px solid rgba(234, 179, 8, 0.15);
                    padding: 10px 18px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
                    background: #1c1714;
                ">
                    <span style="font-size: 15px;">💡</span>
                    <div style="font-size: 11px; color: #fde047; line-height: 1.4;">
                        <strong>今日心情：${this.currentMood}</strong> ${moodBonus >= 0 ? `✨ 合成成功率 +${moodBonus}%` : `🌙 合成成功率 ${moodBonus}%`}
                        <span style="color: #a89f91; margin-left: 8px;">· 集齊材料即可開始製作</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private async performCraft(recipeId: string) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const recipe = ALCHEMY_RECIPES.find(r => r.resultId === recipeId);
            if (!recipe) {
                this.showToast('❌ 找不到這個配方', false);
                this.isLoading = false;
                return;
            }

            const profile = await getPlayerProfile(this.userId);
            if (!profile) {
                this.showToast('❌ 讀取玩家資料失敗', false);
                this.isLoading = false;
                return;
            }

            // ✅ 讀取最新背包（支援陣列格式）
            let inventory = (profile as any).inventory || {};
            if (Array.isArray(inventory)) {
                const invObj: Record<string, number> = {};
                for (const item of inventory) {
                    const id = item.id || item.itemId;
                    if (id) {
                        invObj[id] = (invObj[id] || 0) + (item.count || 1);
                    }
                }
                inventory = invObj;
            }
            
            // ✅ 檢查材料是否足夠
            const allEnough = recipe.materials.every(mat => (inventory[mat.itemId] || 0) >= mat.count);
            if (!allEnough) {
                this.showToast('❌ 材料不足，無法合成', false);
                this.isLoading = false;
                return;
            }

            const resultItem = ITEM_DATABASE[recipe.resultId];
            const rarity = resultItem?.rarity || 'common';
            const baseRate = RARITY_BASE_SUCCESS[rarity] || 60;
            const moodBonus = MOOD_STATES[this.currentMood]?.bonus || 0;
            const recipeBonus = recipe.successRateBonus || 0;
            const successRate = Math.min(Math.max(baseRate + moodBonus + recipeBonus, 5), 95);

            const roll = Math.random() * 100;
            const isSuccess = roll <= successRate;

            // ✅ 扣除材料
            const updatedInventory = { ...inventory };
            for (const mat of recipe.materials) {
                updatedInventory[mat.itemId] = (updatedInventory[mat.itemId] || 0) - mat.count;
                if (updatedInventory[mat.itemId] <= 0) {
                    delete updatedInventory[mat.itemId];
                }
            }

            if (isSuccess) {
                updatedInventory[recipeId] = (updatedInventory[recipeId] || 0) + 1;
            }

            // ✅ 轉回陣列格式儲存
            const inventoryArray = Object.entries(updatedInventory).map(([id, count]) => ({
                id: id,
                count: count as number
            }));

            const updatedProfile = {
                ...profile,
                inventory: inventoryArray
            };

            await savePlayerProfile(this.userId, updatedProfile);

            // ✅ 更新本地快取
            this.playerInventory = updatedInventory;

            if (isSuccess) {
                const itemName = resultItem?.name || recipeId;
                const itemIcon = resultItem?.icon || '🎁';
                this.showToast(`✨ 合成成功！\n${itemIcon} 獲得了「${itemName}」`, true);
            } else {
                this.showToast(`🌙 合成失敗...\n材料已消耗，下次再試試吧！`, false);
            }

            this.render();

            if (this.onCraft) {
                this.onCraft(recipeId, () => {});
            }

        } catch (error) {
            console.error('合成失敗:', error);
            this.showToast('❌ 合成過程發生錯誤', false);
        }

        this.isLoading = false;
    }

    private bindEvents() {
        if (!this.overlayContainer) return;

        this.overlayContainer.addEventListener('click', (e) => {
            const targetBtn = (e.target as HTMLElement).closest('button');
            if (!targetBtn) return;

            if (targetBtn.id === 'workshop-btn-close') {
                this.remove();
                if (this.onClose) {
                    this.onClose();
                }
                return;
            }

            if (targetBtn.classList.contains('workshop-tab-btn')) {
                const tab = targetBtn.getAttribute('data-tab') as any;
                if (tab && this.currentTab !== tab) {
                    this.currentTab = tab;
                    this.render();
                }
                return;
            }

            if (targetBtn.classList.contains('craft-btn')) {
                const canCraft = targetBtn.getAttribute('data-can') === 'true';
                if (!canCraft) return;

                const recipeId = targetBtn.getAttribute('data-id') || '';
                if (recipeId) {
                    this.performCraft(recipeId);
                }
                return;
            }
        });
    }

    public remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}