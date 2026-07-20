import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getPlayerProfile } from './firebase/playerData';
import { CharacterUI } from './ui/CharacterUI';
import { DailyMoodUI } from './ui/DailyMoodUI';
import { MainHUD } from './ui/MainHUD';
import { TownMapUI } from './ui/TownMapUI';
import { RestHouseUI } from './ui/RestHouseUI';

let mainHUD: MainHUD | null = null;
let currentGlobalUid: string | null = null;
let isInitializing = false; // 防重複觸發鎖

function initGame() {
    console.log('正在進行安全驗證與登入...');

    onAuthStateChanged(auth, async (user) => {
        if (isInitializing) return;

        if (user) {
            // 已有登入身分（可能是舊玩家重新整理，或剛註冊完）
            isInitializing = true;
            currentGlobalUid = user.uid;
            console.log('已辨識旅人身分，UID:', currentGlobalUid);
            try {
                await loadPlayerProfileFlow(currentGlobalUid);
            } finally {
                isInitializing = false;
            }
        } else {
            // 這台裝置完全沒有身分紀錄（全新訪客），才執行匿名登入
            isInitializing = true;
            try {
                console.log('初次造訪，正在建立免登入旅人身分...');
                await signInAnonymously(auth);
                // 登入成功後，onAuthStateChanged 會自動捕捉並跳到上面的 if (user)
            } catch (error) {
                console.error('Firebase 匿名登入失敗:', error);
                isInitializing = false;
            }
        }
    });
}

// 載入玩家資料流程
async function loadPlayerProfileFlow(currentUid: string) {
    try {
        const profile = await getPlayerProfile(currentUid);

        // 只有在資料庫真的完全查不到這個 UID 的資料時，才叫出創角畫面
        if (!profile || !profile.nickname) {
            console.log('此身分尚無名片資料，導向創角介面');
            new CharacterUI(currentUid, (newProfile) => {
                startDailyMoodFlow(currentUid, newProfile);
            });
        } else {
            console.log('已成功讀取既有旅人資料，檢查今日心境...');
            const todayStr = new Date().toISOString().split('T')[0];

            if (profile.lastMoodDate === todayStr) {
                console.log('今日已完成簽到，直接進入主畫面');
                launchMainHUD(currentUid, profile);
            } else {
                console.log('今日尚未簽到，開啟每日心境流程');
                startDailyMoodFlow(currentUid, profile);
            }
        }
    } catch (error) {
        console.error('讀取旅人資料失敗:', error);
    }
}

// 啟動每日心境流程
async function startDailyMoodFlow(currentUid: string, profile: any) {
    new DailyMoodUI(currentUid, profile, async (mood, item) => {
        console.log('接收到心境與道具選擇:', { mood, item });

        // 因為 DailyMoodUI 已經在內部完成存檔與背包寫入，
        // 這裡直接讀取最新的 profile 確保資料完全同步後進入主畫面
        const updatedProfile = await getPlayerProfile(currentUid) || profile;
        launchMainHUD(currentUid, updatedProfile);
    });
}

// 啟動遊戲主介面
function launchMainHUD(currentUid: string, profile: any) {
    if (mainHUD) {
        mainHUD.remove();
    }

    // 將真實 uid 寫入 profile 備用
    profile.uid = currentUid; 

    mainHUD = new MainHUD(profile, currentUid, {
        onOpenTownMap: () => {
            console.log('玩家點擊了：探索小鎮地圖');
            
            new TownMapUI(
                (locationId) => {
                    console.log(`玩家選擇前往區域: ${locationId}`);
                },
                () => {
                    console.log('關閉地圖，返回主控台');
                }
            );
        },
        onOpenSettings: () => {
            console.log('玩家點擊了：心境小屋');
            
            new RestHouseUI(currentUid, async () => {
                const updatedProfile = await getPlayerProfile(currentUid);
                if (updatedProfile) {
                    launchMainHUD(currentUid, updatedProfile);
                }
            });
        },
        onOpenCreateProfile: () => {
            console.log('從主控台攔截到未創角狀態，啟動創角流程');
            new CharacterUI(currentUid, (newProfile) => {
                startDailyMoodFlow(currentUid, newProfile);
            });
        }
    });

    console.log('遊戲主介面已載入！');
}

// 執行遊戲初始化
initGame();