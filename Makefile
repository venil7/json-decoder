build:
	npm run build
	npm run test

publish:
	npm run clean
	npm run build
	npm run test
	npm publish