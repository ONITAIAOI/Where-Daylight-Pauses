import { PlayerProfile, savePlayerProfile, getPlayerProfile } from '../firebase/playerData';
import { CHAT_SKINS, ChatSkinConfig } from '../config/chatSkinsConfig';

export class RestHouseUI {
    private uid: string;
    private container: HTMLDivElement | null = null;
    private timerInterval: any = null;
    private onBackToMain: () => void;
    private activeTab: 'rest' | 'wardrobe' = 'rest'; // 當前分頁：休息 vs 衣櫥

    constructor(uid: string, onBackToMain: () => void) {
        this.uid = uid;
        this.onBackToMain = onBackToMain;
        this.injectStyles();
        this.render();
    }

    private injectStyles() {
        if (!document.getElementById('rest-house-styles')) {
            const style = document.createElement('style');
            style.id = 'rest-house-styles';
            style.innerHTML = `
                @keyframes restFadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .rest-action-btn:hover {
                    border-color: rgba(234, 179, 8, 0.5) !important;
                    background: rgba(234, 179, 8, 0.08) !important;
                    transform: translateY(-1px);
                }
                .skin-card {
                    transition: all 0.2s ease;
                }
                .skin-card:hover {
                    border-color: rgba(234, 179, 8, 0.4) !important;
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }
    }

    private async render() {
        this.remove();

        const profile = await getPlayerProfile(this.uid);
        if (!profile) return;

        const profileAny = profile as any;
        const restingUntil = profileAny?.restingUntil ? new Date(profileAny.restingUntil).getTime() : 0;
        const now = Date.now();
        const isResting = restingUntil > now;

        this.container = document.createElement('div');
        this.container.id = 'rest-house-overlay';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #1f1a17 0%, #12100e 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #f3f0ea; padding: 20px; box-sizing: border-box;
            animation: restFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `;

        this.container.innerHTML = `
            <!-- 主卡片容器 -->
            <div style="
                position: relative; z-index: 1;
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.2);
                border-radius: 24px; width: 100%; max-width: 500px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column;
                max-height: 92vh;
            ">
                <!-- 上方視覺 Header 區 -->
                <div style="
                    position: relative; height: 150px;
                    background: linear-gradient(180deg, rgba(28, 23, 20, 0.2) 0%, rgba(28, 23, 20, 0.5) 50%, #1c1714 100%), 
                                url('./assets/images/RestHouseUI.png') center/cover no-repeat;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 18px 24px; box-sizing: border-box;
                    border-top-left-radius: 24px; border-top-right-radius: 24px;
                ">
                    <!-- 上排：返回按鈕與貨幣顯示 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; z-index: 1;">
                        <button id="rest-back-btn" style="
                            background: rgba(28, 23, 20, 0.75); backdrop-filter: blur(8px);
                            border: 1px solid rgba(234, 179, 8, 0.3); color: #fde047;
                            padding: 6px 14px; border-radius: 20px; cursor: pointer;
                            font-size: 12px; font-weight: 600; transition: all 0.2s;
                        ">⬅ 返回小鎮</button>

                        <div style="display: flex; gap: 10px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); font-size: 12px; font-weight: 600;">
                            <span style="color: #eab308;">☀️ ${profileAny.sunCoins ?? 100}</span>
                            <span style="color: #38bdf8;">🌟 ${profileAny.memorialTokens ?? 10}</span>
                        </div>
                    </div>

                    <!-- 下排：標題與副標 -->
                    <div style="z-index: 1;">
                        <div style="font-size: 11px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                            SERENE COTTAGE
                        </div>
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                            心境小屋
                        </h1>
                    </div>
                </div>

                <!-- 分頁切換 Tab 列 -->
                <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); background: #161210;">
                    <button id="tab-rest-btn" style="
                        flex: 1; padding: 12px; background: ${this.activeTab === 'rest' ? '#1c1714' : 'transparent'};
                        border: none; border-bottom: 2px solid ${this.activeTab === 'rest' ? '#eab308' : 'transparent'};
                        color: ${this.activeTab === 'rest' ? '#fde047' : '#a89f91'}; font-size: 13px; font-weight: 600; cursor: pointer;
                    ">🌙 小屋休憩</button>
                    <button id="tab-wardrobe-btn" style="
                        flex: 1; padding: 12px; background: ${this.activeTab === 'wardrobe' ? '#1c1714' : 'transparent'};
                        border: none; border-bottom: 2px solid ${this.activeTab === 'wardrobe' ? '#eab308' : 'transparent'};
                        color: ${this.activeTab === 'wardrobe' ? '#fde047' : '#a89f91'}; font-size: 13px; font-weight: 600; cursor: pointer;
                    ">💬 對話框衣櫥</button>
                </div>

                <!-- 下方內容區 -->
                <div id="rest-house-body-content" style="padding: 20px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #1c1714; flex: 1;">
                    ${this.activeTab === 'rest' ? this.renderRestTabContent(profile, isResting, restingUntil) : this.renderWardrobeTabContent(profile)}
                </div>
            </div>

            <!-- 質感自定義彈窗容器 -->
            <div id="custom-modal-backdrop" style="
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(8px);
                display: none; justify-content: center; align-items: center; z-index: 2000;
            ">
                <div id="custom-modal-box" style="
                    background: #1c1714;
                    border: 1px solid rgba(234, 179, 8, 0.4);
                    border-radius: 20px; padding: 28px; width: 90%; max-width: 360px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8); text-align: center;
                    animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                ">
                    <div id="modal-icon" style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
                    <h3 id="modal-title" style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #fff;">提示標題</h3>
                    <p id="modal-desc" style="margin: 0 0 22px 0; font-size: 13px; color: #a89f91; line-height: 1.6; white-space: pre-line;">提示內容</p>
                    <div id="modal-buttons" style="display: flex; gap: 10px;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents(restingUntil);

        if (this.activeTab === 'rest' && isResting) {
            this.startCountdown(restingUntil);
        }
    }

    private renderRestTabContent(profile: PlayerProfile, isResting: boolean, restingUntil: number): string {
        return `
            <div style="font-size: 12px; font-weight: 600; color: #a89f91; letter-spacing: 0.5px;">小屋休憩室</div>
            <p style="margin: 0; font-size: 13px; color: #a89f91; line-height: 1.6;">
                放慢腳步，沈澱心靈。在此沉睡 8 小時可獲得療癒，累積獲得 <span style="color: #eab308; font-weight: 600;">☀️ 500 暖陽幣</span>。
            </p>
            <div id="rest-content-area" style="display: flex; flex-direction: column; gap: 14px;">
                ${isResting ? this.renderRestingHTML(restingUntil) : this.renderReadyHTML()}
            </div>
        `;
    }

    private renderWardrobeTabContent(profile: PlayerProfile): string {
        const profileAny = profile as any;
        const unlocked = profileAny.unlockedChatSkins ?? ['default'];
        const equipped = profileAny.equippedChatSkin ?? 'default';

        let skinsHTML = '';
        for (const skinId in CHAT_SKINS) {
            const skin = CHAT_SKINS[skinId];
            const isUnlocked = unlocked.includes(skin.id);
            const isEquipped = equipped === skin.id;

            let actionBtnHTML = '';
            if (isEquipped) {
                actionBtnHTML = `<span style="font-size: 12px; font-weight: 700; color: #4ade80; background: rgba(34,197,94,0.1); padding: 6px 12px; border-radius: 8px;">使用中</span>`;
            } else if (isUnlocked) {
                actionBtnHTML = `<button class="equip-skin-btn" data-skin-id="${skin.id}" style="padding: 6px 14px; background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; color: #fde047; font-size: 12px; font-weight: 600; cursor: pointer;">裝備</button>`;
            } else {
                const currencyIcon = skin.currency === 'sunCoins' ? '☀️' : '🌟';
                actionBtnHTML = `<button class="buy-skin-btn" data-skin-id="${skin.id}" style="padding: 6px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; color: #7dd3fc; font-size: 12px; font-weight: 600; cursor: pointer;">解鎖 (${currencyIcon} ${skin.price})</button>`;
            }

            skinsHTML += `
                <div class="skin-card" style="
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px;">${skin.name}</div>
                            <div style="font-size: 12px; color: #a89f91; line-height: 1.4;">${skin.description}</div>
                        </div>
                        <div>${actionBtnHTML}</div>
                    </div>
                    <!-- 預覽對話框 -->
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <div style="${skin.bubbleStyle}; ${skin.textStyle}; padding: 8px 14px; border-radius: 12px; font-size: 12px; max-width: 80%; text-align: left;">
                            這是在鎮民廣場發話的預覽效果... ✨
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="font-size: 12px; font-weight: 600; color: #a89f91; letter-spacing: 0.5px;">個人化對話框衣櫥</div>
            <p style="margin: 0; font-size: 13px; color: #a89f91; line-height: 1.6;">
                選擇或解鎖你的專屬對話框樣式，讓你在「鎮民廣場」的發言更加獨一無二。
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${skinsHTML}
            </div>
        `;
    }

    private renderReadyHTML(): string {
        return `
            <div style="background: rgba(255, 255, 255, 0.02); border-radius: 12px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 13px; font-weight: 600; color: #eab308; margin-bottom: 6px;">💡 休息須知</div>
                <div style="font-size: 12px; color: #a89f91; line-height: 1.6; text-align: left;">
                    • 點擊開始休息後，將進入 8 小時沉澱期。<br>
                    • 期間將無法進行探索小鎮等互動（聊天大廳除外）。<br>
                    • 倒數結束後可領取 500 暖陽幣獎勵。
                </div>
            </div>
            <button id="start-rest-btn" class="rest-action-btn" style="
                width: 100%; padding: 14px;
                background: rgba(234, 179, 8, 0.15);
                border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 12px; color: #fde047;
                font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
            ">🌙 開始沉澱休息 (8小時)</button>
        `;
    }

    private renderRestingHTML(restingUntil: number): string {
        const remaining = Math.max(0, restingUntil - Date.now());
        const isReadyToClaim = remaining === 0;

        if (isReadyToClaim) {
            return `
                <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 6px;">🎉</div>
                    <div style="font-size: 15px; font-weight: 700; color: #4ade80; margin-bottom: 4px;">心靈已完全充電！</div>
                    <div style="font-size: 12px; color: #a89f91;">你已完成 8 小時的深度休息。</div>
                </div>
                <button id="claim-rest-btn" style="
                    width: 100%; padding: 14px;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    border: none; border-radius: 12px; color: #fff;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3); transition: all 0.2s;
                ">🎁 領取 500 暖陽幣獎勵</button>
            `;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        return `
            <div style="background: rgba(255, 255, 255, 0.02); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); text-align: center;">
                <div style="font-size: 12px; color: #a89f91; margin-bottom: 6px;">⏳ 休息沉澱倒數中</div>
                <div id="rest-countdown-text" style="font-size: 28px; font-weight: 800; color: #eab308; font-family: monospace; letter-spacing: 2px;">
                    ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
                </div>
                <div style="font-size: 11px; color: #a89f91; margin-top: 8px;">小鎮探索已暫停，好好享受寧靜時光吧</div>
            </div>
            <button disabled style="
                width: 100%; padding: 14px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; color: #a89f91;
                font-size: 14px; font-weight: 600; cursor: not-allowed;
            ">小屋休息中...</button>
        `;
    }

    private bindEvents(restingUntil: number) {
        const backBtn = document.getElementById('rest-back-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                this.remove();
                this.onBackToMain();
            };
        }

        const tabRestBtn = document.getElementById('tab-rest-btn');
        const tabWardrobeBtn = document.getElementById('tab-wardrobe-btn');
        if (tabRestBtn && tabWardrobeBtn) {
            tabRestBtn.onclick = () => {
                this.activeTab = 'rest';
                this.render();
            };
            tabWardrobeBtn.onclick = () => {
                this.activeTab = 'wardrobe';
                this.render();
            };
        }

        const startBtn = document.getElementById('start-rest-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                this.showConfirmModal({
                    icon: '🌙',
                    title: '確認進入休息嗎？',
                    desc: '點擊確認後將開始 8 小時休息！\n期間「小鎮探索」等功能將會鎖定無法使用（聊天大廳除外）。',
                    confirmText: '確定休息',
                    cancelText: '再想想',
                    onConfirm: () => {
                        this.executeStartRest();
                    }
                });
            };
        }

        const claimBtn = document.getElementById('claim-rest-btn');
        if (claimBtn) {
            claimBtn.onclick = () => {
                this.executeClaimReward();
            };
        }

        // 綁定裝備外觀按鈕
        const equipBtns = document.querySelectorAll('.equip-skin-btn');
        equipBtns.forEach(btn => {
            (btn as HTMLButtonElement).onclick = async (e) => {
                const skinId = (e.currentTarget as HTMLElement).getAttribute('data-skin-id');
                if (skinId) {
                    await this.executeEquipSkin(skinId);
                }
            };
        });

        // 綁定解鎖購買外觀按鈕
        const buyBtns = document.querySelectorAll('.buy-skin-btn');
        buyBtns.forEach(btn => {
            (btn as HTMLButtonElement).onclick = async (e) => {
                const skinId = (e.currentTarget as HTMLElement).getAttribute('data-skin-id');
                if (skinId) {
                    await this.executeBuySkin(skinId);
                }
            };
        });
    }

    private async executeEquipSkin(skinId: string) {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            // 儲存至 equippedChatSkin 欄位
            await savePlayerProfile(this.uid, {
                ...profile,
                equippedChatSkin: skinId
            } as any);

            this.render();
        } catch (error) {
            console.error('裝備外觀失敗:', error);
        }
    }

    private async executeBuySkin(skinId: string) {
        const skin = CHAT_SKINS[skinId];
        if (!skin) return;

        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const profileAny = profile as any;
            const sunCoins = profileAny.sunCoins ?? 100;
            const memorialTokens = profileAny.memorialTokens ?? 10;
            const unlocked = profileAny.unlockedChatSkins ?? ['default'];

            if (skin.currency === 'sunCoins' && sunCoins < skin.price) {
                this.showConfirmModal({
                    icon: '☀️',
                    title: '暖陽幣不足',
                    desc: `解鎖此造型需要 ${skin.price} 暖陽幣，你目前只有 ${sunCoins} 暖陽幣。`,
                    confirmText: '確定',
                    onConfirm: () => {}
                });
                return;
            }

            if (skin.currency === 'memorialTokens' && memorialTokens < skin.price) {
                this.showConfirmModal({
                    icon: '🌟',
                    title: '紀念章不足',
                    desc: `解鎖此造型需要 ${skin.price} 紀念章，你目前只有 ${memorialTokens} 紀念章。`,
                    confirmText: '確定',
                    onConfirm: () => {}
                });
                return;
            }

            // 扣除貨幣並加入解鎖清單，順便直接裝備
            const newSunCoins = skin.currency === 'sunCoins' ? sunCoins - skin.price : sunCoins;
            const newMemorialTokens = skin.currency === 'memorialTokens' ? memorialTokens - skin.price : memorialTokens;
            const newUnlocked = [...unlocked, skin.id];

            await savePlayerProfile(this.uid, {
                ...profile,
                sunCoins: newSunCoins,
                memorialTokens: newMemorialTokens,
                unlockedChatSkins: newUnlocked,
                equippedChatSkin: skin.id
            } as any);

            this.showConfirmModal({
                icon: '✨',
                title: '解鎖成功！',
                desc: `你已成功解鎖並裝備「${skin.name}」對話框外觀！`,
                confirmText: '太棒了',
                onConfirm: () => {
                    this.render();
                }
            });
        } catch (error) {
            console.error('購買外觀失敗:', error);
        }
    }

    private showConfirmModal(options: {
        icon: string;
        title: string;
        desc: string;
        confirmText: string;
        cancelText?: string;
        onConfirm: () => void;
    }) {
        const backdrop = document.getElementById('custom-modal-backdrop');
        const iconEl = document.getElementById('modal-icon');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const buttonsEl = document.getElementById('modal-buttons');

        if (!backdrop || !iconEl || !titleEl || !descEl || !buttonsEl) return;

        iconEl.innerText = options.icon;
        titleEl.innerText = options.title;
        descEl.innerText = options.desc;

        if (options.cancelText) {
            buttonsEl.innerHTML = `
                <button id="modal-cancel-btn" style="
                    flex: 1; padding: 10px; background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #a89f91;
                    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                ">${options.cancelText}</button>
                <button id="modal-confirm-btn" style="
                    flex: 1; padding: 10px; background: rgba(234, 179, 8, 0.2);
                    border: 1px solid rgba(234, 179, 8, 0.5); border-radius: 10px; color: #fde047;
                    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                ">${options.confirmText}</button>
            `;

            document.getElementById('modal-cancel-btn')!.onclick = () => {
                backdrop.style.display = 'none';
            };
        } else {
            buttonsEl.innerHTML = `
                <button id="modal-confirm-btn" style="
                    width: 100%; padding: 10px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    border: none; border-radius: 10px; color: #fff;
                    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                ">${options.confirmText}</button>
            `;
        }

        document.getElementById('modal-confirm-btn')!.onclick = () => {
            backdrop.style.display = 'none';
            options.onConfirm();
        };

        backdrop.style.display = 'flex';
    }

    private async executeStartRest() {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const restingUntilTime = Date.now() + 8 * 60 * 60 * 1000;

            await savePlayerProfile(this.uid, {
                ...profile,
                restingUntil: new Date(restingUntilTime).toISOString()
            } as any);

            this.render();
        } catch (error) {
            console.error('開始休息失敗:', error);
        }
    }

    private async executeClaimReward() {
        try {
            const profile = await getPlayerProfile(this.uid);
            if (!profile) return;

            const profileAny = profile as any;
            const currentCoins = profileAny.sunCoins ?? 100;

            await savePlayerProfile(this.uid, {
                ...profile,
                sunCoins: currentCoins + 500,
                restingUntil: null
            } as any);

            this.showConfirmModal({
                icon: '✨',
                title: '領取成功！',
                desc: '你已成功獲得 500 暖陽幣獎勵！',
                confirmText: '確定',
                onConfirm: () => {
                    this.render();
                }
            });
        } catch (error) {
            console.error('領取獎勵失敗:', error);
        }
    }

    private startCountdown(restingUntil: number) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            const remaining = Math.max(0, restingUntil - Date.now());
            const textEl = document.getElementById('rest-countdown-text');

            if (remaining === 0) {
                clearInterval(this.timerInterval);
                this.render();
                return;
            }

            if (textEl) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                textEl.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    private remove() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}