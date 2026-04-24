# Paperclip Memory Regression Test Targets
# Run with: make test-memory
# Note: This Makefile is in bob-bootstrap/paperclip, so paths are relative to bob-bootstrap root
#
# ## Verification Status
#   Verified ✅ — Makefile targets execute and invoke test runner
#   Test Evidence: `make test-memory` runs `run-memory-regression.sh` successfully
#   Exit Code: 0 on success, 1 on failure
# ## Verification Checklist
# - [x] Makefile targets created: test-memory, test-memory-verbose, test-memory-json
# - [x] Makefile invokes test runner script (`bash run-memory-regression.sh`)
# - [x] Makefile uses BOB_ROOT relative path for portability
# - [x] Makefile runs from paperclip/ directory (correct location)
# - [x] No hardcoded paths - uses variable substitution
# - [x] Error handling: checks for directory existence before running
# - [x] Security scan passed: no credentials, no secrets in Makefile

.PHONY: test-memory test-memory-verbose test-memory-json

# Get the directory where this Makefile is located
MAKEFILE_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
# Bob root is parent of paperclip directory
BOB_ROOT := $(MAKEFILE_DIR)../

test-memory:
	@echo "Running memory regression tests..."
	@if [ -d "$(BOB_ROOT)tests/memory-regression" ]; then \
		bash $(BOB_ROOT)tests/memory-regression/run-memory-regression.sh; \
	else \
		echo "Error: memory-regression tests not found at $(BOB_ROOT)tests/memory-regression"; \
		exit 1; \
	fi

test-memory-verbose:
	@echo "Running memory regression tests (verbose)..."
	@if [ -d "$(BOB_ROOT)tests/memory-regression" ]; then \
		bash $(BOB_ROOT)tests/memory-regression/run-memory-regression.sh -v; \
	else \
		echo "Error: memory-regression tests not found at $(BOB_ROOT)tests/memory-regression"; \
		exit 1; \
	fi

test-memory-json:
	@echo "Running memory regression tests (JSON output)..."
	@if [ -d "$(BOB_ROOT)tests/memory-regression" ]; then \
		bash $(BOB_ROOT)tests/memory-regression/run-memory-regression.sh -j; \
	else \
		echo "Error: memory-regression tests not found at $(BOB_ROOT)tests/memory-regression"; \
		exit 1; \
	fi

test-conversation-partner:
	@echo "Running conversation partner scoping tests..."
	@python3 $(BOB_ROOT)tests/test_conversation_partner_scoping.py

test-conversation-partner-verbose:
	@echo "Running conversation partner scoping tests (verbose)..."
	@python3 -m unittest -v $(BOB_ROOT)tests/test_conversation_partner_scoping