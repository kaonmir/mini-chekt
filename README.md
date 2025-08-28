# Chekt - CCTV Monitoring System

A comprehensive CCTV monitoring system with real-time streaming, web interface, and cloud backend.

## 🏗️ Architecture

```
chekt/
├── bridge/          # CCTV streaming server (Go)
├── web/            # Web application (Next.js)
├── supabase/       # Database and backend services
└── data/           # Data storage
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for web development)
- Go 1.21+ (for bridge development)
- Supabase CLI

### 1. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
cd supabase
supabase start

# Apply migrations
supabase db reset
```

### 2. Bridge Server (CCTV Streaming)

```bash
cd bridge

# Build the streaming server
make

# Run with configuration
./mediamtx mediamtx.yml
```

The bridge server provides:

- RTSP/RTMP streaming support
- HLS and WebRTC protocols
- Recording capabilities
- API for stream management

### 3. Web Application

```bash
cd web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Access the web interface at `http://localhost:3000`

## 📁 Project Structure

### Bridge (CCTV Server)

- **`internal/`**: Core streaming functionality
- **`protocols/`**: RTSP, RTMP, HLS, WebRTC support
- **`recorder/`**: Video recording capabilities
- **`servers/`**: HTTP API and management interfaces

### Web Application

- **`app/`**: Next.js 13+ app directory
- **`components/`**: Reusable UI components
- **`lib/`**: Utilities and database connections
- **`hooks/`**: Custom React hooks

### Supabase Backend

- **`database/`**: SQL schema and policies
- **`migrations/`**: Database migrations
- **`function/`**: Edge functions

## 🔧 Configuration

### Bridge Configuration

Edit `bridge/mediamtx.yml` to configure:

- Stream sources (RTSP cameras)
- Recording settings
- API endpoints
- Authentication

### Web Application

Environment variables in `web/.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BRIDGE_API_URL=http://localhost:9997
```

## 🎥 Features

### CCTV Management

- Add/remove camera streams
- Real-time video streaming
- Recording and playback
- Motion detection alerts

### Web Interface

- Modern, responsive UI
- Real-time notifications
- User authentication
- Site management

### Backend Services

- User management
- Alarm notifications
- Data persistence
- Real-time updates

## 🛠️ Development

### Running Tests

```bash
# Bridge tests
cd bridge
make test

# Web application tests
cd web
npm test
```

### Building for Production

```bash
# Bridge
cd bridge
make

# Web application
cd web
npm run build
```

## 📊 Monitoring

### Bridge Server Metrics

- Stream health monitoring
- Performance metrics
- Error logging

### Web Application

- User activity tracking
- Error monitoring
- Performance analytics

## 🔒 Security

- JWT authentication
- Row Level Security (RLS)
- Encrypted communications
- Access control policies

## 📝 API Documentation

### Bridge API

- RESTful API for stream management
- WebSocket for real-time updates
- OpenAPI specification available

### Web Application API

- Next.js API routes
- Supabase client integration
- Real-time subscriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information
