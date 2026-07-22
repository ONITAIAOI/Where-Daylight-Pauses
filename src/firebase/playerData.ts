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
    memorialTokens: number; // 🌟 紀念章 (儲值代幣)
    inventory?: InventoryItemData[]; // 🎒 玩家背包資料 (輕量儲存)
    equippedChatSkin?: string;         // 💬 當前裝備的對話框樣式
    unlockedChatSkins?: string[];    // 💬 已解鎖的對話框樣式清單
    
    // 🌟 三種心靈與探索素質
    resilience: number;    // 心靈韌性 (影響小屋休息效果/日常恢復)
    perception: number;    // 感知力 (影響小鎮探索、隱藏對話與事件解鎖機率)
    energy: number;        // 專注力/能量 (代表精神狀態，使用道具可恢復)
    
    // 🌟 跨平台閒置系統與休息計時器
    lastActiveTime?: string; // 最後活躍 ISO 時間（用於計算離線閒置恢復）
    restingUntil?: string;   // 深度休息結束的 ISO 時間（用於心境小屋計時）

    createdAt?: any;
    updatedAt?: any;
}

// 🌟 完整道具圖鑑資料庫 (Item Registry)
export interface ItemDefinition {
    id: string;
    name: string;
    category: 'consumable' | 'equipment' | 'material';
    icon: string;
    desc: string;
    rarity?: 'common' | 'rare' | 'epic';
    effect?: {
        resilience?: number;
        perception?: number;
        energy?: number;
    };
    usage?: string;
}

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
    'item_1': { id: 'item_1', name: '香濃熱咖啡', category: 'consumable', icon: '☕', desc: '咖啡館特製的熱咖啡，飲用後可恢復些許精神，帶來溫暖。', rarity: 'common', effect: { energy: 25 } },
    'item_2': { id: 'item_2', name: '手作筆記本', category: 'material', icon: '📓', desc: '記錄著日常瑣碎靈感與心情的空白筆記本。', rarity: 'common' },
    'item_3': { id: 'item_3', name: '暖心茶包', category: 'consumable', icon: '🍵', desc: '散發淡淡甘草香氣的草本茶包，能平靜心靈。', rarity: 'common', effect: { resilience: 15 } },
    'item_4': { id: 'item_4', name: '老相機底片', category: 'material', icon: '🎞️', desc: '能捕捉小鎮光影與隱藏景致的珍貴底片。', rarity: 'rare', effect: { perception: 10 } },
    'item_5': { id: 'item_5', name: '微光護身符', category: 'equipment', icon: '🔮', desc: '散發著柔和微光的護身信物，陪伴旅人度過迷惘。', rarity: 'epic', effect: { resilience: 20, perception: 10 } }
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
                ],
                equippedChatSkin: data.equippedChatSkin ?? 'default',
                unlockedChatSkins: data.unlockedChatSkins ?? ['default'],
                resilience: data.resilience ?? 10,
                perception: data.perception ?? 10,
                energy: data.energy ?? 100,
                lastActiveTime: data.lastActiveTime ?? new Date().toISOString(),
                restingUntil: data.restingUntil ?? undefined
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('讀取角色資料失敗:', error);
        throw error;
    }
}

// 檢查暱稱是否重複
export async function checkNicknameExists(nickname: string): Promise<boolean> {
    try {
        const q = query(collection(db, 'players'), where('nickname', '==', nickname));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
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
            resilience: profile.resilience ?? 10,
            perception: profile.perception ?? 10,
            energy: profile.energy ?? 100,
            lastActiveTime: profile.lastActiveTime ?? new Date().toISOString(),
            restingUntil: profile.restingUntil ?? null,
            updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('儲存角色資料失敗:', error);
        throw error;
    }
}