# 💰 FinSight – Personal Finance Manager

**FinSight** is a modern, full-stack personal finance management app that helps users track expenses, manage investments, set savings goals, and gain actionable insights into their financial habits. With real-time analytics, CSV import support, and AI-powered insights, FinSight makes personal finance simple and smart.

---

## 🚀 Features
- Expense tracking with category breakdowns  
- Investment portfolio management  
- Savings goal tracking with progress monitoring  
- AI-powered spending pattern analysis  
- CSV import for bulk transaction uploads  
- Interactive charts and real-time analytics  

---

## 🏗 Tech Stack

### Frontend
- **React 18 + TypeScript** – Modern, type-safe UI development  
- **Tailwind CSS + shadcn/ui** – Responsive, accessible styling  
- **Wouter** – Lightweight routing  
- **React Hook Form** – Type-safe form handling  
- **Chart.js** – Interactive financial visualizations  

### Backend
- **Node.js + Express.js** – REST API architecture  
- **TypeScript** – End-to-end type safety  
- **JWT Authentication + bcrypt** – Secure login & password hashing  
- **Drizzle ORM** – Type-safe database operations  
- **Multer** – CSV file upload & parsing  
- **Python Integration** – Advanced analytics for spending patterns  

### Data Storage
- **SQLite** – Local development & testing  
- **PostgreSQL** – Production database (via Neon Database)  
- **Drizzle Kit** – Schema management & migrations  

---

## 🔐 Authentication & Authorization
- JWT-based authentication (7-day token expiry)  
- bcrypt password hashing (12 salt rounds)  
- LocalStorage token storage for sessions  
- Middleware-protected API routes  

---

## 📦 External Dependencies
- **Neon Database** – Serverless PostgreSQL hosting  
- **Radix UI** – Accessible headless UI components  
- **Lucide React / Font Awesome** – Icon libraries  
- **Class Variance Authority / Tailwind Merge** – Type-safe class composition
- 
- **CSV Parser** – Bank statement & transaction import  

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+  
- npm or yarn  
- Python 3.x (for analytics module)  

### Installation
```sh
git clone <your-repo-url>
cd finsight
npm install
```

### Environment Variables
Create a `.env` file in the root:
```env
DATABASE_URL=postgres://user:password@host:port/db
JWT_SECRET=your_secret_key
PYTHON_PATH=/path/to/python
```

### Run the app
Frontend:
```sh
cd client
npm run dev
```
Backend:
```sh
cd server
npm run dev
```

---

## 📜 License
MIT License
