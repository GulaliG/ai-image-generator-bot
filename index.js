require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '🖼️ Hoş geldin! Replicate üzerinden AI görsel oluşturmaya hazırım. Prompt yazman yeterli!');
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.text;

    if (prompt.startsWith('/start')) return;

    bot.sendMessage(chatId, '🧠 Görsel oluşturuluyor, lütfen bekle...');

    try {
        // Prediction başlat
        const response = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
                version: 'a9758cb8-3c97-43c8-aeaa-00a8f8375e53', // SDXL 1.0
                input: {
                    prompt: prompt
                }
            },
            {
                headers: {
                    'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const predictionId = response.data.id;

        // Sonucu bekle
        const checkStatus = async () => {
            const result = await axios.get(
                `https://api.replicate.com/v1/predictions/${predictionId}`,
                {
                    headers: {
                        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                    }
                }
            );

            if (result.data.status === 'succeeded') {
                const imageUrl = result.data.output[0];
                bot.sendPhoto(chatId, imageUrl);
            } else if (result.data.status === 'failed') {
                bot.sendMessage(chatId, '❌ Görsel oluşturulamadı.');
            } else {
                setTimeout(checkStatus, 2000);
            }
        };

        checkStatus();

    } catch (error) {
        console.error(error.response?.data || error);
        bot.sendMessage(chatId, '❌ API hatası oluştu. Lütfen tekrar dene.');
    }
});
