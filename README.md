# 🚨 PanicSense

**AI-Powered Disaster Sentiment Analysis Platform for the Philippines**

PanicSense is an intelligent disaster monitoring and sentiment analysis platform designed specifically for the Philippines. It leverages advanced AI to analyze social media posts and news articles in real-time, helping emergency responders and communities understand the emotional urgency and impact of natural disasters.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

---

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Bilingual Sentiment Analysis**: Supports English, Tagalog, and Taglish (mixed) content
- **Emotion Classification**: Categorizes posts into Panic, Fear/Anxiety, Disbelief, Resilience, and Neutral
- **Disaster Type Detection**: Automatically identifies typhoons, earthquakes, floods, fires, volcanic eruptions, and landslides
- **Confidence Scoring**: Provides reliability metrics for each analysis

### 🗺️ Geographic Intelligence
- **Interactive Maps**: Visualizes disaster impact and sentiment distribution across Philippine regions
- **Location Extraction**: Automatically identifies affected areas from social media posts
- **Real-Time Tracking**: Monitors disaster progression with timestamp-based analysis

### 📊 Data Analytics
- **Dashboard Overview**: Real-time metrics, sentiment trends, and disaster statistics
- **Timeline Analysis**: Historical view of disaster events and sentiment evolution
- **Comparison Tools**: Compare multiple disasters or time periods
- **Evaluation Metrics**: Model performance tracking and accuracy monitoring

### 📰 News Monitoring
- **Multi-Source Aggregation**: Collects disaster news from various Philippine sources
- **AI Validation**: Filters and verifies disaster-related content
- **Real-Time Updates**: Live news feed with automatic categorization

### 🔄 Real-Time Processing
- **Live Twitter Integration**: Fetches and analyzes Philippines-specific disaster tweets
- **WebSocket Updates**: Real-time data streaming to frontend
- **Batch Processing**: Upload and analyze CSV files for historical data

### 👥 User Management
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Feedback System**: Users can correct sentiment analysis for continuous improvement
- **Secure Authentication**: Session-based authentication with encrypted passwords

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TailwindCSS** for modern, responsive styling
- **Radix UI** for accessible component library
- **TanStack Query** for efficient data fetching
- **Leaflet** for interactive maps
- **Chart.js** for data visualization
- **Framer Motion** for smooth animations

### Backend
- **Node.js** with Express
- **TypeScript** for type-safe server code
- **PostgreSQL** (Neon) for data storage
- **Drizzle ORM** for database operations
- **WebSocket (ws)** for real-time communication
- **Multer** for file upload handling

### AI/ML
- **Python 3.11+** for ML processing
- **Groq AI API** for sentiment analysis (Qwen 3 32B model)
- **NLTK** for natural language processing
- **TextBlob** for text analysis
- **scikit-learn** for machine learning utilities

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **Python** 3.11 or higher
- **PostgreSQL** 14.x or higher (or access to a PostgreSQL database)
- **npm** or **yarn** package manager

### Required API Keys

