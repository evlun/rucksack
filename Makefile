test:
	@mocha --reporter spec --ui exports test/test-all.js

lint:
	@jshint .

.PHONY: test jshint
