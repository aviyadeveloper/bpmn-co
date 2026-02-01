run-dev:
	uv run uvicorn server.main:app --reload --host 127.0.0.1 --port 8000

test:
	uv run pytest ./tests/ -v

test-coverage:
	uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term