- **Groq API Key** (Required): Get from [console.groq.com](https://console.groq.com)
- **Twitter API Key** (Optional): For live Twitter data fetching
- **PostgreSQL Database**: Local or cloud-hosted (Neon, Render, etc.)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/panicsense.git
cd panicsense
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r server/python/requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your configuration
nano .env  # or use your preferred editor
```

**Minimum Required Configuration:**
```env
DATABASE_URL=postgresql://localhost:5432/panicsense
GROQ_API_KEY=your_groq_api_key_here

# For Development:
NODE_ENV=development
# ADMIN_PASSWORD is optional in development (defaults to '123456789')

# For Production (ALL REQUIRED):
NODE_ENV=production
ADMIN_PASSWORD=your_secure_password_minimum_12_chars
# Production will refuse to start without a secure ADMIN_PASSWORD
```

See `.env.example` for all available configuration options.

### 4. Set Up Database

```bash
# Push database schema to your PostgreSQL database
npm run db:push
```

### 5. Run Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

**Default Admin Credentials:**
- Username: `panicsenseadmin`
- Password: `your_secure_password_here` (from .env)

---

## 📦 Project Structure

```
panicsense/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions and API clients
│   └── public/            # Static assets
│
├── server/                # Backend Node.js server
│   ├── routes/           # API route handlers
│   ├── utils/            # Server utilities
│   ├── middleware/       # Express middleware
│   ├── python/           # Python ML scripts
│   └── index.ts          # Server entry point
│
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema (Drizzle ORM)
│
├── migrations/           # Database migrations
├── uploads/              # File upload directory
└── public/               # Public static files
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev           # Start development server with hot reload
npm run check         # Type-check TypeScript code

# Database
npm run db:push       # Push schema changes to database
npm run db:push --force   # Force push (bypasses data-loss warnings)

# Production
npm run build         # Build frontend and backend for production
npm run start         # Start production server
```

---

## 🌐 Deployment

PanicSense is designed to be deployment-ready for multiple cloud platforms. For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deployment Options

#### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

1. Connect your GitHub repository
2. Add environment variables from `.env.example`
3. Deploy!

#### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

1. Connect your GitHub repository
2. Add PostgreSQL service
3. Add environment variables
4. Deploy!

#### Deploy to Replit
1. Fork this Repl
2. Configure environment variables in Secrets
3. Run!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guides for Vercel, AWS, Heroku, Docker, and more.

---

## 📖 Usage Guide

### Dashboard
View real-time disaster metrics, sentiment distribution, and latest analyzed posts.

### Geographic Analysis
Explore disaster impact on an interactive map of the Philippines with sentiment visualization.

### Real-Time Analysis
- **Manual Analysis**: Enter text for instant sentiment analysis
- **Live Twitter Feed**: Fetch and analyze recent Philippines disaster tweets
- **Batch Upload**: Upload CSV files for bulk analysis

### News Monitoring
Track disaster-related news from multiple Philippine sources with AI validation.

### Timeline
View historical disaster events and sentiment trends over time.

### Evaluation
Monitor model performance, accuracy metrics, and provide feedback for improvement.

---

## 🔐 Security Best Practices

### Production Deployment Checklist

- [ ] **CRITICAL**: Set `ADMIN_PASSWORD` environment variable (minimum 12 characters, app will refuse to start without it)
- [ ] Use strong, unique passwords (16+ characters recommended)
- [ ] Generate secure password: `openssl rand -base64 24`
- [ ] Enable SSL/TLS for database connections
- [ ] Set `NODE_ENV=production`
- [ ] Restrict admin access to trusted IP addresses (if possible)
- [ ] Regularly update dependencies
- [ ] Monitor API key usage and rate limits
- [ ] Enable database backups
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Review and rotate API keys periodically

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use existing code conventions and patterns
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 API Documentation

### Sentiment Analysis API

```typescript
POST /api/analyze-text
Content-Type: application/json

{
  "text": "May lindol sa Metro Manila!",
  "language": "Taglish"
}

Response:
{
  "sentiment": "Panic",
  "confidence": 0.92,
  "language": "Tagalog",
  "disasterType": "Earthquake",
  "location": "Metro Manila",
  "explanation": "Text contains panic indicators..."
}
```

### Twitter Analysis API

```typescript
GET /api/twitter/stream?query=philippines+disaster

Response: Server-Sent Events (SSE)
```

See server documentation for complete API reference.

---

## 🐛 Troubleshooting

### Common Issues

**Server Refuses to Start in Production**
- Error: "ADMIN_PASSWORD is required in production mode"
  - **Solution**: Set `ADMIN_PASSWORD` environment variable to a secure password (minimum 12 characters)
  - Generate secure password: `openssl rand -base64 24`
- Error: "Admin password too weak for production deployment"
  - **Solution**: Use a password with at least 12 characters (16+ recommended)

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall and network settings
- Verify SSL mode matches your database configuration

**Python Scripts Not Running**
- Verify Python 3.11+ is installed
- Install Python dependencies: `pip install -r server/python/requirements.txt`
- Check `PYTHON_PATH` environment variable if using custom Python location

**Groq API Errors**
- Verify `GROQ_API_KEY` is set correctly
- Check API key validity at console.groq.com
- Monitor rate limits and usage quotas

**Port Already in Use**
- Change `PORT` environment variable
- Kill process using port 5000: `lsof -ti:5000 | xargs kill -9`

---

## 📊 Performance

- **Response Time**: < 200ms for sentiment analysis
- **Throughput**: 100+ posts/second batch processing
- **Database**: Optimized indexes for fast queries
- **Caching**: Intelligent caching for API responses
- **CDN Ready**: Static assets optimized for CDN delivery

---

## 🌟 Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support (Cebuano, Ilocano, etc.)
- [ ] Advanced data visualization with heatmaps
- [ ] Integration with government disaster APIs
- [ ] SMS/WhatsApp alerts for critical disasters
- [ ] Historical disaster database expansion
- [ ] Machine learning model improvements
- [ ] Public API for developers

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**PanicSense Team**
- Platform designed for Philippine disaster response
- Built with ❤️ for safer communities

---

## 🙏 Acknowledgments

- Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA)
- National Disaster Risk Reduction and Management Council (NDRRMC)
- Philippine Institute of Volcanology and Seismology (PHIVOLCS)
- Open-source community

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/panicsense/issues)
- **Email**: admin@panicsense.ph
- **Documentation**: [Wiki](https://github.com/yourusername/panicsense/wiki)

---

**Made with ❤️ for the Philippines 🇵🇭**
