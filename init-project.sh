#!/bin/bash

# Get the project directory from the first argument
project_directory=$1

# Change to the project directory
cd "$project_directory" || exit

# File path
gitignore_file=".gitignore"

# Lines to remove
lines_to_remove=(
  '/.yarn/'
  '.yarnrc.yml'
  'yarn.lock'
)

# Check if the file exists
if [ -f "$gitignore_file" ]; then
  # Loop through lines to remove and use sed for each
  for line in "${lines_to_remove[@]}"; do
    sed -i.bak "\|$line|d" "$gitignore_file"
  done

  echo "Cleaned $gitignore_file"
else
  echo "Error: File $gitignore_file not found."
fi

rm .gitignore.bak
# Delete the existing Git repository
rm -rf .git
# Initialize a new Git repository
git init         # Initialize a new Git repository
git checkout -b master   # Create and switch to a new branch named "master"

cp .env.example .env
echo "Created .env file from example"