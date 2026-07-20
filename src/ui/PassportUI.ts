export class PassportUI {
    private container: HTMLDivElement | null = null;
    private onCompleteCallback: (data: { nickname: string; mood: string; item: string }) => void;

    constructor(onComplete: (data: { nickname: string; mood: string; item: string }) => void) {
        this.onCompleteCallback = onComplete;

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

    private showPassportForm() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 15, 26, 0.85); backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 2000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        this.container.innerHTML = `
            <div style="background: rgba(30, 30, 46, 0.95); border: 1px solid rgba(255, 183, 3, 0.4); border-radius: 20px; padding: 28px; width: 380px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); color: #edf2f4; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎫</div>
                <div style="font-size: 20px; font-weight: bold; color: #ffb703; margin-bottom: 4px;">日光停靠站 旅人通行證</div>
                <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 20px;">填寫完畢後，即可開始屬於你的停靠之旅</div>

                <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; font-size: 13px;">
                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 4px;">你的暱稱：</label>
                        <input type="text" id="passport-nickname" placeholder="例如：阿光" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; box-sizing: border-box;">
                    </div>

                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 4px;">今日停靠心境：</label>
                        <input type="text" id="passport-mood" placeholder="例如：有點疲憊、渴望安靜" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; box-sizing: border-box;">
                    </div>

                    <div>
                        <label style="color: #ffb703; display: block; margin-bottom: 4px;">隨身攜帶的信物：</label>
                        <input type="text" id="passport-item" placeholder="例如：舊照片、乾枯的壓花" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; box-sizing: border-box;">
                    </div>
                </div>

                <button id="passport-submit-btn" style="width: 100%; margin-top: 24px; padding: 12px; background: #ffb703; border: none; border-radius: 10px; color: #000; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(255,183,3,0.3);">
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