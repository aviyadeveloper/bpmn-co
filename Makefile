server-run-dev:
	cd server && uv run fastapi dev ./main.py --reload

server-test:
	cd server && uv run pytest ./tests/ -v

server-test-coverage:
	cd server && uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term