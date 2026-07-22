export interface ChatSkinConfig {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: 'sunCoins' | 'memorialTokens';
    type: 'free' | 'shop' | 'vip' | 'limited';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    bubbleStyle: string;
    textStyle: string;
    sendEffect?: 'sparkle' | 'glow' | 'petal' | 'starlight' | 'flame' | 'aurora';
    flavorText?: string;
    available?: boolean;
    extraClass?: string;  // ✅ 新增：觸發偽元素動畫的 CSS 類名
}

// 🌟 全域動畫 Keyframes（需要在 ChatUI 中注入）
/*
@keyframes skinGlowPulse {
    0%, 100% { filter: brightness(1); transform: scale(1); }
    50% { filter: brightness(1.2); transform: scale(1.02); }
}
@keyframes borderFlow {
    0% { border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
    50% { border-color: rgba(254, 240, 138, 1); box-shadow: 0 0 35px rgba(234, 179, 8, 0.9); }
    100% { border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
}
@keyframes auroraFlow {
    0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
    50% { background-position: 100% 50%; filter: hue-rotate(15deg); }
    100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
}
@keyframes cosmicSpin {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}
@keyframes cherryFall {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.1); box-shadow: 0 0 30px rgba(255, 182, 193, 0.5); }
}
@keyframes enchantedGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
    50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.7), 0 0 60px rgba(236, 72, 153, 0.3); }
}
@keyframes magmaFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
@keyframes cyberGlitch {
    0%, 100% { filter: hue-rotate(0deg) brightness(1); }
    50% { filter: hue-rotate(30deg) brightness(1.2); box-shadow: 0 0 25px rgba(45, 212, 191, 0.8), inset 0 0 12px rgba(168, 85, 247, 0.6); }
}
@keyframes crystalShimmer {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.03); text-shadow: 0 0 20px rgba(255,255,255,0.5); }
}

// ✨ 新增動畫 Keyframes
@keyframes lightningStrike {
    0%, 89%, 91%, 93%, 95%, 97%, 100% { opacity: 0; transform: scale(0.8); }
    90% { opacity: 1; transform: scale(1.2); }
    92% { opacity: 0.6; transform: scale(1.1); }
    94% { opacity: 1; transform: scale(1.3); }
    96% { opacity: 0; transform: scale(0.9); }
    98% { opacity: 0.8; transform: scale(1.1); }
}
@keyframes lightningPulse {
    0%, 100% { transform: scale(1); opacity: 0.2; }
    50% { transform: scale(1.8); opacity: 0.6; }
}
@keyframes flameDance {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
    25% { transform: scale(1.1) rotate(-3deg); opacity: 0.9; }
    50% { transform: scale(0.95) rotate(3deg); opacity: 0.7; }
    75% { transform: scale(1.05) rotate(-2deg); opacity: 0.8; }
}
@keyframes stormSpin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
}
@keyframes meteorShower {
    0% { transform: translateX(-20px) translateY(-20px) scale(0.5); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(40px) translateY(40px) scale(1.5); opacity: 0; }
}
@keyframes rainbowFlow {
    0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
    100% { background-position: 200% 50%; filter: hue-rotate(360deg); }
}
@keyframes candleFlicker {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
    20% { transform: scale(1.05) rotate(2deg); opacity: 0.9; }
    40% { transform: scale(0.95) rotate(-2deg); opacity: 0.6; }
    60% { transform: scale(1.08) rotate(1deg); opacity: 0.8; }
    80% { transform: scale(0.92) rotate(-1deg); opacity: 0.7; }
}
*/

