# TradeFlow LangGraph Backend Service

This is a Node.js backend service that runs the LangGraph AI agent workflow. It was created to solve React Native compatibility issues with LangGraph, which requires Node.js-specific APIs that aren't available in React Native.

## Architecture

```
React Native App → HTTP API → LangGraph Backend → Supabase Database
                              (Docker Container)
```

## Setup

### 1. Environment Variables

Create a `.env` file in this directory with:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Run with Docker (Recommended)

From the project root:

```bash
# Start just the backend service
docker-compose up langgraph-backend

# Or start all services
docker-compose up
```

### 4. Run Locally (Alternative)

```bash
cd backend
npm start
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service status and timestamp

### Plan Day
- **POST** `/api/plan-day`
- Body: `{ userId: string, jobIds: string[], planDate: string }`
- Triggers the LangGraph AI agent workflow

## Testing

### 1. Health Check

```bash
curl http://localhost:3001/health
```

### 2. Plan Day API

```bash
curl -X POST http://localhost:3001/api/plan-day \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "jobIds": ["job-1", "job-2", "job-3"],
    "planDate": "2024-01-15"
  }'
```

### 3. React Native Integration

1. Start the backend service
2. Run the React Native app
3. Tap "Plan Your Day" button in the home screen
4. Should call the backend API and show success message

## Development

- The service currently returns mock data for testing
- TODO: Integrate actual LangGraph workflow from `../agent/graph.ts`
- Real-time updates will be handled via Supabase subscriptions
- Logs show in Docker container or terminal when running locally

## Troubleshooting

### "Backend service is not available"

1. Ensure Docker is running
2. Check if port 3001 is available
3. Verify environment variables are set
4. Check Docker container logs: `docker-compose logs langgraph-backend`

### Network connectivity issues

- For iOS Simulator: Use `http://localhost:3001`
- For Android Emulator: May need `http://10.0.2.2:3001`
- For physical devices: Use your computer's IP address 