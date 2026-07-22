import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getPlayerProfile } from './firebase/playerData';
import { CharacterUI } from './ui/CharacterUI';
import { DailyMoodUI } from './ui/DailyMoodUI';
import { MainHUD } from './ui/MainHUD';
// ✅ 移除 TownMapUI 和 RestHouseUI 的導入，因為不再需要從外部創建
// import { TownMapUI } from './ui/TownMapUI';
// import { RestHouseUI } from './ui/RestHouseUI';

let mainHUD: MainHUD | null = null;
let currentGlobalUid: string | null = null;
let isInitializing = false;

function initGame() {
    console.log('正在進行安全驗證與登入...');

    onAuthStateChanged(auth, async (user) => {
        if (isInitializing) return;

        if (user) {
            isInitializing = true;
            currentGlobalUid = user.uid;
            console.log('已辨識旅人身分，UID:', currentGlobalUid);
            try {
                await loadPlayerProfileFlow(currentGlobalUid);
            } finally {
                isInitializing = false;
            }
        } else {
            isInitializing = true;
            try {
                console.log('初次造訪，正在建立免登入旅人身分...');
                await signInAnonymously(auth);
            } catch (error) {
                console.error('Firebase 匿名登入失敗:', error);
                isInitializing = false;
            }
        }
    });
}

async function loadPlayerProfileFlow(currentUid: string) {
    try {
        const profile = await getPlayerProfile(currentUid);

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

async function startDailyMoodFlow(currentUid: string, profile: any) {
    new DailyMoodUI(currentUid, profile, async (mood, item) => {
        console.log('接收到心境與道具選擇:', { mood, item });

        const updatedProfile = await getPlayerProfile(currentUid) || profile;
        launchMainHUD(currentUid, updatedProfile);
    });
}

function launchMainHUD(currentUid: string, profile: any) {
    if (mainHUD) {
        mainHUD.remove();
        mainHUD = null;
    }

    profile.uid = currentUid;
   (window as any).__currentProfile = profile;
    // ✅ 移除 onOpenTownMap 和 onOpenSettings 內部的 UI 創建邏輯
    // 讓 MainHUD 完全內部管理所有子 UI
    mainHUD = new MainHUD(profile, currentUid, {
        // ✅ 保留空回調或簡單日誌，不要做任何 UI 創建
        onOpenTownMap: () => {
            console.log('📍 玩家點擊了探索小鎮地圖（由 MainHUD 內部處理）');
        },
        onOpenSettings: () => {
            console.log('🍵 玩家點擊了心境小屋（由 MainHUD 內部處理）');
        },
        onOpenChat: () => {
            console.log('💬 玩家點擊了鎮民廣場（由 MainHUD 內部處理）');
        },
        onOpenCreateProfile: () => {
            console.log('📝 從主控台攔截到未創角狀態，啟動創角流程');
            if (currentGlobalUid) {
                new CharacterUI(currentGlobalUid, (newProfile) => {
                    startDailyMoodFlow(currentGlobalUid!, newProfile);
                });
            }
        }
    });

    console.log('✅ 遊戲主介面已載入！');
}

// 執行遊戲初始化
initGame();