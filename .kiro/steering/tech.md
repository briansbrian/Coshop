# Technology Stack

## Architecture

Microservices architecture with clear separation between frontend, backend services, and data layers.

## Recommended Stack

### Frontend
- **Framework**: React.js or Vue.js
- **Styling**: Tailwind CSS or Material-UI (responsive design required)
- **Mapping**: Leaflet or Google Maps JavaScript API
- **Real-time**: WebSocket for messaging and notifications

### Backend
- **Runtime**: Node.js with Express.js OR Python with FastAPI
- **API Design**: RESTful with JWT authentication
- **Real-time**: WebSocket server for live features

### Database & Storage
- **Primary Database**: PostgreSQL with PostGIS extension (geospatial data)
- **Caching**: Redis (sessions, frequently accessed data)
- **Search**: Elasticsearch (product search)
- **File Storage**: AWS S3 or similar object storage (images, documents)

### External Integrations
- **Payment**: Stripe, PayPal, M-Pesa
- **Delivery**: Uber API, Pick Up Mtaani API
- **Maps**: Google Maps API or OpenStreetMap

## Development Guidelines

### Before Implementation
- Always investigate existing codebase to understand current patterns
- Use Context7 to verify package API usage and documentation
- Consult Context7 for up-to-date library documentation and best practices
- Reference Context7 when integrating third-party services
- Review related code files to maintain architectural consistency

### Code Quality
- Minimum 80% code coverage for business logic
- 100% coverage for critical payment and order processing
- Follow error handling patterns defined in design document
- Use typed exceptions and consistent error response format

### Performance Requirements
- API response time < 200ms (95th percentile)
- Map loading with 1000+ businesses < 2 seconds
- Search results < 500ms
- Mobile page load < 3 seconds on 4G

### Security
- SQL injection prevention
- XSS and CSRF protection
- JWT token security
- Payment data encryption
- File upload validation
- OWASP compliance

## Common Commands

*Note: Project not yet implemented. Commands will be added once build system is established.*

Expected commands after implementation:
- `npm install` or `pip install -r requirements.txt` - Install dependencies
- `npm run dev` or `python manage.py runserver` - Start development server
- `npm test` or `pytest` - Run tests
- `npm run build` - Build for production