export const CHAT_SKINS: Record<string, ChatSkinConfig> = {
    // ============================================================
    // 🌟 免費區（新手友善）
    // ============================================================

    'default': {
        id: 'default',
        name: '🌅 晨光木屋',
        description: '清晨第一縷陽光灑進木屋的溫暖色調，陪伴每個日常。',
        price: 0,
        currency: 'sunCoins',
        type: 'free',
        rarity: 'common',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(234, 179, 8, 0.85) 0%, rgba(202, 138, 4, 0.9) 100%); color: #1c1714; border: 1px solid rgba(254, 240, 138, 0.3); box-shadow: 0 2px 12px rgba(234, 179, 8, 0.15); font-weight: 500;',
        textStyle: '',
        flavorText: '☀️ 日光從不吝嗇它的溫暖',
        available: true
    },

    // ============================================================
    // 🛒 商店區（暖陽幣）
    // ============================================================

    'forest_green': {
        id: 'forest_green',
        name: '🌲 迷霧森林',
        description: '穿過晨霧的森林小徑，每一句話都帶著草木的清甜氣息。',
        price: 3000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'rare',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(6, 95, 70, 0.92) 0%, rgba(4, 120, 87, 0.92) 100%); color: #ecfdf5; border: 1px solid rgba(52, 211, 153, 0.4); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2); font-weight: 500; animation: skinGlowPulse 4s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 1px 3px rgba(0,0,0,0.3);',
        sendEffect: 'sparkle',
        flavorText: '🌿 聽見樹葉在風中低語',
        available: true
    },

    'starry_night': {
        id: 'starry_night',
        name: '🌌 星夜絮語',
        description: '深夜小鎮的星空下，每一句話都像流星劃過天際。',
        price: 5000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'rare',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%); color: #e0e7ff; border: 1px solid rgba(129, 140, 248, 0.5); box-shadow: 0 4px 25px rgba(99, 102, 241, 0.3); font-weight: 500; animation: borderFlow 3s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 8px rgba(129, 140, 248, 0.4); letter-spacing: 0.5px;',
        sendEffect: 'starlight',
        flavorText: '⭐ 每一顆星星都在聽你說話',
        available: true
    },

    'cherry_blossom': {
        id: 'cherry_blossom',
        name: '🌸 櫻吹雪',
        description: '春日午後，櫻花瓣隨風飄落，每一句話都染上粉嫩的溫柔。',
        price: 8000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(244, 114, 182, 0.85) 0%, rgba(251, 113, 133, 0.85) 100%); color: #fff1f2; border: 1px solid rgba(253, 164, 175, 0.6); box-shadow: 0 4px 25px rgba(244, 114, 182, 0.3); font-weight: 500; animation: cherryFall 3s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 1px 4px rgba(159, 18, 57, 0.3);',
        sendEffect: 'petal',
        flavorText: '🌸 風起時，櫻花會替你說出溫柔的話',
        available: true
    },

    'deep_ocean': {
        id: 'deep_ocean',
        name: '🌊 深海呢喃',
        description: '潛入蔚藍深處，聽見海洋最古老的祕密與寧靜。',
        price: 12000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(8, 51, 68, 0.95) 0%, rgba(14, 116, 144, 0.95) 100%); color: #e0f2fe; border: 1px solid rgba(56, 189, 248, 0.5); box-shadow: 0 4px 25px rgba(14, 165, 233, 0.25); font-weight: 500; animation: skinGlowPulse 5s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 8px rgba(56, 189, 248, 0.3); letter-spacing: 0.3px;',
        sendEffect: 'glow',
        flavorText: '🐋 海洋記得每一句溫柔的話',
        available: true
    },

    'emerald_glass': {
        id: 'emerald_glass',
        name: '💚 翡翠琉璃',
        description: '溫潤通透的翠綠寶石，散發著東方古典的雅緻氣息。',
        price: 18000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.88) 0%, rgba(5, 150, 105, 0.92) 100%); color: #ecfdf5; border: 1px solid rgba(52, 211, 153, 0.5); box-shadow: 0 4px 25px rgba(16, 185, 129, 0.25); font-weight: 600; animation: crystalShimmer 3s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 1px 4px rgba(4, 120, 87, 0.4);',
        sendEffect: 'sparkle',
        flavorText: '🍃 如寶石般澄澈，每一句話都值得珍藏',
        available: true
    },

    'wasteland_dust': {
        id: 'wasteland_dust',
        name: '🏜️ 荒原旅人',
        description: '穿越風沙與荒野的足跡，每句話都帶著冒險的印記。',
        price: 25000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(120, 113, 108, 0.9) 0%, rgba(87, 83, 78, 0.95) 100%); color: #f5f5f4; border: 1px solid rgba(214, 211, 209, 0.4); box-shadow: 0 4px 20px rgba(168, 162, 158, 0.2); font-weight: 600;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.5);',
        sendEffect: 'flame',
        flavorText: '🔥 風沙磨礪過的言語，字字鏗鏘',
        available: true
    },

    // ============================================================
    // ✨ 新增：史詩級動態皮膚（暖陽幣）
    // ============================================================

    'candle_whisper': {
        id: 'candle_whisper',
        name: '🕯️ 燭光絮語',
        description: '溫暖燭火輕輕搖曳，每一句話都像夜色中的低語。',
        price: 15000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'rare',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(120, 53, 15, 0.9) 0%, rgba(180, 83, 9, 0.85) 100%); color: #fef3c7; border: 2px solid rgba(251, 191, 36, 0.4); box-shadow: 0 4px 30px rgba(251, 191, 36, 0.15); font-weight: 500; position: relative; overflow: hidden;',
        textStyle: 'text-shadow: 0 0 15px rgba(251, 191, 36, 0.3); letter-spacing: 0.3px; position: relative; z-index: 1;',
        extraClass: 'candle-skin',
        sendEffect: 'glow',
        flavorText: '🕯️ 燭火搖曳之處，溫暖從不缺席',
        available: true
    },

    'rainbow_dream': {
        id: 'rainbow_dream',
        name: '🌈 彩虹幻境',
        description: '流動的七彩光芒，每一句話都是通往夢境的橋樑。',
        price: 22000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6); background-size: 300% 300%; color: #fff; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 30px rgba(255,255,255,0.1); font-weight: 700; animation: rainbowFlow 4s ease-in-out infinite; position: relative; overflow: hidden;',
        textStyle: 'text-shadow: 0 0 20px rgba(255,255,255,0.4); letter-spacing: 0.5px; position: relative; z-index: 1;',
        extraClass: 'rainbow-skin',
        sendEffect: 'aurora',
        flavorText: '🌈 穿過彩虹，就能抵達你想去的地方',
        available: true
    },

    'storm_eye': {
        id: 'storm_eye',
        name: '🌪️ 風暴之眼',
        description: '旋轉的氣流與雷霆，言語在風暴中心依然平靜。',
        price: 30000,
        currency: 'sunCoins',
        type: 'shop',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%); color: #e2e8f0; border: 2px solid rgba(100, 116, 139, 0.4); box-shadow: 0 4px 30px rgba(100, 116, 139, 0.2); font-weight: 600; position: relative; overflow: hidden;',
        textStyle: 'text-shadow: 0 0 15px rgba(148, 163, 184, 0.3); letter-spacing: 0.5px; position: relative; z-index: 1;',
        extraClass: 'storm-skin',
        sendEffect: 'flame',
        flavorText: '🌪️ 風暴中心，言語依然清晰',
        available: true
    },

    // ============================================================
    // 💎 紀念章專區（VIP / 限定）
    // ============================================================

    'gold_luxury': {
        id: 'gold_luxury',
        name: '👑 尊爵金輝',
        description: '象徵小鎮頂級品味的奢華金色，閃耀著令人羨慕的光芒。',
        price: 150,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, #fef08a 0%, #eab308 40%, #ca8a04 100%); color: #422006; border: 2px solid #fef08a; box-shadow: 0 0 30px rgba(254, 240, 138, 0.5), inset 0 0 15px rgba(255,255,255,0.2); font-weight: 700; animation: borderFlow 2.5s ease-in-out infinite;',
        textStyle: 'letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(255,255,255,0.5);',
        sendEffect: 'glow',
        flavorText: '✨ 你所說的每一句話，都值得被銘記',
        available: true
    },

    'aurora_borealis': {
        id: 'aurora_borealis',
        name: '🌌 極光幻境',
        description: '來自北極圈的夢幻極光，流動的綠與紫交織成最絢麗的對話框。',
        price: 350,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(56, 189, 248, 0.85) 50%, rgba(168, 85, 247, 0.85) 100%); background-size: 200% 200%; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 30px rgba(56, 189, 248, 0.3); font-weight: 600; animation: auroraFlow 4s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 12px rgba(255,255,255,0.3); letter-spacing: 0.5px;',
        sendEffect: 'aurora',
        flavorText: '🌠 極光之下，每一句話都染上魔法的色彩',
        available: true
    },

    'cyber_neon': {
        id: 'cyber_neon',
        name: '🎆 霓虹賽博',
        description: '流動的霓虹光譜，展現未來科技與復古街頭的衝突美學。',
        price: 250,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(13, 148, 136, 0.9) 0%, rgba(147, 51, 234, 0.9) 50%, rgba(236, 72, 153, 0.9) 100%); color: #ffffff; border: 1px solid rgba(45, 212, 191, 0.5); box-shadow: 0 0 30px rgba(45, 212, 191, 0.3), inset 0 0 15px rgba(168, 85, 247, 0.2); font-weight: 700; animation: cyberGlitch 3.5s ease-in-out infinite;',
        textStyle: 'letter-spacing: 0.8px; text-shadow: 0 0 10px rgba(45, 212, 191, 0.5);',
        sendEffect: 'starlight',
        flavorText: '💫 在霓虹中，每個字都在發光',
        available: true
    },

    'glacial_frost': {
        id: 'glacial_frost',
        name: '❄️ 冰晶雪魄',
        description: '萬年冰川的純淨之藍，每一句話都如冰晶般清澈透亮。',
        price: 350,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(14, 165, 233, 0.85) 0%, rgba(56, 189, 248, 0.8) 100%); color: #f0f9ff; border: 1px solid rgba(125, 211, 252, 0.5); box-shadow: 0 4px 25px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(255,255,255,0.1); font-weight: 600; animation: skinGlowPulse 3s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 10px rgba(125, 211, 252, 0.4); letter-spacing: 0.3px;',
        sendEffect: 'sparkle',
        flavorText: '❄️ 冰晶記得每一句真心話',
        available: true
    },

    'abyssal_phantom': {
        id: 'abyssal_phantom',
        name: '👻 深淵魅影',
        description: '來自深淵的魅惑紫紅，帶著令人無法忽視的神秘氣場。',
        price: 450,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(88, 28, 135, 0.92) 0%, rgba(159, 18, 57, 0.92) 100%); color: #fce7f3; border: 1px solid rgba(244, 63, 94, 0.5); box-shadow: 0 4px 30px rgba(244, 63, 94, 0.3), inset 0 0 15px rgba(219, 39, 119, 0.2); font-weight: 700; animation: enchantedGlow 3s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 10px rgba(244, 63, 94, 0.4);',
        sendEffect: 'flame',
        flavorText: '🦇 夜色越深，言語越有力量',
        available: true
    },

    'twilight_glow': {
        id: 'twilight_glow',
        name: '🌅 暮光曙色',
        description: '夕陽與晚霞交織的最美時刻，溫柔地照亮每一個字。',
        price: 550,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(217, 70, 239, 0.85) 50%, rgba(244, 114, 182, 0.85) 100%); color: #fff; border: 1px solid rgba(244, 114, 182, 0.4); box-shadow: 0 4px 30px rgba(217, 70, 239, 0.25); font-weight: 700; animation: auroraFlow 5s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 0 10px rgba(244, 114, 182, 0.3);',
        sendEffect: 'petal',
        flavorText: '🌇 暮光之下，所有話語都變得溫柔',
        available: true
    },

    // ============================================================
    // ✨ 新增：傳說級動態皮膚（紀念章）
    // ============================================================

    'star_fragment': {
        id: 'star_fragment',
        name: '💫 星辰碎片',
        description: '流星劃過天際的瞬間，言語化為永恆的星光。',
        price: 400,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%); color: #e0e7ff; border: 2px solid rgba(129, 140, 248, 0.4); box-shadow: 0 4px 30px rgba(99, 102, 241, 0.2); font-weight: 600; position: relative; overflow: hidden;',
        textStyle: 'text-shadow: 0 0 15px rgba(129, 140, 248, 0.4); letter-spacing: 0.5px; position: relative; z-index: 1;',
        extraClass: 'star-skin',
        sendEffect: 'starlight',
        flavorText: '💫 星辰墜落之處，願望都會實現',
        available: false
    },

    'thunder_strike': {
        id: 'thunder_strike',
        name: '⚡ 雷霆閃電',
        description: '劃破夜空的閃電，每一句話都帶著雷鳴的力量。',
        price: 600,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); color: #fef3c7; border: 2px solid #fbbf24; box-shadow: 0 0 40px rgba(251, 191, 36, 0.2); font-weight: 700; position: relative; overflow: hidden; min-height: 50px;',
        textStyle: 'text-shadow: 0 0 20px rgba(251, 191, 36, 0.4); letter-spacing: 0.5px; position: relative; z-index: 1;',
        extraClass: 'lightning-skin',
        sendEffect: 'flame',
        flavorText: '⚡ 閃電劃過的瞬間，言語有了力量',
        available: false
    },

    'phoenix_rise': {
        id: 'phoenix_rise',
        name: '🔥 鳳凰涅槃',
        description: '浴火重生的鳳凰，每一句話都帶著烈焰的淬煉。',
        price: 750,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, #7c2d12 0%, #991b1b 50%, #7c2d12 100%); color: #fef3c7; border: 2px solid #f97316; box-shadow: 0 4px 40px rgba(249, 115, 22, 0.2); font-weight: 700; position: relative; overflow: hidden; min-height: 50px;',
        textStyle: 'text-shadow: 0 0 20px rgba(251, 146, 60, 0.4); letter-spacing: 0.5px; position: relative; z-index: 1;',
        extraClass: 'phoenix-skin',
        sendEffect: 'flame',
        flavorText: '🔥 烈焰之中，鳳凰浴火重生',
        available: false
    },

    // ============================================================
    // 🔥 傳說級（最稀有）
    // ============================================================

    'volcanic_magma': {
        id: 'volcanic_magma',
        name: '🌋 烈焰熔岩',
        description: '地心深處的熾熱熔岩，象徵永不熄滅的冒險者之魂。',
        price: 880,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(270deg, #c2410c, #991b1b, #f97316, #c2410c); background-size: 300% 300%; color: #ffedd5; border: 2px solid #fb923c; box-shadow: 0 4px 35px rgba(249, 115, 22, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.2); font-weight: 700; animation: magmaFlow 3s ease-in-out infinite;',
        textStyle: 'letter-spacing: 0.6px; text-shadow: 0 0 10px rgba(251, 146, 60, 0.5);',
        sendEffect: 'flame',
        flavorText: '🔥 烈焰般的言語，足以點亮黑夜',
        available: true
    },

    'cosmic_void': {
        id: 'cosmic_void',
        name: '🌀 宇宙虛空',
        description: '無盡星空的中心，言語在虛空中凝結成永恆的詩篇。',
        price: 1200,
        currency: 'memorialTokens',
        type: 'vip',
        rarity: 'legendary',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(88, 28, 135, 0.9) 50%, rgba(15, 15, 35, 0.95) 100%); background-size: 200% 200%; color: #e0e7ff; border: 2px solid rgba(129, 140, 248, 0.3); box-shadow: 0 4px 40px rgba(99, 102, 241, 0.2), inset 0 0 30px rgba(168, 85, 247, 0.1); font-weight: 700; animation: cosmicSpin 8s linear infinite;',
        textStyle: 'text-shadow: 0 0 15px rgba(129, 140, 248, 0.3); letter-spacing: 0.8px;',
        sendEffect: 'starlight',
        flavorText: '🌌 在宇宙深處，每個字都是星辰',
        available: true
    },

    // ============================================================
    // 🎯 限定版（活動限定）→ 先凍結
    // ============================================================

    'harvest_moon': {
        id: 'harvest_moon',
        name: '🌕 豐收滿月',
        description: '秋日滿月下的豐收慶典，溫暖的金色光輝照亮每個字。',
        price: 0,
        currency: 'sunCoins',
        type: 'limited',
        rarity: 'legendary',
        bubbleStyle: 'background: radial-gradient(circle at 30% 30%, rgba(254, 202, 87, 0.9), rgba(217, 119, 6, 0.9)); color: #422006; border: 2px solid rgba(254, 240, 138, 0.5); box-shadow: 0 4px 35px rgba(234, 179, 8, 0.4); font-weight: 700; animation: borderFlow 2s ease-in-out infinite;',
        textStyle: 'text-shadow: 0 1px 3px rgba(255,255,255,0.3);',
        sendEffect: 'glow',
        flavorText: '🌾 滿月之下，每個字都充滿祝福',
        available: false
    },

    'winter_wonder': {
        id: 'winter_wonder',
        name: '☃️ 冬雪奇境',
        description: '初雪覆蓋小鎮的童話時刻，純白的寧靜中藏著溫暖。',
        price: 0,
        currency: 'sunCoins',
        type: 'limited',
        rarity: 'epic',
        bubbleStyle: 'background: linear-gradient(135deg, rgba(226, 232, 240, 0.9) 0%, rgba(241, 245, 249, 0.95) 100%); color: #1e293b; border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 4px 25px rgba(255,255,255,0.1); font-weight: 600;',
        textStyle: 'text-shadow: 0 1px 3px rgba(255,255,255,0.5);',
        sendEffect: 'sparkle',
        flavorText: '❄️ 雪花的每一片，都是冬天的情書',
        available: false
    }
};