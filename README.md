# CoShop Marketplace Platform

CoShop is a marketplace platform designed to empower Small and Medium-sized Enterprises (SMEs) by providing them with an integrated online presence. The platform connects SMEs with consumers through business registration, inventory management, and geolocation-based discovery.

## Project Structure

```
coshop-marketplace/
├── backend/              # Node.js + Express backend API
│   ├── src/
│   │   ├── config/      # Database and Redis configuration
│   │   ├── services/    # Business logic services
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Authentication and validation
│   │   ├── routes/      # API route handlers
│   │   └── utils/       # Utility functions
│   ├── tests/           # Unit and integration tests
│   └── package.json
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client services
│   │   ├── store/       # State management
│   │   └── utils/       # Utility functions
│   └── package.json
├── database/            # Database initialization scripts
│   ├── init.sql        # PostgreSQL + PostGIS schema
│   └── README.md
└── .kiro/specs/        # Project specifications
    └── coshop-marketplace/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## Technology Stack

### Backend
- Node.js with Express.js
- PostgreSQL with PostGIS extension
- Redis for caching
- JWT authentication
- WebSocket for real-time features

### Frontend
- React.js
- Tailwind CSS
- React Router
- Leaflet for mapping
- Zustand for state management

### External Integrations
- Stripe/PayPal/M-Pesa for payments
- Uber API, Pick Up Mtaani for delivery
- Google Maps API for geolocation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS
- Redis 6+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
copy .env.example .env
```

4. Update `.env` with your configuration

5. Start development server:
```bash
npm run dev
```

The backend API will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
copy .env.example .env
```

4. Update `.env` with your configuration

5. Start development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

### Database Setup

1. Create PostgreSQL database:
```bash
createdb coshop_db
```

2. Run initialization script:
```bash
psql -d coshop_db -f database/init.sql
```

See `database/README.md` for more details.

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

### Code Quality

- Minimum 80% code coverage for business logic
- ESLint for code linting
- Prettier for code formatting

## Key Features

- Business registration and verification
- Real-time inventory management
- Geolocation-based discovery
- Order processing with delivery integration
- Bidirectional rating system
- Real-time messaging
- Analytics dashboard
- Multi-channel notifications

## Documentation

- [Requirements](.kiro/specs/coshop-marketplace/requirements.md)
- [Design Document](.kiro/specs/coshop-marketplace/design.md)
- [Implementation Tasks](.kiro/specs/coshop-marketplace/tasks.md)

## License

MIT
