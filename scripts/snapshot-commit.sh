#!/bin/sh
# Prints the sha of a commit holding the tracked files of the working tree, edits included, minus
# what stays internal (docker/, Jenkins*). Its parent is $1, or none when $1 is empty.
# It replaces `git filter-branch`: the public branch gets one commit per deployment on top of its
# own history, so it is pushed without -f.
#
# usage: snapshot-commit.sh <parent sha or ""> <message>
set -eu

parent=$1
message=$2

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT
# A separate index: the checkout's own index and working tree are left untouched
export GIT_INDEX_FILE="$dir/index"

git read-tree HEAD
# Tracked files edited in the working tree, such as the preprod version written in package.json
git add -u
git rm -r -q --cached --ignore-unmatch -- docker 'Jenkins*'
tree=$(git write-tree)

if [ -n "$parent" ]; then
  git commit-tree "$tree" -p "$parent" -m "$message"
else
  git commit-tree "$tree" -m "$message"
fi
