export interface ChatSkinConfig {
    id: string;
    name: string;
    description: string;
    price: number; 
    currency: 'sunCoins' | 'memorialTokens';
    type: 'free' | 'shop' | 'vip'; // ☀️ 暫時移除 achievement，全部納入商店或 VIP
    bubbleStyle: string;
    textStyle: string;
}

export const CHAT_SKINS: Record<string, ChatSkinConfig> = {
    // 🌟 1. 原木暖陽 (預設免費)
    default: {
        id: 'default',
        name: '原木暖陽',
        description: '小鎮最經典的溫暖色調，陪伴你每個日常。',
        price: 0,
        currency: 'sunCoins',
        type: 'free',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(234, 179, 8, 0.9) 0%, rgba(202, 138, 4, 0.95) 100%); color: #1c1714; border: 1px solid rgba(254, 240, 138, 0.4); box-shadow: 0 4px 15px rgba(234, 179, 8, 0.25); font-weight: 500;',
        textStyle: ''
    },

    // 🌟 2. 寧靜森林 (新手目標 - 約掛機 2 天可得)
    forest_green: {
        id: 'forest_green',
        name: '寧靜森林',
        description: '帶有草木清香的深綠色調，適合沉思與漫步的旅人。',
        price: 3000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(6, 95, 70, 0.95) 0%, rgba(4, 120, 87, 0.95) 100%); color: #ecfdf5; border: 1px solid rgba(52, 211, 153, 0.5); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); font-weight: 500;',
        textStyle: 'text-shadow: 0 1px 2px rgba(0,0,0,0.3);'
    },

    // 🌟 3. 繁星夜空 (進階款)
    starry_night: {
        id: 'starry_night',
        name: '繁星夜空',
        description: '深邃的夜藍色搭配微光，宛如深夜小屋外的星空。',
        price: 5000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%); color: #e0e7ff; border: 1px solid rgba(129, 140, 248, 0.6); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35); font-weight: 500;',
        textStyle: 'text-shadow: 0 0 6px rgba(129, 140, 248, 0.5);'
    },

    // 🌟 4. 櫻落微風 (進階款)
    cherry_blossom: {
        id: 'cherry_blossom',
        name: '櫻落微風',
        description: '夾雜著春日粉嫩與柔和微光的浪漫色調，讓每句話都充滿溫柔。',
        price: 8000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(244, 114, 182, 0.9) 0%, rgba(251, 113, 133, 0.9) 100%); color: #fff1f2; border: 1px solid rgba(253, 164, 175, 0.8); box-shadow: 0 4px 18px rgba(244, 114, 182, 0.35); font-weight: 500;',
        textStyle: 'text-shadow: 0 1px 3px rgba(159, 18, 57, 0.4);'
    },

    // 🌟 5. 深海迷蹤 (中階款)
    deep_ocean: {
        id: 'deep_ocean',
        name: '深海迷蹤',
        description: '潛入蔚藍海溝深處的寧靜與神祕，承載著無盡的深海傳說。',
        price: 12000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(8, 51, 68, 0.95) 0%, rgba(14, 116, 144, 0.95) 100%); color: #e0f2fe; border: 1px solid #38bdf8; box-shadow: 0 4px 18px rgba(14, 165, 233, 0.35); font-weight: 500;',
        textStyle: 'text-shadow: 0 0 6px rgba(56, 189, 248, 0.6);'
    },

    // 🌟 6. 翡翠琉璃 (中高階)
    emerald_glass: {
        id: 'emerald_glass',
        name: '翡翠琉璃',
        description: '溫潤如玉的翠綠透光外觀，散發著典雅且沉穩的東方氣息。',
        price: 18000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%); color: #ecfdf5; border: 1px solid #6ee7b7; box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35); font-weight: 600;',
        textStyle: 'text-shadow: 0 1px 3px rgba(4, 120, 87, 0.5);'
    },

    // 🌟 7. 荒蕪廢土 (高階款 - 原成就轉換)
    wasteland_dust: {
        id: 'wasteland_dust',
        name: '荒蕪廢土',
        description: '走過無數荒野與風沙的痕跡，見證資深冒險者歷練的勳章。',
        price: 25000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(120, 113, 108, 0.9) 0%, rgba(87, 83, 78, 0.95) 100%); color: #f5f5f4; border: 1px solid #d6d3d1; box-shadow: 0 4px 15px rgba(168, 162, 158, 0.3); font-weight: 600;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);'
    },

    // 🌟 8. 暗夜流金 (頂級肝帝款)
    obsidian_gold: {
        id: 'obsidian_gold',
        name: '暗夜流金',
        description: '以極致漆黑為底、奢華金邊點綴，神祕又低調的頂級品味。',
        price: 45000,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(39, 39, 42, 0.95) 100%); color: #fde047; border: 1px solid #eab308; box-shadow: 0 0 20px rgba(234, 179, 8, 0.35); font-weight: 700;',
        textStyle: 'letter-spacing: 0.8px; text-shadow: 0 0 6px rgba(234, 179, 8, 0.5);'
    },

    // 🌟 9. 聖堂光輝 (終極神話款 - 需要掛機兩三個月以上的終極目標)
    sacred_shrine: {
        id: 'sacred_shrine',
        name: '聖堂光輝',
        description: '象徵小鎮至高榮耀的神聖光輝，唯有傳奇旅人方能匹配的聖潔外觀。',
        price: 99999,
        currency: 'sunCoins',
        type: 'shop',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(226, 232, 240, 0.95) 100%); color: #0f172a; border: 1px solid #ffffff; box-shadow: 0 0 30px rgba(255, 255, 255, 0.7), inset 0 0 10px rgba(56, 189, 248, 0.3); font-weight: 800;',
        textStyle: 'letter-spacing: 1px; text-shadow: 0 1px 2px rgba(255,255,255,0.8);'
    },

    // --------------------------------------------------------
    // 以下為紀念章 (memorialTokens) 專區，價格調整為 150 ~ 880
    // --------------------------------------------------------

    // 🌟 10. 尊榮黃金 (入門課金款)
    gold_luxury: {
        id: 'gold_luxury',
        name: '尊榮黃金',
        description: '閃耀著奢華光芒的特製外觀，小鎮大富翁的象徵！',
        price: 150,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, #fef08a 0%, #eab308 40%, #ca8a04 100%); color: #422006; border: 1px solid #fef08a; box-shadow: 0 0 20px rgba(254, 240, 138, 0.7); font-weight: 700;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 1px 1px rgba(255,255,255,0.6);'
    },

    // 🌟 11. 霓虹賽博 (微課炫酷款)
    cyber_neon: {
        id: 'cyber_neon',
        name: '霓虹賽博',
        description: '流動著強烈未來科技感的電光外觀，引領潮流的酷炫存在。',
        price: 250,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(13, 148, 136, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%); color: #ffffff; border: 1px solid #2dd4bf; box-shadow: 0 0 20px rgba(45, 212, 191, 0.5), inset 0 0 10px rgba(168, 85, 247, 0.4); font-weight: 700;',
        textStyle: 'letter-spacing: 0.8px; text-shadow: 0 0 8px rgba(45, 212, 191, 0.8);'
    },

    // 🌟 12. 冰晶雪魄 (中階課金款)
    glacial_frost: {
        id: 'glacial_frost',
        name: '冰晶雪魄',
        description: '來自極北之地的萬年寒冰，散發著清澈透藍的高冷純淨光輝。',
        price: 350,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(56, 189, 248, 0.85) 100%); color: #f0f9ff; border: 1px solid #7dd3fc; box-shadow: 0 0 20px rgba(56, 189, 248, 0.55), inset 0 0 10px rgba(255, 255, 255, 0.5); font-weight: 600;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 0 8px rgba(125, 211, 252, 0.8);'
    },

    // 🌟 13. 深淵魅影 (高階課金款)
    abyssal_phantom: {
        id: 'abyssal_phantom',
        name: '深淵魅影',
        description: '自神祕深淵中凝視而來的魅惑紫紅，散發著令人無法忽視的強大氣場。',
        price: 450,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(159, 18, 57, 0.95) 100%); color: #fce7f3; border: 1px solid #f43f5e; box-shadow: 0 0 22px rgba(244, 63, 94, 0.55), inset 0 0 8px rgba(219, 39, 119, 0.3); font-weight: 700;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 0 8px rgba(244, 63, 94, 0.7);'
    },

    // 🌟 14. 暮光曙色 (高階課金款)
    twilight_glow: {
        id: 'twilight_glow',
        name: '暮光曙色',
        description: '夕陽與晚霞交織的夢幻色調，見證白晝與黑夜最溫柔的交替。',
        price: 550,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(217, 70, 239, 0.9) 100%); color: #fff; border: 1px solid #f472b6; box-shadow: 0 0 22px rgba(217, 70, 239, 0.55), inset 0 0 8px rgba(254, 202, 202, 0.4); font-weight: 700;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 0 8px rgba(244, 114, 182, 0.8);'
    },

    // 🌟 15. 烈焰熔岩 (頂級課金霸主款 - 原成就轉換)
    volcanic_magma: {
        id: 'volcanic_magma',
        name: '烈焰熔岩',
        description: '歷經無數考驗後淬煉出的霸氣烈焰，象徵永不熄滅的冒險者之魂。',
        price: 880,
        currency: 'memorialTokens',
        type: 'vip',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(194, 65, 12, 0.95) 0%, rgba(153, 27, 27, 0.95) 100%); color: #ffedd5; border: 1px solid #fb923c; box-shadow: 0 0 25px rgba(249, 115, 22, 0.6), inset 0 0 10px rgba(251, 191, 36, 0.4); font-weight: 700;',
        textStyle: 'letter-spacing: 0.6px; text-shadow: 0 0 8px rgba(251, 146, 60, 0.9);'
    }
};