# 🚀 Development Setup Guide

This guide shows you how to run the ToluAI application with hot reload for both Flask backend and React frontend.

## 🔧 Prerequisites

- Python 3.8+ with virtual environment
- Node.js 16+ with npm
- SQLite database (automatically created)

## 🏃‍♂️ Quick Start

### Option 1: Start Everything at Once (Recommended)

```bash
# Run both Flask and React with hot reload
./start_dev.sh
```

This will:
- ✅ Start Flask backend on http://localhost:5000 with hot reload
- ✅ Start React frontend on http://localhost:5173 with hot reload  
- ✅ Enable CORS for cross-origin requests
- ✅ Show logs from both servers
- ✅ Stop both servers when you press Ctrl+C

### Option 2: Start Servers Individually

#### Backend (Flask)
```bash
# Terminal 1 - Start Flask with hot reload
python run_dev.py
```

#### Frontend (React)
```bash
# Terminal 2 - Start React with hot reload
cd frontend
npm run dev
```

## 📍 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React UI with hot reload |
| **Backend API** | http://localhost:5000 | Flask API server |
| **API Health** | http://localhost:5000/api/v1/health | API health check |
| **IRPA Dashboard** | http://localhost:5173 | IRPA management interface |

## 🔄 Hot Reload Features

### Flask Backend Hot Reload
- ✅ **Auto-restart** when Python files change
- ✅ **Template reload** for HTML templates
- ✅ **Debug mode** with interactive debugger
- ✅ **Error overlay** in browser for Python errors
- ✅ **CORS enabled** for frontend communication

### React Frontend Hot Reload
- ✅ **Fast Refresh** for React components
- ✅ **CSS hot reload** including Tailwind changes
- ✅ **TypeScript compilation** with error overlay
- ✅ **State preservation** during component updates
- ✅ **API proxy** to Flask backend

## 🛠️ Development Configuration

### Environment Variables
```bash
# Flask development settings (automatically set by scripts)
FLASK_ENV=development
FLASK_DEBUG=1
```

### Flask Configuration
- **Debug Mode**: Enabled
- **Auto Reload**: Enabled  
- **CORS Origins**: localhost:5173, 127.0.0.1:5173
- **Template Auto Reload**: Enabled

### React/Vite Configuration
- **Port**: 5173
- **Hot Module Replacement**: Enabled
- **Error Overlay**: Enabled
- **API Proxy**: Proxies `/api/*` to Flask backend
- **File Watching**: Polling enabled for better compatibility

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 5000 or 5173
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Flask Not Reloading
- Make sure `FLASK_DEBUG=1` is set
- Check file permissions in project directory
- Try restarting the development server

### React Not Hot Reloading
- Clear browser cache
- Check console for WebSocket connection errors
- Restart React dev server: `Ctrl+C` then `npm run dev`

### CORS Issues
- Verify Flask CORS configuration in `config/development.py`
- Check browser network tab for preflight requests
- Make sure both servers are running

## 🎯 Database Development

### IRPA System
```bash
# Initialize IRPA system (run once)
flask init-irpa-system

# Create admin user
flask create-irpa-admin admin@company.com password123 "Company Name"
```

### Database Commands
```bash
# Apply migrations
flask db upgrade

# Create new migration
flask db migrate -m "Description"

# Reset database (⚠️  destroys all data)
flask reset-db
```

## 📁 Project Structure
```
/
├── app/                 # Flask backend
│   ├── models/         # SQLAlchemy models  
│   ├── api/           # API endpoints
│   └── services/      # Business logic
├── frontend/           # React frontend
│   ├── src/           # React source code
│   └── dist/          # Built files
├── run_dev.py         # Flask dev server
├── start_dev.sh       # Combined dev server script
└── DEV_SETUP.md      # This file
```

## 🎉 Happy Coding!

Your development environment is now set up with:
- ⚡ **Lightning-fast hot reload** for both frontend and backend
- 🔧 **Automatic error detection** and browser overlays  
- 🌐 **CORS configured** for seamless API communication
- 📊 **Full IRPA system** ready for insurance risk assessment
- 🛡️ **Development security** with proper authentication

Make changes to any Python or React files and watch them update automatically! 🚀