#!/bin/bash

# Get the project directory from the first argument
project_directory=$1

# Change to the project directory
cd "$project_directory" || exit

# JSON file path
json_file="package.json"

# Key to remove
key_to_remove="packageManager"

# Check if the key is present in the JSON file
if grep -q "\"${key_to_remove}\":" "$json_file"; then
    # Remove the key and its associated value using sed
    sed -i.bak "/\"${key_to_remove}\":/d" "$json_file"
    rm "${json_file}.bak"
fi

# Run yarn set version berry
yarn set version berry

# File path
file=".yarnrc.yml"

# create file if not exists
if [ ! -f "$file" ]; then
    touch "$file"
fi

# Line to append
line="nodeLinker: node-modules"
line2="enableGlobalCache: false"

# Check if the file exists
if [ -f "$file" ]; then
    # Append the line to the file
    echo "$line" >> "$file"
    echo "$line2" >> "$file"
else
    echo "Error: File $file not found."
fi
echo "Set yarn version berry"
