# Stage 1: Build the React Frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
# Install dependencies first (cache layer)
COPY frontend/package*.json ./
RUN npm install
# Copy the rest of the frontend code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Go Backend
FROM golang:1.27-alpine AS go-builder
WORKDIR /app
# Download Go modules
COPY go.mod go.sum ./
RUN go mod download
# Copy the rest of the backend code
COPY . .
# Build the static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /proxy ./cmd/proxy

# Stage 3: Final Minimal Image
FROM alpine:3.20
WORKDIR /app

# Install CA certificates for HTTPS and timezone data
RUN apk add --no-cache ca-certificates tzdata

# Copy the compiled Go binary from Stage 2
COPY --from=go-builder /proxy .

# Copy the built frontend static files from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Run the application
CMD ["./proxy"]