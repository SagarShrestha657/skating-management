# Skating Management Backend API

A comprehensive backend API for managing skating sessions with Nepal timezone support, built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **Session Management**: Create, read, update, and delete skating sessions
- **Nepal Timezone Support**: All times are handled in Nepal time (UTC+5:45)
- **Automatic Pricing**: Configurable pricing based on session duration
- **Analytics**: Revenue tracking and session analytics
- **Validation**: Comprehensive input validation using Joi
- **Error Handling**: Robust error handling with custom error classes
- **Rate Limiting**: API rate limiting for security
- **CORS Support**: Cross-origin resource sharing configuration

## 📋 API Endpoints

### Sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all sessions (with pagination)
- `GET /api/sessions/active` - Get active sessions
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Analytics
- `GET /api/sessions/analytics` - Get session analytics and revenue data
- `GET /api/sessions/pricing` - Get pricing configuration

### Health
- `GET /health` - Health check endpoint
- `GET /` - API information and endpoints

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `config.env` and update the values:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/skating_management
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Start MongoDB**:
   Make sure MongoDB is running on your system.

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📊 Database Schema

### UserSession Model
```typescript
{
  name: string;           // User name
  hours: number;          // Session duration (0.5-4 hours)
  price: number;          // Price per session
  quantity: number;       // Number of users
  startTime: Date;        // Session start time (Nepal time)
  endTime: Date;          // Session end time (Nepal time)
  totalAmount: number;    // Total amount (price × quantity)
  status: string;         // 'active' | 'completed' | 'cancelled'
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

## 🔧 Configuration

### Pricing Configuration
```typescript
{
  0.5: 50,   // 30 minutes - Rs. 50
  1: 100,    // 1 hour - Rs. 100
  1.5: 150,  // 1.5 hours - Rs. 150
  2: 200,    // 2 hours - Rs. 200
  2.5: 250,  // 2.5 hours - Rs. 250
  3: 300,    // 3 hours - Rs. 300
  3.5: 350,  // 3.5 hours - Rs. 350
  4: 400     // 4 hours - Rs. 400
}
```

## 📝 API Usage Examples

### Create a Session
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "hours": 2,
    "quantity": 1
  }'
```

### Get Active Sessions
```bash
curl http://localhost:5000/api/sessions/active
```

### Get Analytics
```bash
curl "http://localhost:5000/api/sessions/analytics?startDate=2024-01-01&endDate=2024-01-31"
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Comprehensive validation using Joi
- **Error Handling**: Secure error responses

## 🌍 Timezone Support

All timestamps are handled in Nepal timezone (Asia/Kathmandu, UTC+5:45) using the `moment-timezone` library.

## 📈 Monitoring

- Health check endpoint for monitoring
- Request logging with Morgan
- Error logging and tracking
- Database connection monitoring

## 🧪 Testing

The API includes comprehensive error handling and validation. All endpoints return consistent JSON responses with success/error status and appropriate HTTP status codes.

## 📚 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **express-rate-limit**: Rate limiting
- **joi**: Data validation
- **moment-timezone**: Timezone handling
- **typescript**: Type safety
- **nodemon**: Development server
