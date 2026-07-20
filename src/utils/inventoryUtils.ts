import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config'; // 修正路徑指向 src/firebase/config
import { ITEM_DATABASE } from '../config/itemRegistry'; // 修正路徑指向 src/config/itemRegistry

/**
 * 讓玩家獲得指定道具的通用輔助函式
 * @param uid 玩家的 Firebase UID
 * @param itemId 道具 ID (對應 ITEM_DATABASE 中的 key，例如 'item_1')
 * @param amount 獲得數量 (預設為 1)
 */
export async function addPlayerItem(uid: string, itemId: string, amount: number = 1): Promise<void> {
    try {
        // 1. 檢查道具 ID 是否存在於圖鑑中
        const itemDef = ITEM_DATABASE[itemId];
        if (!itemDef) {
            console.error(`[獲得道具失敗] 找不到代號為 "${itemId}" 的道具設定。`);
            return;
        }

        const playerDocRef = doc(db, 'players', uid);
        const snapshot = await getDoc(playerDocRef);

        if (!snapshot.exists()) {
            console.error(`[獲得道具失敗] 找不到 UID 為 "${uid}" 的玩家資料。`);
            return;
        }

        const data = snapshot.data();
        let inventory: { id: string; count: number }[] = data.inventory || [];

        // 2. 檢查背包是否已經擁有此道具
        const existingIndex = inventory.findIndex(i => i.id === itemId);
        if (existingIndex > -1) {
            // 如果有了，直接增加數量
            inventory[existingIndex].count += amount;
        } else {
            // 如果沒有，新增一筆紀錄
            inventory.push({ id: itemId, count: amount });
        }

        // 3. 寫回 Firebase 玩家背包
        await updateDoc(playerDocRef, { inventory });
        
        console.log(`✨ 成功獲得道具：[${itemDef.icon} ${itemDef.name}] x ${amount}`);
    } catch (error) {
        console.error('更新玩家背包時發生錯誤:', error);
        throw error;
    }
}