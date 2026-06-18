require("dotenv").config();

async function notifySuccess() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant — notification ignorée.",
    );
    return;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Build réussi",
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Échec de la notification Telegram :", error);
  }
}

notifySuccess().catch((error) => {
  console.error("Erreur lors de la notification Telegram :", error);
});
