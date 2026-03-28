set shell := ["zsh", "-eu", "-c"]

alias serve := run
alias serve-uvx := run-uvx

[default]
help:
  @just --list

open:
  @open index.html

run host="127.0.0.1" port="9292":
  @echo "Serving http://{{host}}:{{port}} with python3"
  @python3 -m http.server {{port}} --bind {{host}}

run-uvx host="127.0.0.1" port="9292":
  @echo "Serving http://{{host}}:{{port}} with uvx"
  @uvx python -m http.server {{port}} --bind {{host}}

check:
  @echo "Checking browser scripts with Node"
  @rg --files -g '*.js' js | while IFS= read -r file; do \
    node --check "$file"; \
  done

dev: check
  @echo "Serving http://127.0.0.1:9292 with python3"
  @python3 -m http.server 9292 --bind 127.0.0.1

doctor:
  @just --version
  @uvx --version
  @python3 --version
  @node --version

tree:
  @find . -maxdepth 2 -type f | sort
