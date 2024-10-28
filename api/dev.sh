#!/bin/bash
exec \
    gunicorn \
    -k uvicorn.workers.UvicornWorker \
    --workers 10 \
    --timeout 0 \
    --bind 0.0.0.0:8000 \
    --enable-stdio-inheritance \
    --access-logfile - \
    --reload \
    'tool.app:create_app()'
