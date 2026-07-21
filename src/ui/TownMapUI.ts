export class TownMapUI {
    private onSelectLocation: (locationId: string) => void;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;

    private getLocationsWithDynamicStatus() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (週日) 到 6 (週六)
        const dateOfMonth = now.getDate(); // 當月幾號 (1-31)

        // 規則 1：迷霧森林 -> 每週固定時間開放 (設定為週三、週六、週日開放)
        const isForestOpen = [0, 3, 6].includes(dayOfWeek);

        // 規則 2：失落遺跡 -> 隨機時間開放 (用當天日期算取一個穩定的開關，確保今天整天狀態固定)
        const isRuinsOpen = (dateOfMonth * 7) % 3 === 0; // 用簡單的數學基數模擬每日隨機，但當天不變

        return [
            // 🏠 城鎮日常與設施 (每天固定開放)
            { id: 'terminal', code: '01', name: '小鎮公告欄', desc: '查看最新佈告與解鎖日常任務的樞紐', status: '今日熱鬧', category: 'town', active: true },
            { id: 'cafe', code: '02', name: '寧靜咖啡館', desc: '歇腳、喝杯熱茶與交換情報的集散地', status: '營業中', category: 'town', active: true },
            { id: 'fountain', code: '03', name: '中央記憶噴泉', desc: '鎮民聚集許願與流傳傳說之處', status: '微風徐徐', category: 'town', active: true },
            { id: 'shop', code: '04', name: '時光雜貨舖', desc: '販售各式日常道具、特產與實用小物的地方', status: '營業中', category: 'town', active: true },
            { id: 'treehouse', code: '05', name: '許願樹屋', desc: '座落在大樹上的休憩所，適合沉澱心靈', status: '微光', category: 'town', active: true },
            { id: 'gallery', code: '06', name: '記憶迴廊', desc: '收藏過往點滴、回顧小鎮故事的藝廊', status: '靜謐', category: 'town', active: true },

            // 🧭 戶外探險與委託 (依規則判定)
            { id: 'alley', code: '07', name: '老街巷弄', desc: '充滿未知的舊街區，常有意外收穫', status: '可探索', category: 'adventure', active: true }, // 每天固定開
            { id: 'forest', code: '08', name: '呢喃迷霧森林', desc: '樹影婆娑的神秘林道，適合採集稀有素材 (每週三、六、日開放)', status: isForestOpen ? '可進入' : '今日休養', category: 'adventure', active: isForestOpen },
            { id: 'ruins', code: '09', name: '失落遺跡', desc: '埋藏著古老文明與危險挑戰的禁忌之地 (隨機時間開放)', status: isRuinsOpen ? '高風險' : '遺跡封印中', category: 'adventure', active: isRuinsOpen },
            { id: 'guild', code: '10', name: '冒險者工會', desc: '接受委託、挑戰各種冒險任務的地方', status: '開放中', category: 'adventure', active: true }, // 每天固定開

            // ⚗️ 專業工坊與合成 (每天固定開放)
            { id: 'alchemist', code: '11', name: '星塵鍊金工房', desc: '將收集到的各種素材與道具進行合成與轉化', status: '營業中', category: 'workshop', active: true }
        ];
    }

    constructor(onSelectLocation: (locationId: string) => void, onClose: () => void) {
        this.onSelectLocation = onSelectLocation;
        this.onClose = onClose;

        this.injectGlobalStyles();
        this.render();
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
                #town-map-content-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                #town-map-content-scroll::-webkit-scrollbar-thumb {
                    background: rgba(234, 179, 8, 0.2);
                    border-radius: 4px;
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
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px; box-sizing: border-box;
        `;

        const categoryTitles: { [key: string]: { label: string, icon: string } } = {
            town: { label: '城鎮日常與設施', icon: '🏠' },
            adventure: { label: '戶外探險與委託', icon: '🧭' },
            workshop: { label: '專業工坊與合成', icon: '⚗️' }
        };

        const categories = ['town', 'adventure', 'workshop'];

        this.overlayContainer.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.25);
                border-radius: 24px; padding: 28px; width: 100%; max-width: 540px;
                max-height: 90vh;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea;
                animation: mapPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex; flex-direction: column; gap: 14px;
            ">
                <!-- 頂部返回按鈕與標籤區 -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
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

                <!-- 標題區 -->
                <div>
                    <div style="font-size: 11px; font-weight: 600; color: #eab308; letter-spacing: 1.5px; margin-bottom: 2px;">
                        EXPLORATION GUIDE
                    </div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">
                        🧭 小鎮探索地圖
                    </h2>
                </div>

                <p style="margin: 0; font-size: 13px; color: #a89f91; line-height: 1.4;">
                    隨心所欲散步吧！部分秘境依據日程或天候開放，看看今天哪裡可以去。
                </p>

                <!-- 地點列表 -->
                <div id="town-map-content-scroll" style="
                    display: flex; flex-direction: column; gap: 14px; 
                    overflow-y: auto; padding-right: 4px; max-height: 360px;
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
                                    ${catLocations.map(loc => `
                                        <div class="town-location-card ${loc.active ? '' : 'inactive'}" data-id="${loc.id}" data-active="${loc.active}" style="
                                            background: rgba(255, 255, 255, 0.02);
                                            border: 1px solid rgba(255, 255, 255, 0.06);
                                            border-radius: 14px; padding: 12px 16px;
                                            cursor: pointer; transition: all 0.2s ease;
                                            display: flex; justify-content: space-between; align-items: center;
                                        ">
                                            <div style="display: flex; align-items: center; gap: 14px;">
                                                <div style="font-size: 13px; font-weight: 700; color: #eab308; background: rgba(234,179,8,0.1); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(234, 179, 8, 0.2); flex-shrink: 0;">
                                                    ${loc.code}
                                                </div>
                                                <div>
                                                    <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px;">${loc.name}</div>
                                                    <div style="font-size: 12px; color: #a89f91; line-height: 1.3;">${loc.desc}</div>
                                                </div>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 500; color: ${loc.active ? '#eab308' : '#a89f91'}; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 8px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.04);">
                                                ${loc.status}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- 溫馨小 TIP 提示列 -->
                <div style="
                    background: rgba(234, 179, 8, 0.06);
                    border: 1px dashed rgba(234, 179, 8, 0.3);
                    border-radius: 12px; padding: 10px 14px;
                    display: flex; align-items: center; gap: 10px;
                ">
                    <span style="font-size: 16px;">💡</span>
                    <div style="font-size: 12px; color: #fde047; line-height: 1.4;">
                        <strong>小鎮小貼士：</strong> 巷弄、工坊與日常設施天天開放，迷霧森林與失落遺跡則需要碰點運氣和看日子造訪喔！
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlayContainer);
        this.bindEvents();
    }

    private bindEvents() {
        document.querySelectorAll('.town-location-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const isActive = target.getAttribute('data-active') === 'true';
                
                if (!isActive) {
                    return; // 休息中或未開放的地點無法點擊進入
                }

                const locId = target.getAttribute('data-id') || '';
                this.onSelectLocation(locId);
                this.remove();
            });
        });

        const closeBtn = document.getElementById('map-btn-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.onClose();
                this.remove();
            };
        }
    }

    public remove() {
        if (this.overlayContainer) {
            this.overlayContainer.remove();
            this.overlayContainer = null;
        }
    }
}