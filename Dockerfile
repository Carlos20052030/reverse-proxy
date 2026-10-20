# Stage 1: Builder
FROM golang:1.27-alpine AS builder

WORKDIR /app

# Copy go.mod and download dependencies (none in this project, but good practice)
COPY go.mod ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /reverse-proxy ./cmd/proxy

# Stage 2: Runner
FROM alpine:3.20

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /reverse-proxy .
COPY config.json .

EXPOSE 8083

CMD ["./reverse-proxy"]