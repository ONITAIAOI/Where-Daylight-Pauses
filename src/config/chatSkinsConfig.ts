export interface ChatSkinConfig {
    id: string;
    name: string;
    description: string;
    price: number; // ☀️ 價格（0 代表預設或免費解鎖）
    currency: 'sunCoins' | 'memorialTokens';
    type: 'free' | 'shop' | 'vip' | 'achievement';
    bubbleStyle: string;
    textStyle: string;
}

export const CHAT_SKINS: Record<string, ChatSkinConfig> = {
    default: {
        id: 'default',
        name: '原木暖陽',
        description: '小鎮最經典的溫暖色調，陪伴你每個日常。',
        price: 0,
        currency: 'sunCoins',
        type: 'free',
        bubbleStyle: 'background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #1c1714; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2); font-weight: 500;',
        textStyle: ''
    },
    forest_green: {
        id: 'forest_green',
        name: '寧靜森林',
        description: '帶有草木清香的深綠色調，適合沉思與漫步的旅人。',
        price: 300,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ecfdf5; border: 1px solid #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); font-weight: 500;',
        textStyle: ''
    },
    starry_night: {
        id: 'starry_night',
        name: '繁星夜空',
        description: '深邃的夜藍色搭配微光，宛如深夜小屋外的星空。',
        price: 500,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #e0e7ff; border: 1px solid #818cf8; box-shadow: 0 4px 15px rgba(129, 140, 248, 0.3); font-weight: 500;',
        textStyle: ''
    },
    gold_luxury: {
        id: 'gold_luxury',
        name: '尊榮黃金',
        description: '閃耀著奢華光芒的特製外觀，小鎮大富翁的象徵！',
        price: 50,
        currency: 'memorialTokens', // 紀念章兌換
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%); color: #422006; border: 1px solid #fef08a; box-shadow: 0 0 15px rgba(254, 240, 138, 0.5); font-weight: 700;',
        textStyle: 'letter-spacing: 0.5px;'
    }
};