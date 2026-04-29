set shell := ["zsh", "-eu", "-c"]

host := "127.0.0.1"
port := "9292"

alias run := dev
alias serve := dev

[default]
help:
  @just --list

dev host=host port=port:
  @echo "Serving http://{{host}}:{{port}} with uvicorn"
  @uvx --from uvicorn uvicorn dev_server:app --host {{host}} --port {{port}} --reload

check:
  @echo "Checking dev server"
  @uvx --from uvicorn python -m py_compile dev_server.py

doctor:
  @just --version
  @uvx --version
  @uvx --from uvicorn uvicorn --version
