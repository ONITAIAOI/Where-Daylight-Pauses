import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
    inventory?: InventoryItemData[]; // 🎒 玩家背包資料 (輕量儲存)
    equippedChatSkin?: string;       // 💬 當前裝備的對話框樣式
    unlockedChatSkins?: string[];    // 💬 已解鎖的對話框樣式清單
    createdAt?: any;
    updatedAt?: any;
}

// 🌟 完整道具圖鑑資料庫 (Item Registry)
// 用來把資料庫裏面的簡單 ID 對照成 UI 需要的名稱、圖示、說明與分類
export interface ItemDefinition {
    id: string;
    name: string;
    category: 'consumable' | 'equipment' | 'material';
    icon: string;
    desc: string;
    rarity?: 'common' | 'rare' | 'epic';
}

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
    'item_1': { id: 'item_1', name: '香濃熱咖啡', category: 'consumable', icon: '☕', desc: '咖啡館特製的熱咖啡，飲用後可恢復些許精神，帶來溫暖。', rarity: 'common' },
    'item_2': { id: 'item_2', name: '祈願星砂', category: 'material', icon: '✨', desc: '在中央記憶噴泉附近收集到的閃亮星砂，散發著微光。', rarity: 'rare' },
    'item_3': { id: 'item_3', name: '老舊指南針', category: 'equipment', icon: '🧭', desc: '雖然指針有點生鏽，但在探索老街巷弄時似乎能指引方向。', rarity: 'rare' },
    'item_4': { id: 'item_4', name: '鎮民感謝信', category: 'material', icon: '💌', desc: '來自小鎮居民的謝函，乘載著滿滿的人情味。', rarity: 'common' },
    'item_5': { id: 'item_5', name: '神祕樹果', category: 'consumable', icon: '🍎', desc: '帶有甜香味的野生果實，野外探索時常見的補給品。', rarity: 'common' }
};

// 取得玩家資料
export async function getPlayerProfile(uid: string): Promise<PlayerProfile | null> {
    try {
        const docRef = doc(db, 'players', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as PlayerProfile;
            return {
                ...data,
                sunCoins: data.sunCoins ?? 100,
                memorialTokens: data.memorialTokens ?? 10,
                inventory: data.inventory ?? [
                    { id: 'item_1', count: 3 },
                    { id: 'item_2', count: 12 },
                    { id: 'item_3', count: 1 },
                    { id: 'item_4', count: 1 },
                    { id: 'item_5', count: 5 }
                ], // 若玩家沒有背包資料，給予預設新手道具
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

// 🌟 檢查暱稱是否已經被其他玩家註冊過
export async function checkNicknameExists(nickname: string): Promise<boolean> {
    try {
        const q = query(collection(db, 'players'), where('nickname', '==', nickname));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty; // 如果查到資料代表重複了 (true)
    } catch (error) {
        console.error('檢查暱稱重複失敗:', error);
        throw error;
    }
}

// 儲存玩家資料
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