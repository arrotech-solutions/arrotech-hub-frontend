# Arrotech Hub Frontend

A modern React TypeScript frontend for the Arrotech Hub Server, providing a comprehensive interface for managing AI model integrations with marketing tools and business platforms.

## Features

### 🔐 Authentication
- User registration and login
- JWT token-based authentication
- Protected routes and session management
- User profile management

### 🔗 Connection Management
- Create and manage extensive tool integrations
- Support for HubSpot, GA4, Slack, Zoho, Xero, QuickBooks, Airtable, social media, and much more.
- Connection testing and status monitoring
- Configuration management for each platform

### ⚡ Automation & Tools
- Execute AI model tools and integrations
- Dynamic parameter input based on tool schemas
- Real-time tool execution and result display
- Workflows and Agents

### 💳 Payment Integration
- M-Pesa payment processing
- Stripe payment integration
- Payment history tracking
- Subscription management
- Enterprise setup payments

### 📊 Dashboard & Analytics
- Real-time server status monitoring
- Usage statistics and billing information
- System health indicators
- Quick access to all features

## Tech Stack

- **React 18** with TypeScript
- **Vite** as the build tool for fast and optimized bundling
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **React Hook Form** for form management
- **React Flow** for Visual Workflow mapping

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Vite development server:
```bash
npm start
```

3. Open the localhost URL provided by Vite in your browser (typically `http://localhost:5173`).

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```
*(Notice that Vite requires the `VITE_` prefix for client-exposed environment variables)*

## API Integration

The frontend is fully synchronized with the backend API endpoints:

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Connection Management
- `GET /connections` - List user connections
- `POST /connections` - Create new connection
- `PUT /connections/{id}` - Update connection
- `DELETE /connections/{id}` - Delete connection
- `POST /connections/{id}/test` - Test connection
- `GET /connections/platforms` - Get available platforms

### Automation Tools
- `GET /mcp/tools` - List available tools
- `POST /mcp/execute` - Execute tool with parameters

### Payment Processing
- `POST /payments/mpesa/initiate` - Initiate M-Pesa payment
- `POST /payments/mpesa/verify` - Verify M-Pesa payment
- `POST /payments/stripe/create-customer` - Create Stripe customer
- `POST /payments/stripe/create-payment-intent` - Create payment intent
- `GET /payments/pricing` - Get pricing plans

### Server Information
- `GET /` - Server info and pricing tiers
- `GET /health` - Health check
- `GET /api/v1/status` - Detailed server status
- `GET /api/v1/pricing` - Pricing information

## Project Structure

```
arrotech-hub-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx      # Main layout with navigation
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.tsx     # Authentication hook
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Login.tsx       # Login page
│   │   ├── Register.tsx    # Registration page
│   │   ├── Connections.tsx # Connection management
│   │   ├── Payments.tsx    # Payment processing
│   │   └── Workflows.tsx   # Visual Workflows and Automation
│   ├── services/           # API services
│   │   └── api.ts         # API client and endpoints
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts       # All type interfaces
│   └── App.tsx            # Main app component
├── vite.config.ts         # Vite configuration
└── package.json
```

## Key Features

### Responsive Design
- Mobile-first responsive design
- Sidebar navigation for desktop
- Mobile-friendly navigation menu

### Real-time Updates
- Live server status monitoring
- Connection status indicators
- Payment status tracking

### Error Handling
- Comprehensive error handling
- User-friendly error messages
- Automatic token refresh

### Security
- JWT token management
- Secure API communication
- Protected route implementation

## Development

### Available Scripts

- `npm start` - Start Vite development server
- `npm run build` - Build for production using Vite
- `npm run preview` - Preview the production build locally
- `npm run analyze` - Analyze the production bundle size

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## Backend Synchronization

This frontend is fully synchronized with the Arrotech Hub backend:

### Data Models
- User model with subscription tiers
- Connection model with extensive platform support
- Payment model with M-Pesa and Stripe
- Usage tracking and billing

### API Endpoints
- All backend endpoints are implemented
- Proper error handling and validation
- Real-time status updates

### Environment Configuration
- Matches backend environment setup
- Proper CORS configuration
- Development and production modes

## Deployment

### Production Build

1. Build the application for production:
```bash
npm run build
```

This will run Vite build and output the assets to a `dist/` or `build/` directory, optimized for deployment.

### Docker Deployment

The frontend can be deployed alongside the backend using Docker Compose. See the main project README for deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Arrotech Hub Server and follows the same license terms. 