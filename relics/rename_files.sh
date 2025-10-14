#!/bin/bash

# A simple script to rename PNG files by removing a specific string.

# The string to be removed from the filenames
TARGET_STRING="-relic-elden-ring-nightreign-wiki-guide"

# Loop through all files ending with .png in the current directory
for file in *.png; do
  # Check if the file exists and its name contains the target string
  if [[ -f "$file" && "$file" == *"$TARGET_STRING"* ]]; then
    # Create the new filename by removing the target string
    # The ${variable//pattern/replacement} syntax replaces all occurrences of the pattern.
    new_name="${file//$TARGET_STRING/}"

    # Rename the file, using "mv -v" for verbose output
    mv -v "$file" "$new_name"
  fi
done

echo "Renaming process complete."
