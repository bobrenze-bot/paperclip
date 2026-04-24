# Paperclip Makefile
# Build, test, and development tasks

.PHONY: help install dev build test test-memory test-memory-json lint typecheck clean

# Default target
help:
	@echo "Paperclip Development Tasks"
	@echo "=========================="
	@echo ""
	@echo "Setup:"
	@echo "  make install         Install dependencies"
	@echo "  make dev             Start development server"
	@echo ""
	@echo "Testing:"
	@echo "  make test            Run all tests"
	@echo "  make test-memory     Run memory regression tests"
	@echo "  make test-memory-json  Run memory tests with JSON output"
	@echo ""
	@echo "Quality:"
	@echo "  make lint            Run linter"
	@echo "  make typecheck       Run TypeScript type checker"
	@echo ""
	@echo "Build:"
	@echo "  make build           Build production bundle"
	@echo "  make clean           Clean build artifacts"

# Development
install:
	pnpm install

dev:
	pnpm dev

# Testing
test:
	pnpm test

test-memory:
	@echo "Running memory regression tests..."
	@bash ../tests/memory-regression/run-all.sh

test-memory-json:
	@echo "Running memory regression tests (JSON output)..."
	@bash ../tests/memory-regression/run-all.sh --json

# Quality assurance
lint:
	pnpm lint

typecheck:
	pnpm -r typecheck

# Build
build:
	pnpm build

clean:
	rm -rf dist/
	rm -rf node_modules/.cache/
