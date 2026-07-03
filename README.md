
# 🌍 Global Smart Currency Converter & Exchange Rate Analytics

A **full-stack fintech web application** that provides real-time currency conversion, cryptocurrency tracking, historical exchange charts, AI insights, financial news, and advanced analytics in a modern dashboard UI.

---

## 🚀 Live Demo
Coming Soon...

---

## 📌 Features

### 💱 Currency Converter
- Real-time conversion of 170+ global currencies
- Live exchange rates API integration
- Swap currencies instantly
- Country flags and symbols support

### 📊 Market Dashboard
- Live forex rates
- Top gainers & losers
- Currency heatmap
- Market trends & analytics

### 📈 Historical Charts
- 1D / 7D / 1M / 1Y views
- Interactive charts (Chart.js / Recharts)
- Compare multiple currencies

### 🪙 Cryptocurrency Module
- Bitcoin, Ethereum, and major crypto tracking
- Market cap, volume, and price changes
- Live updates

### 🤖 AI Insights
- Currency trend predictions
- Buy / Sell / Hold suggestions
- Market summary analysis

### 📰 Financial News
- Forex & crypto news updates
- Category filtering
- Bookmark system

### 🔔 Alerts System
- Exchange rate notifications
- Email / browser alerts
- Custom thresholds

### ⭐ Favorites & History
- Save currency pairs
- Conversion history tracking
- Export data (CSV / PDF / Excel)

### 📊 Admin Dashboard
- User analytics
- API usage tracking
- System monitoring

---

## 🛠️ Tech Stack

### Frontend
- React.js (TypeScript)
- Vite
- Tailwind CSS
- React Router
- React Query (TanStack Query)
- Recharts / Chart.js
- Framer Motion
- Axios

### Backend
- Node.js
- Express.js (TypeScript)
- JWT Authentication
- bcrypt.js
- Helmet, CORS, Morgan
- Express Validator

### Database
- MongoDB Atlas
- Mongoose ODM

### APIs Used
- Exchange Rate API
- Cryptocurrency API
- Financial News API
- Country Information API
- AI API (Gemini / OpenAI)

---

## 📁 Project Structure

```

global-currency-converter/

client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   └── App.tsx

server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── app.ts

shared/
.env
README.md

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/global-currency-converter.git
cd global-currency-converter
````

---

### 2️⃣ Install Dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd server
npm install
```

---

### 3️⃣ Environment Variables

Create `.env` files in both **client** and **server**.

#### Server `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

EXCHANGE_API_KEY=your_api_key
NEWS_API_KEY=your_api_key
CRYPTO_API_KEY=your_api_key
```

#### Client `.env`

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

### 4️⃣ Run the Project

#### Start Backend

```bash
cd server
npm run dev
```

#### Start Frontend

```bash
cd client
npm run dev
```

---

## 🌐 API Endpoints

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* POST `/api/auth/logout`

### Currency

* GET `/api/currency/latest`
* GET `/api/currency/convert`
* GET `/api/currency/history`

### Crypto

* GET `/api/crypto`

### News

* GET `/api/news`

### Favorites

* GET `/api/favorites`
* POST `/api/favorites`

### Alerts

* GET `/api/alerts`
* POST `/api/alerts`

---

## 🔐 Security Features

* JWT Authentication
* Password hashing (bcrypt)
* Input validation
* Rate limiting
* Secure environment variables
* Role-based access control

---

## 📱 UI Features

* Responsive design (Mobile / Tablet / Desktop)
* Dark & Light mode
* Glassmorphism UI
* Smooth animations
* Modern fintech dashboard

---

## 📊 Future Improvements

* AI-based trading signals
* Stock market integration
* Mobile app (React Native)
* WebSocket live updates
* Multi-language support

---

## 👨‍💻 Author

**Praneth S**

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Show Your Support

If you like this project:

* Give a ⭐ on GitHub
* Share with others
* Contribute to improvements

```

---

If you want next step, I can also generate:
- 🔥 **GitHub repo structure with actual backend + frontend code**
- 🔥 **Docker setup**
- 🔥 **Deployment (Vercel + Render) guide**
- 🔥 **Complete working starter template**

Just tell 👍
```
# Smart-Currency-Calculator
