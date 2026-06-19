.PHONY: build check lint test verify

NPM ?= npm
override ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

lint:
	cd $(ROOT) && $(NPM) run lint
	cd $(ROOT) && $(NPM) run format:check

test:
	cd $(ROOT) && $(NPM) test

build:
	cd $(ROOT) && $(NPM) run build

verify: lint test build

check: verify
	sh $(ROOT)scripts/check-baseline.sh
