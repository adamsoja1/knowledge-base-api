#!/bin/bash

alembic revision --autogenerate -m "initial" || true

alembic upgrade head

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
