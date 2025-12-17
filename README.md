# 🐋 BTC Whale Notify

**BTC Whale Notify** is a real-time Bitcoin whale transaction **notification system** that detects large Bitcoin movements on mainnet and sends alerts via **Telegram** and **Email**.

The system is powered by **Hiro Chainhook**, which listens to Bitcoin on-chain activity and triggers webhooks when large-value transactions occur.

---

## 🚀 What This Project Does

BTC Whale Notify monitors the Bitcoin blockchain for **high-value transactions** (commonly referred to as “whale activity”) and notifies users when those events happen.

Typical use cases include:
- Tracking large BTC transfers between wallets
- Monitoring exchange inflows and outflows
- Watching institutional or labeled whale addresses
- Receiving instant alerts for market-moving activity

---

## ⛓️ Core Technology: Hiro Chainhook

This application **uses Hiro Chainhook as its on-chain detection engine**.

### Why Hiro Chainhook?

Hiro Chainhook provides:
- Reliable Bitcoin mainnet indexing
- Predicate-based transaction filtering
- Real-time webhook delivery
- Production-grade blockchain infrastructure

BTC Whale Notify **does not scan the blockchain itself**.  
Instead, it relies on Chainhook to push relevant Bitcoin events to a webhook endpoint.

---

## 🔗 How Chainhook Is Used

1. Hiro Chainhook monitors Bitcoin mainnet
2. A predicate filters for large transaction outputs
3. Matching transactions trigger a webhook
4. BTC Whale Notify processes the event
5. Notifications are sent to configured channels

### Example Chainhook Configuration

```json
{
  "network": "mainnet",
  "predicate": {
    "scope": "outputs",
    "equals": {
      "output_value": {
        "gte": 10000000000
      }
    }
  },
  "webhook_url": "http://localhost:3000/chainhook",
  "auth_token": "${WEBHOOK_AUTH_TOKEN}"
}

## 🔔 Notification Channels

BTC Whale Notify currently supports:

- 📬 **Email notifications**
- 📱 **Telegram alerts**
- 🌐 **Webhook forwarding** (optional)

Each alert can include:

- BTC amount and USD value
- Transaction hash
- Sender and recipient addresses
- Labeled entities (if known)
- Block height and timestamp

---

## 🏷️ Labeled Address Tracking

The system supports labeled Bitcoin addresses, such as:

- Exchanges (Binance, Coinbase, Kraken)
- Institutions
- Known whale wallets

Labeled addresses make alerts more human-readable and actionable.

---


## 📊 Whale Activity Statistics

BTC Whale Notify can generate basic statistics such as:

- Whale activity over **24h / 7d / 30d / 90d**
- Transaction volume above a minimum BTC threshold
- Frequency of large transfers

---

## ⚙️ Environment Variables

```env
HIRO_API_KEY=
WEBHOOK_AUTH_TOKEN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

EMAIL_FROM=
EMAIL_TO=
