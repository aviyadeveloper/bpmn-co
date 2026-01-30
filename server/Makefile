run-dev:
	uv run fastapi dev ./main.py --reload

test:
	uv run pytest ./tests/ -v

test-coverage:
	uv run pytest ./tests/ --cov=server --cov-report=html --cov-report=term