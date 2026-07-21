export interface ItemDefinition {
    id: string;
    name: string;
    category: 'consumable' | 'equipment' | 'material';
    icon: string;
    desc: string;
    rarity?: 'common' | 'rare' | 'epic';
    effect?: {
        resilience?: number; // 提升心靈韌性
        perception?: number; // 提升感知力
        energy?: number;     // 提升/恢復專注力與能量
    };
}

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
    // === 🌟 經典隨身/陪伴物品 (確保每日登入與初始選擇記錄正常) ===
    'item_51': { 
        id: 'item_51', name: '暖心熱茶', category: 'consumable', icon: '🍵', desc: '驅散寒意，帶來溫暖的療癒感。', rarity: 'common',
        effect: { resilience: 3, energy: 15 } 
    },
    'item_52': { 
        id: 'item_52', name: '舊相機', category: 'equipment', icon: '📷', desc: '捕捉沿途的光影與美好瞬間。', rarity: 'rare',
        effect: { perception: 5 } 
    },
    'item_53': { 
        id: 'item_53', name: '旅行日記', category: 'consumable', icon: '📓', desc: '記錄今天的靈感與心情點滴。', rarity: 'common',
        effect: { perception: 3, resilience: 2 } 
    },
    'item_54': { 
        id: 'item_54', name: '懷錶', category: 'equipment', icon: '⌚', desc: '提醒自己放慢腳步，享受當下。', rarity: 'rare',
        effect: { resilience: 4 } 
    },

    // === 咖啡與茶飲類 (消耗品) ===
    'item_1': { id: 'item_1', name: '香濃熱咖啡', category: 'consumable', icon: '☕', desc: '咖啡館特製的熱咖啡，飲用後可恢復些許精神，帶來溫暖。', rarity: 'common', effect: { energy: 20 } },
    'item_2': { id: 'item_2', name: '洋甘菊舒壓茶', category: 'consumable', icon: '🍵', desc: '帶有淡淡花香的草本茶，能撫平焦慮與疲憊的心靈。', rarity: 'common', effect: { resilience: 5, energy: 10 } },
    'item_3': { id: 'item_3', name: '冰釀蜂蜜檸檬', category: 'consumable', icon: '🍋', desc: '酸甜清涼的消暑良伴，在炎熱午後帶來一抹清爽。', rarity: 'common', effect: { energy: 15 } },
    'item_4': { id: 'item_4', name: '黑糖薑母茶', category: 'consumable', icon: '🫚', desc: '微辣帶甜的暖心熱飲，驅散雨天帶來的潮濕寒意。', rarity: 'common', effect: { resilience: 4, energy: 15 } },
    'item_5': { id: 'item_5', name: '職人手沖拿鐵', category: 'consumable', icon: '🥛', desc: '綿密奶泡與濃郁咖啡交織的完美比例，充滿幸福感。', rarity: 'rare', effect: { energy: 25, resilience: 2 } },
    'item_6': { id: 'item_6', name: '特調星空可可', category: 'consumable', icon: '🍫', desc: '撒上食用金箔的濃郁熱可可，夜晚喝了能做個好夢。', rarity: 'rare', effect: { resilience: 8, energy: 10 } },
    'item_7': { id: 'item_7', name: '薄荷冰沙', category: 'consumable', icon: '🌿', desc: '瞬間提神醒腦的清涼冰品，夏天不可或缺的良藥。', rarity: 'common', effect: { energy: 20 } },
    'item_8': { id: 'item_8', name: '桂圓紅棗茶', category: 'consumable', icon: '🥣', desc: '傳統滋補的甜湯，滋潤喉嚨也溫暖心房。', rarity: 'common', effect: { resilience: 6, energy: 10 } },

    // === 甜點與輕食類 (消耗品) ===
    'item_9': { id: 'item_9', name: '法式經典可頌', category: 'consumable', icon: '🥐', desc: '外皮酥脆、奶油香氣四溢的晨光早餐首選。', rarity: 'common', effect: { energy: 15 } },
    'item_10': { id: 'item_10', name: '手工草莓大福', category: 'consumable', icon: '🍓', desc: 'Q彈麻糬包覆著多汁草莓與綿密紅豆泥，酸甜適中。', rarity: 'common', effect: { resilience: 3, energy: 10 } },
    'item_11': { id: 'item_11', name: '抹茶紅豆戚風', category: 'consumable', icon: '🍰', desc: '茶香濃郁而不苦澀的日式風味蛋糕。', rarity: 'rare', effect: { resilience: 5, energy: 10 } },
    'item_12': { id: 'item_12', name: '奶油肉桂捲', category: 'consumable', icon: '🥨', desc: '出爐時香氣撲鼻，療癒力滿點的罪惡美味。', rarity: 'common', effect: { resilience: 4, energy: 15 } },
    'item_13': { id: 'item_13', name: '蜂蜜鬆餅', category: 'consumable', icon: '🥞', desc: '淋滿琥珀色天然蜂蜜的金黃鬆餅。', rarity: 'common', effect: { energy: 20 } },
    'item_14': { id: 'item_14', name: '手工黑巧餅乾', category: 'consumable', icon: '🍪', desc: '酥脆扎實的巧克力餅乾，適合配茶享用。', rarity: 'common', effect: { energy: 10 } },
    'item_15': { id: 'item_15', name: '暖心蘋果派', category: 'consumable', icon: '🥧', desc: '帶有肉桂香氣的熱烤蘋果內餡，家的味道。', rarity: 'rare', effect: { resilience: 6, energy: 15 } },
    'item_16': { id: 'item_16', name: '彩虹馬卡龍', category: 'consumable', icon: '🍬', desc: '精緻甜美的法式小點心，看了心情就會變好。', rarity: 'epic', effect: { resilience: 10, perception: 2 } },

    // === 隨身心情與日常物品 ===
    'item_17': { id: 'item_17', name: '空白心情筆記本', category: 'consumable', icon: '📓', desc: '用來記錄每日呢喃與靈感的乾淨筆記本。', rarity: 'common', effect: { perception: 3 } },
    'item_18': { id: 'item_18', name: '彩色鋼筆墨水', category: 'consumable', icon: '🖋️', desc: '深藍色的沉穩墨水，適合寫下真摯的文字。', rarity: 'common', effect: { perception: 2 } },
    'item_19': { id: 'item_19', name: '暖光隨身香氛蠟燭', category: 'consumable', icon: '🕯️', desc: '散發淡淡薰衣草香，點燃後能沉澱雜亂的思緒。', rarity: 'rare', effect: { resilience: 8 } },
    'item_20': { id: 'item_20', name: '復古底片相機', category: 'consumable', icon: '📷', desc: '記錄小鎮日常與美好瞬間的機械式相機。', rarity: 'rare', effect: { perception: 6 } },
    'item_21': { id: 'item_21', name: '晴天娃娃', category: 'consumable', icon: '🏮', desc: '掛在窗前祈求明天也是個好天氣的手作吊飾。', rarity: 'common', effect: { resilience: 4 } },
    'item_22': { id: 'item_22', name: '音樂盒', category: 'consumable', icon: '🎶', desc: '轉動發條就會流瀉出清脆悠揚旋律的古董音樂盒。', rarity: 'epic', effect: { resilience: 12, perception: 4 } },
    'item_23': { id: 'item_23', name: '暖暖包', category: 'consumable', icon: '🔥', desc: '寒冬或雨天時握在手中瞬間暖和的隨身法寶。', rarity: 'common', effect: { energy: 10, resilience: 2 } },
    'item_24': { id: 'item_24', name: '薄荷精油滾珠', category: 'consumable', icon: '💧', desc: '感到疲憊時塗抹在太陽穴，能瞬間清爽。', rarity: 'common', effect: { energy: 15 } },

    // === 自然與探索材料 ===
    'item_25': { id: 'item_25', name: '祈願星砂', category: 'material', icon: '✨', desc: '在中央記憶噴泉附近收集到的閃亮星砂，散發著微光。', rarity: 'rare' },
    'item_26': { id: 'item_26', name: '神祕樹果', category: 'consumable', icon: '🍎', desc: '帶有甜香味的野生果實，野外探索時常見的補給品。', rarity: 'common', effect: { energy: 10 } },
    'item_27': { id: 'item_27', name: '鎮民感謝信', category: 'material', icon: '💌', desc: '來自小鎮居民的謝函，乘載著滿滿的人情味。', rarity: 'common' },
    'item_28': { id: 'item_28', name: '乾燥薰衣草束', category: 'material', icon: '🌾', desc: '散發天然香氣的乾燥花束，可製作成香包。', rarity: 'common' },
    'item_29': { id: 'item_29', name: '光滑的河川鵝卵石', category: 'material', icon: '🪨', desc: '被溪水打磨得圓潤平滑的石頭，適合拿來彩繪。', rarity: 'common' },
    'item_30': { id: 'item_30', name: '螢光小蘑菇', category: 'material', icon: '🍄', desc: '在深夜森林深處採集到的微光蕈類。', rarity: 'rare' },
    'item_31': { id: 'item_31', name: '晨曦露珠瓶', category: 'material', icon: '🧪', desc: '清晨第一道曙光照耀下採集的純淨露水。', rarity: 'rare' },
    'item_32': { id: 'item_32', name: '四葉幸運草', category: 'material', icon: '🍀', desc: '極其罕見的幸運象徵，壓在書本裡保存得很好。', rarity: 'epic' },
    'item_33': { id: 'item_33', name: '海風貝殼', category: 'material', icon: '🐚', desc: '耳邊彷彿能聽見海浪聲的白色海螺。', rarity: 'common' },
    'item_34': { id: 'item_34', name: '老舊的銅質齒輪', category: 'material', icon: '⚙️', desc: '某個精密機械上掉落的零件，帶有歲月痕跡。', rarity: 'rare' },

    // === 季節與節慶特產 ===
    'item_35': { id: 'item_35', name: '楓紅落葉', category: 'material', icon: '🍁', desc: '秋意正濃時撿到的金黃與赤紅落葉。', rarity: 'common' },
    'item_36': { id: 'item_36', name: '冬日雪晶片', category: 'material', icon: '❄️', desc: '初雪落下時凝結的冰晶，魔法般地不會融化。', rarity: 'rare' },
    'item_37': { id: 'item_37', name: '春櫻花瓣', category: 'material', icon: '🌸', desc: '微風吹拂下收集到的粉嫩櫻花瓣。', rarity: 'common' },
    'item_38': { id: 'item_38', name: '夏日向日葵種子', category: 'material', icon: '🌻', desc: '充滿朝氣與陽光能量的飽滿種子。', rarity: 'common' },
    'item_39': { id: 'item_39', name: '萬聖南瓜糖', category: 'consumable', icon: '🍬', desc: '帶有肉桂與南瓜風味的搞怪糖果。', rarity: 'common', effect: { energy: 10 } },
    'item_40': { id: 'item_40', name: '平安夜薑餅人', category: 'consumable', icon: '🍪', desc: '聖誕節限定的手工薑餅，造型十分可愛。', rarity: 'rare', effect: { resilience: 5, energy: 10 } },

    // === 收藏與紀念品類 ===
    'item_41': { id: 'item_41', name: '記憶拼圖碎片', category: 'material', icon: '🧩', desc: '散落在鎮上各處的神秘拼圖, 似乎能拼湊出某段故事。', rarity: 'epic' },
    'item_42': { id: 'item_42', name: '舊時代的火車票', category: 'material', icon: '🎫', desc: '一張沒有期限、通往未知遠方的車票。', rarity: 'rare' },
    'item_43': { id: 'item_43', name: '泛黃的舊地圖', category: 'material', icon: '🗺️', desc: '標示著小鎮不為人知秘徑的手繪地圖。', rarity: 'rare' },
    'item_44': { id: 'item_44', name: '黃銅鑰匙', category: 'material', icon: '🔑', desc: '不知道能打開哪裡的小巧鑰匙，帶有神祕感。', rarity: 'epic' },
    'item_45': { id: 'item_45', name: '流星許願御守', category: 'material', icon: '🎐', desc: '在流星雨之夜祈福過的平安御守。', rarity: 'epic' },
    'item_46': { id: 'item_46', name: '玻璃漂流瓶', category: 'material', icon: '🍾', desc: '瓶中裝著寫給未來自己的信件。', rarity: 'rare' },
    'item_47': { id: 'item_47', name: '彩色玻璃彈珠', category: 'material', icon: '🔮', desc: '透光看會折射出絢麗色彩的童年玩具。', rarity: 'common' },
    'item_48': { id: 'item_48', name: '手工編織手環', category: 'material', icon: '🧶', desc: '友善的居民親手編織的結緣手環。', rarity: 'rare' },
    'item_49': { id: 'item_49', name: '詩集殘頁', category: 'material', icon: '📄', desc: '寫優美散文與詩句的泛黃紙頁。', rarity: 'common' },
    'item_50': { id: 'item_50', name: '太陽光芒結晶', category: 'material', icon: '☀️', desc: '象徵精神的溫暖核心結晶。', rarity: 'epic', effect: { resilience: 20, perception: 10, energy: 50 } },

    // === 煉金工房專屬合成產出道具 (item_55 ~ item_64) ===
    'item_55': {
        id: 'item_55', name: '晨露舒壓香包', category: 'consumable', icon: '🌿', 
        desc: '用晨曦露珠與乾燥薰衣草手作的香包，散發著令人心安的草本芬芳，能有效撫平焦慮。', rarity: 'rare',
        effect: { resilience: 10, energy: 10 }
    },
    'item_56': {
        id: 'item_56', name: '星砂許願瓶', category: 'consumable', icon: '🌟', 
        desc: '封存了祈願星砂與河川鵝卵石的浪漫玻璃瓶，搖晃時會閃爍著微光，帶來靈感。', rarity: 'epic',
        effect: { resilience: 15, perception: 8 }
    },
    'item_57': {
        id: 'item_57', name: '微光蕈菇濃湯', category: 'consumable', icon: '🍲', 
        desc: '使用深夜森林的螢光小蘑菇熬煮的溫熱濃湯，入口滑順，能迅速恢復精神與體力。', rarity: 'rare',
        effect: { energy: 35, resilience: 5 }
    },
    'item_58': {
        id: 'item_58', name: '時光齒輪吊飾', category: 'consumable', icon: '⚙️', 
        desc: '將老舊銅質齒輪與海風貝殼打磨串聯而成的精緻工藝品，戴上它會對周遭環境更有敏銳度。', rarity: 'rare',
        effect: { perception: 15 }
    },
    'item_59': {
        id: 'item_59', name: '四季花果蜜', category: 'consumable', icon: '🍯', 
        desc: '完美調和了春櫻花瓣甜香與神祕樹果精華的天然果蜜，甜而不膩，活力滿點。', rarity: 'common',
        effect: { energy: 30 }
    },
    'item_60': {
        id: 'item_60', name: '奇蹟四葉御守', category: 'consumable', icon: '🍀', 
        desc: '結合四葉幸運草與太陽光芒結晶的頂級護身符，擁有強大的心靈庇護力量。', rarity: 'epic',
        effect: { resilience: 25, perception: 15, energy: 40 }
    },
    'item_61': {
        id: 'item_61', name: '楓香暖手茶包', category: 'consumable', icon: '🍁', 
        desc: '揉合了楓紅落葉與神祕果香的溫潤茶包，在微涼雨天飲用能驅散寒意與煩躁。', rarity: 'common',
        effect: { resilience: 12, energy: 15 }
    },
    'item_62': {
        id: 'item_62', name: '冰晶清涼露', category: 'consumable', icon: '❄️', 
        desc: '由永不融化的冬日雪晶片淬鍊而成的清涼飲品，瞬間提神醒腦、思緒清晰。', rarity: 'rare',
        effect: { perception: 12, energy: 20 }
    },
    'item_63': {
        id: 'item_63', name: '向日葵朝氣餅', category: 'consumable', icon: '🌻', 
        desc: '加入向日葵種子烘焙而成的酥脆餅乾，每一口都充滿陽光的溫暖氣息。', rarity: 'common',
        effect: { energy: 25 }
    },
    'item_64': {
        id: 'item_64', name: '記憶星圖吊墜', category: 'consumable', icon: '🧩', 
        desc: '將多片記憶拼圖碎片拼湊重組後雕琢而成的神祕墜飾，能喚醒深層的感知力。', rarity: 'epic',
        effect: { perception: 25, resilience: 10 }
    }
};

