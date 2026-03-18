.PHONY: install start dev stop restart status logs clean

PORT ?= 8881
PID_FILE := .server.pid

# Install dependencies
install:
	npm install

# Start the server (foreground)
start: install
	@echo "Starting Game Arena on http://localhost:$(PORT)"
	PORT=$(PORT) node server.js

# Start in background
dev: install
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Server already running (PID $$(cat $(PID_FILE)))"; \
	else \
		PORT=$(PORT) nohup node server.js > .server.log 2>&1 & echo $$! > $(PID_FILE); \
		echo "Server started in background (PID $$(cat $(PID_FILE)))"; \
		echo "  UI:  http://localhost:$(PORT)"; \
		echo "  WS:  ws://localhost:$(PORT)"; \
		echo "  Logs: make logs"; \
	fi

# Stop background server
stop:
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null && echo "Server stopped" || echo "Server not running"; \
		rm -f $(PID_FILE); \
	else \
		echo "No PID file found"; \
	fi

# Restart background server
restart: stop dev

# Show server status
status:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Running (PID $$(cat $(PID_FILE))) on http://localhost:$(PORT)"; \
	else \
		echo "Not running"; \
		rm -f $(PID_FILE) 2>/dev/null; \
	fi

# Tail server logs
logs:
	@tail -f .server.log 2>/dev/null || echo "No logs found. Start with: make dev"

# Clean generated files
clean: stop
	rm -rf node_modules .server.log $(PID_FILE)
