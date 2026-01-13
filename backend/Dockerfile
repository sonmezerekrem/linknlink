FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/pocketbase ./main.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates wget

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/pocketbase .

# Copy migrations
COPY --from=builder /app/migrations ./migrations

# Create pb_data directory
RUN mkdir -p /app/pb_data

# Expose port
EXPOSE 8090

# Run migrations then serve
CMD sh -c "./pocketbase migrate up --dir=/app/pb_data && ./pocketbase serve --http=0.0.0.0:8090 --dir=/app/pb_data"
