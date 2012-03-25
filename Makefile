test:
	@mocha --reporter min --ui exports test/test-all.js

lint:
	@jshint .

.PHONY: test jshint
