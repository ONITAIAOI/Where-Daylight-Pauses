import { loginUser, registerUser } from '../firebase/config';

export class AuthUI {
    private container!: HTMLDivElement;
    private onSuccessCallback: (uid: string) => void;

    constructor(onSuccess: (uid: string) => void) {
        this.onSuccessCallback = onSuccess;
        this.createUI();
    }

    private createUI() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 15, 26, 0.9); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: sans-serif;
        `;

        this.container.innerHTML = `
            <div style="background: rgba(30, 30, 46, 0.95); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 32px; width: 340px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center;">
                <h2 style="color: #ffb703; margin-top: 0; font-size: 24px;">☀️ 日光停靠站</h2>
                <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 24px;">【頁面 1/4】帳號登入與註冊</p>
                
                <input type="email" id="auth-email" placeholder="電子信箱 (Email)" style="width: 100%; padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; box-sizing: border-box; font-size: 14px;">
                <input type="password" id="auth-pass" placeholder="密碼 (至少 6 位數)" style="width: 100%; padding: 12px; margin-bottom: 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none; box-sizing: border-box; font-size: 14px;">
                
                <div id="auth-error" style="color: #ef476f; font-size: 12px; margin-bottom: 12px; display: none;"></div>

                <div style="display: flex; gap: 10px;">
                    <button id="btn-login" style="flex: 1; padding: 12px; background: #ffb703; border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer; font-size: 14px;">登入</button>
                    <button id="btn-register" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; cursor: pointer; font-size: 14px;">註冊</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        const emailInput = document.getElementById('auth-email') as HTMLInputElement;
        const passInput = document.getElementById('auth-pass') as HTMLInputElement;
        const errorDiv = document.getElementById('auth-error') as HTMLDivElement;

        const showError = (msg: string) => {
            errorDiv.innerText = msg;
            errorDiv.style.display = 'block';
        };

        document.getElementById('btn-login')!.onclick = async () => {
            errorDiv.style.display = 'none';
            try {
                const res = await loginUser(emailInput.value, passInput.value);
                this.closeUI();
                this.onSuccessCallback(res.user.uid);
            } catch (err: any) {
                showError("登入失敗: 帳號或密碼錯誤");
            }
        };

        document.getElementById('btn-register')!.onclick = async () => {
            errorDiv.style.display = 'none';
            if (passInput.value.length < 6) {
                showError("註冊失敗: 密碼長度需至少 6 個字元");
                return;
            }
            try {
                const res = await registerUser(emailInput.value, passInput.value);
                this.closeUI();
                this.onSuccessCallback(res.user.uid);
            } catch (err: any) {
                showError("註冊失敗: 格式不符或此 Email 已被註冊");
            }
        };
    }

    private closeUI() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}