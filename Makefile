.PHONY: build check lint test verify

NPM ?= npm

lint:
	$(NPM) run lint
	$(NPM) run format:check

test:
	$(NPM) test

build:
	$(NPM) run build

verify: lint test build

check: verify
