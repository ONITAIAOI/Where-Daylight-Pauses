import { loginUser, registerUser } from '../firebase/config';

export class AuthUI {
    private container!: HTMLDivElement;
    private onSuccessCallback: (uid: string) => void;
    private isActionLoading: boolean = false;

    constructor(onSuccess: (uid: string) => void) {
        this.onSuccessCallback = onSuccess;
        this.injectGlobalStyles();
        this.createUI();
    }

    private injectGlobalStyles() {
        if (!document.getElementById('auth-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-ui-styles';
            style.innerHTML = `
                @keyframes authPopIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            `;
            document.head.appendChild(style);
        }
    }

    private createUI() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            background: rgba(15, 15, 26, 0.85); backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box; padding: 16px;
        `;

        this.container.innerHTML = `
            <div class="auth-modal-container no-scrollbar" style="
                background: rgba(30, 30, 46, 0.95); 
                border: 1px solid rgba(255,255,255,0.15); 
                border-radius: 20px; 
                padding: 32px; 
                width: 100%; 
                max-width: 380px; 
                box-shadow: 0 16px 50px rgba(0,0,0,0.6); 
                text-align: center;
                animation: authPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            ">
                <h2 style="color: #ffb703; margin-top: 0; margin-bottom: 6px; font-size: 24px;">☀️ 日光停靠站</h2>
                <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 24px;">帳號登入與註冊</p>
                
                <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <label style="font-size: 11px; font-weight: 600; color: #a0a0b8; display: block; margin-bottom: 4px;">電子信箱</label>
                        <input type="email" id="auth-email" placeholder="請輸入 Email..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: white; outline: none; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;">
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 600; color: #a0a0b8; display: block; margin-bottom: 4px;">密碼</label>
                        <input type="password" id="auth-pass" placeholder="至少 6 位數密碼..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: white; outline: none; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;">
                    </div>
                </div>
                
                <div id="auth-error" style="color: #ef476f; font-size: 12px; margin-bottom: 14px; display: none; background: rgba(239, 71, 111, 0.1); padding: 8px; border-radius: 6px; border: 1px solid rgba(239, 71, 111, 0.2);"></div>

                <div style="display: flex; gap: 10px;">
                    <button id="btn-login" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%); border: none; border-radius: 10px; color: #0d1117; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(255, 183, 3, 0.3); transition: opacity 0.2s;">登入</button>
                    <button id="btn-register" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; cursor: pointer; font-size: 14px; transition: background 0.2s;">註冊</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        const emailInput = document.getElementById('auth-email') as HTMLInputElement;
        const passInput = document.getElementById('auth-pass') as HTMLInputElement;
        const errorDiv = document.getElementById('auth-error') as HTMLDivElement;
        const loginBtn = document.getElementById('btn-login') as HTMLButtonElement;
        const registerBtn = document.getElementById('btn-register') as HTMLButtonElement;

        // 輸入框互動焦點變化
        [emailInput, passInput].forEach(input => {
            input.onfocus = () => { input.style.borderColor = '#ffb703'; };
            input.onblur = () => { input.style.borderColor = 'rgba(255,255,255,0.15)'; };
            
            // 支援按下 Enter 鍵快速登入
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
        });

        const showError = (msg: string) => {
            errorDiv.innerText = msg;
            errorDiv.style.display = 'block';
        };

        loginBtn.onclick = async () => {
            if (this.isActionLoading) return;
            errorDiv.style.display = 'none';

            const email = emailInput.value.trim();
            const password = passInput.value;

            if (!email || !password) {
                showError("請完整填寫 Email 與密碼");
                return;
            }

            this.isActionLoading = true;
            loginBtn.disabled = true;
            registerBtn.disabled = true;
            loginBtn.innerText = '登入中...';
            loginBtn.style.opacity = '0.7';

            try {
                const res = await loginUser(email, password);
                this.closeUI();
                this.onSuccessCallback(res.user.uid);
            } catch (err: any) {
                showError("登入失敗: 帳號或密碼錯誤");
                this.isActionLoading = false;
                loginBtn.disabled = false;
                registerBtn.disabled = false;
                loginBtn.innerText = '登入';
                loginBtn.style.opacity = '1';
            }
        };

        registerBtn.onclick = async () => {
            if (this.isActionLoading) return;
            errorDiv.style.display = 'none';

            const email = emailInput.value.trim();
            const password = passInput.value;

            if (!email || !password) {
                showError("請完整填寫 Email 與密碼");
                return;
            }

            if (password.length < 6) {
                showError("註冊失敗: 密碼長度需至少 6 個字元");
                return;
            }

            this.isActionLoading = true;
            loginBtn.disabled = true;
            registerBtn.disabled = true;
            registerBtn.innerText = '註冊中...';
            registerBtn.style.opacity = '0.7';

            try {
                const res = await registerUser(email, password);
                this.closeUI();
                this.onSuccessCallback(res.user.uid);
            } catch (err: any) {
                showError("註冊失敗: 格式不符或此 Email 已被註冊");
                this.isActionLoading = false;
                loginBtn.disabled = false;
                registerBtn.disabled = false;
                registerBtn.innerText = '註冊';
                registerBtn.style.opacity = '1';
            }
        };
    }

    private closeUI() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}