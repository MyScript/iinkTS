#!/bin/sh
# Writes examples/build-info.json: the iink-ts commit and version the deployed examples were built
# from, shown in the footer of examples/index.html. Generated at deploy time, never committed.
#
# usage: build-info.sh <source commit>
set -eu

commit=$1
version=$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' package.json | head -n 1)

printf '{ "commit": "%s", "version": "%s" }\n' "$commit" "$version" > examples/build-info.json
