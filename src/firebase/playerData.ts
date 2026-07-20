import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

export interface InventoryItemData {
    id: string;
    count: number;
}

export interface PlayerProfile {
    nickname: string;
    avatarColor: string;
    mood?: string;
    item?: string;
    lastMoodDate?: string; // 今日簽到日期
    sunCoins: number;       // ☀️ 暖陽幣
    memorialTokens: number; // 🌟 紀念章
    inventory?: InventoryItemData[]; // 🎒 玩家背包資料
    equippedChatSkin?: string;       // 💬 當前裝備的對話框樣式
    unlockedChatSkins?: string[];    // 💬 已解鎖的對話框樣式清單
    createdAt?: any;
    updatedAt?: any;
}

// 取得玩家資料（注意這裡已對齊你的 Firestore 規則：players）
export async function getPlayerProfile(uid: string): Promise<PlayerProfile | null> {
    try {
        const docRef = doc(db, 'players', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as PlayerProfile;
            // 確保舊玩家如果沒有幣值、背包或外觀欄位時，給予預設值
            return {
                ...data,
                sunCoins: data.sunCoins ?? 100,
                memorialTokens: data.memorialTokens ?? 10,
                inventory: data.inventory ?? [],
                equippedChatSkin: data.equippedChatSkin ?? 'default',
                unlockedChatSkins: data.unlockedChatSkins ?? ['default']
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('讀取角色資料失敗:', error);
        throw error;
    }
}

// 儲存玩家資料（對齊 players 集合）
export async function savePlayerProfile(uid: string, profile: PlayerProfile): Promise<void> {
    try {
        const docRef = doc(db, 'players', uid);
        await setDoc(docRef, {
            ...profile,
            sunCoins: profile.sunCoins ?? 100,
            memorialTokens: profile.memorialTokens ?? 10,
            inventory: profile.inventory ?? [],
            equippedChatSkin: profile.equippedChatSkin ?? 'default',
            unlockedChatSkins: profile.unlockedChatSkins ?? ['default'],
            updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('儲存角色資料失敗:', error);
        throw error;
    }
}