export class TownMapUI {
    private onSelectLocation: (locationId: string) => void;
    private onClose: () => void;
    private overlayContainer: HTMLDivElement | null = null;

    private locations = [
        { id: 'cafe', code: '01', name: '寧靜咖啡館', desc: '歇腳、喝杯熱茶與交換情報的集散地', status: '營業中' },
        { id: 'fountain', code: '02', name: '中央記憶噴泉', desc: '鎮民聚集許願與流傳傳說之處', status: '微風徐徐' },
        { id: 'alley', code: '03', name: '老街巷弄', desc: '充滿未知的舊街區，常有意外收穫', status: '探索中' },
        { id: 'terminal', code: '04', name: '小鎮公告欄', desc: '查看最新佈告與解鎖日常任務的樞紐', status: '可查閱' }
    ];

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
            `;
            document.head.appendChild(style);
        }
    }

    private render() {
        this.remove();

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

        this.overlayContainer.innerHTML = `
            <div style="
                background: #1c1714;
                border: 1px solid rgba(234, 179, 8, 0.25);
                border-radius: 24px; padding: 28px; width: 100%; max-width: 480px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                color: #f3f0ea;
                animation: mapPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                display: flex; flex-direction: column; gap: 20px;
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
                        漫步指南
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
                    選擇今天想要前往的停靠點，開啟你的小鎮日常。
                </p>

                <!-- 地點列表 -->
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${this.locations.map(loc => `
                        <div class="town-location-card" data-id="${loc.id}" style="
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.06);
                            border-radius: 14px; padding: 14px 18px;
                            cursor: pointer; transition: all 0.2s ease;
                            display: flex; justify-content: space-between; align-items: center;
                        ">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="font-size: 13px; font-weight: 700; color: #eab308; background: rgba(234,179,8,0.1); width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(234, 179, 8, 0.2);">
                                    ${loc.code}
                                </div>
                                <div>
                                    <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px;">${loc.name}</div>
                                    <div style="font-size: 12px; color: #a89f91; line-height: 1.3;">${loc.desc}</div>
                                </div>
                            </div>
                            <div style="font-size: 11px; font-weight: 500; color: #a89f91; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 8px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.04);">
                                ${loc.status}
                            </div>
                        </div>
                    `).join('')}
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