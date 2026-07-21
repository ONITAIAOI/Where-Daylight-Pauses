export class PassportUI {
    private container: HTMLDivElement | null = null;
    private onCompleteCallback: (data: { nickname: string; mood: string; item: string }) => void;

    constructor(onComplete: (data: { nickname: string; mood: string; item: string }) => void) {
        this.onCompleteCallback = onComplete;

        this.injectGlobalStyles();

        // 🔍 檢查是否已經有註冊紀錄
        const savedPassport = localStorage.getItem('daylight_passport');
        if (savedPassport) {
            try {
                const parsedData = JSON.parse(savedPassport);
                console.log('檢測到舊旅人通行證，直接進入小站:', parsedData);
                
                // 使用 setTimeout 確保調用時 main.ts 已準備就緒
                setTimeout(() => {
                    this.onCompleteCallback(parsedData);
                }, 0);
                return; // ⛔ 重點：直接返回，不執行顯示表單
            } catch (e) {
                console.error('讀取舊通行證失敗，重新填寫', e);
            }
        }

        // 第一次進入遊戲，才顯示通行證表單
        this.showPassportForm();
    }

    // 🌟 動態注入動畫與 RWD 支援 CSS
    private injectGlobalStyles() {
        if (!document.getElementById('passport-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'passport-ui-styles';
            style.innerHTML = `
                @keyframes passportPopIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .passport-btn:hover {
                    filter: brightness(1.15);
                    transform: translateY(-1px);
                }

                /* 🌟 隱藏捲動軸 */
                *::-webkit-scrollbar {
                    display: none !important;
                    width: 0px !important;
                    height: 0px !important;
                }
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                @media (max-width: 480px) {
                    .passport-card {
                        max-width: 100% !important;
                        height: 100dvh !important;
                        max-height: 100dvh !important;
                        border-radius: 0 !important;
                        border: none !important;
                        padding: 32px 20px 20px 20px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    private showPassportForm() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100vw; 
            height: 100dvh;
            background: rgba(11, 12, 16, 0.82); 
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            display: flex; 
            justify-content: center; 
            align-items: center;
            z-index: 2000; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 16px;
            box-sizing: border-box;
            overflow: hidden;
        `;

        this.container.innerHTML = `
            <div class="passport-card" style="
                background: rgba(22, 27, 34, 0.92); 
                border: 1px solid rgba(255, 183, 3, 0.35); 
                border-radius: 28px; 
                padding: 32px 26px 26px 26px; 
                width: 100%; 
                max-width: 420px; 
                box-shadow: 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15); 
                color: #f0f6fc; 
                text-align: center;
                animation: passportPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            ">
                <div style="font-size: 38px; margin-bottom: 8px;">🎫</div>
                <div style="font-size: 20px; font-weight: 700; color: #ffb703; margin-bottom: 4px; letter-spacing: 0.3px;">日光停靠站 旅人通行證</div>
                <div style="font-size: 12px; color: #8b949e; margin-bottom: 22px;">填寫完畢後，即可開始屬於你的停靠之旅</div>

                <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; font-size: 13px;">
                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 5px; font-weight: 600;">你的暱稱：</label>
                        <input type="text" id="passport-nickname" placeholder="例如：阿光" style="width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; outline: none; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;">
                    </div>

                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 5px; font-weight: 600;">今日停靠心境：</label>
                        <input type="text" id="passport-mood" placeholder="例如：有點疲憊、渴望安靜" style="width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; outline: none; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;">
                    </div>

                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 5px; font-weight: 600;">隨身攜帶的信物：</label>
                        <input type="text" id="passport-item" placeholder="例如：舊照片、乾枯的壓花" style="width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; outline: none; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;">
                    </div>
                </div>

                <button id="passport-submit-btn" class="passport-btn" style="
                    width: 100%; margin-top: 24px; padding: 13px; 
                    background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%); 
                    border: none; border-radius: 12px; color: #0d1117; 
                    font-weight: 700; cursor: pointer; font-size: 14px; 
                    box-shadow: 0 6px 20px rgba(255,183,3,0.35);
                    transition: all 0.2s ease;
                ">
                    簽署並進入小站
                </button>
            </div>
        `;

        document.body.appendChild(this.container);

        document.getElementById('passport-submit-btn')!.onclick = () => this.handleSubmit();
    }

    private handleSubmit() {
        const nickname = (document.getElementById('passport-nickname') as HTMLInputElement).value.trim() || '無名旅人';
        const mood = (document.getElementById('passport-mood') as HTMLInputElement).value.trim() || '平靜';
        const item = (document.getElementById('passport-item') as HTMLInputElement).value.trim() || '溫暖的回憶';

        const passportData = { nickname, mood, item };

        // 💾 儲存資料到瀏覽器本地儲存（localStorage）
        localStorage.setItem('daylight_passport', JSON.stringify(passportData));

        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
        }

        this.onCompleteCallback(passportData);
    }
}