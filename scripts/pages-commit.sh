#!/bin/sh
# Prints the sha of a commit without parent holding what GitHub Pages serves: dist, examples, docs,
# a redirect to the examples, examples/build-info.json for their footer, and commit.txt naming the
# Bitbucket commit they were built from (the release rebuilds from it). gh-pages is an artifact branch: its history is worth nothing, it is
# pushed with -f. Built in its own index, so the checkout is left as it is.
#
# usage: pages-commit.sh <source commit> <message>
set -eu

source=$1
message=$2

dir=$(mktemp -d)
trap 'rm -rf "$dir" index.html commit.txt .nojekyll examples/build-info.json' EXIT
export GIT_INDEX_FILE="$dir/index"

echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Title</title></head><body></body><script>window.location.replace("examples/")</script></html>' > index.html
echo "$source" > commit.txt
sh scripts/build-info.sh "$source"
# Keeps GitHub Pages from running Jekyll, which would drop TypeDoc's files starting with _
echo "TypeDoc added this file to prevent GitHub Pages from using Jekyll." > .nojekyll
# -f is needed for the ignored build outputs, but must not sweep in the dependencies the tldraw and
# excalidraw examples install next to their sources: ~32k files that time GitHub Pages deployment out
git add -f dist examples docs index.html commit.txt .nojekyll \
  ':(exclude)examples/**/node_modules/**' ':(exclude)examples/**/.yarn/**' \
  ':(exclude)examples/dev-env-loader.generated.js'
git commit-tree "$(git write-tree)" -m "$message"