export interface AlchemyRecipe {
    resultId: string;
    materials: { itemId: string; count: number }[];
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
    {
        resultId: 'item_55',
        materials: [{ itemId: 'item_31', count: 1 }, { itemId: 'item_28', count: 2 }]
    },
    {
        resultId: 'item_56',
        materials: [{ itemId: 'item_25', count: 1 }, { itemId: 'item_29', count: 1 }]
    },
    {
        resultId: 'item_57',
        materials: [{ itemId: 'item_30', count: 2 }, { itemId: 'item_26', count: 1 }]
    },
    {
        resultId: 'item_58',
        materials: [{ itemId: 'item_34', count: 1 }, { itemId: 'item_33', count: 1 }]
    },
    {
        resultId: 'item_59',
        materials: [{ itemId: 'item_37', count: 2 }, { itemId: 'item_26', count: 2 }]
    },
    {
        resultId: 'item_60',
        materials: [{ itemId: 'item_32', count: 1 }, { itemId: 'item_50', count: 1 }]
    },
    {
        resultId: 'item_61',
        materials: [{ itemId: 'item_35', count: 2 }, { itemId: 'item_26', count: 1 }]
    },
    {
        resultId: 'item_62',
        materials: [{ itemId: 'item_36', count: 1 }, { itemId: 'item_31', count: 1 }]
    },
    {
        resultId: 'item_63',
        materials: [{ itemId: 'item_38', count: 2 }, { itemId: 'item_26', count: 1 }]
    },
    {
        resultId: 'item_64',
        materials: [{ itemId: 'item_41', count: 2 }, { itemId: 'item_25', count: 1 }]
    }
];