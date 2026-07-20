// 簡單的 Gemini API 串接服務
export class GeminiService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async chatWithAura(userNickname: string, mood: string, item: string, userMessage: string): Promise<string> {
        if (!this.apiKey) {
            return "（晨曦微笑著倒了一杯熱茶）：抱歉呢，站長的 API Key 還沒設定，我現在只能先用眼神溫暖你了～";
        }

        const prompt = `
你現在是遊戲《Where Daylight Pauses 日光停靠站》的 NPC 接待員「晨曦 (Aura)」。
性格：溫柔、溫暖、睿智、帶有一點點微柔幽默感的咖啡師兼站務員。
玩家資訊：
- 暱稱：${userNickname}
- 今日心境：${mood}
- 隨身信物：${item}

玩家剛剛對你說了："${userMessage}"

請以晨曦的身分回覆玩家：
1. 請保持溫暖且語氣自然，像是坐在平靜的小站長椅上聊天。
2. 結合玩家的心境或信物做出一點點自然的回應。
3. 控制在 80~120 字以內，不要寫得太長。
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
            return "晨曦看著遠方輕笑了一下：「今天的風真舒服呢。」";
        } catch (e) {
            console.error("Gemini API Error:", e);
            return "晨曦正在為客人遞上一杯咖啡，暫時沒有聽清楚你說的話～";
        }
    }
}