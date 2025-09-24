#!/usr/bin/env python3

import re

# Read the script.js file
with open('script.js', 'r') as f:
    content = f.read()

# Find the updateAuthenticationState method and add the updateDropdownState call
old_pattern = r'(\s+// Show achievements\n\s+this\.showAchievements\(\);)'
new_replacement = r'\1\n            \n            // Update dropdown badges for authenticated user\n            this.updateDropdownState();'

content = re.sub(old_pattern, new_replacement, content)

# Also add it for the guest state
old_pattern2 = r'(\s+// Hide achievements\n\s+this\.hideAchievements\(\);)'
new_replacement2 = r'\1\n            \n            // Update dropdown badges for guest user\n            this.updateDropdownState();'

content = re.sub(old_pattern2, new_replacement2, content)

# Add the new updateDropdownState method after hideAchievements
new_method = '''
    
    updateDropdownState() {
        const body = document.body;
        
        if (this.isAuthenticated) {
            // Add authenticated class to body to show all techniques as available
            body.classList.add('authenticated-user');
        } else {
            // Remove authenticated class to show locked badges
            body.classList.remove('authenticated-user');
        }
    }'''

# Find a good place to insert the new method (after hideAchievements)
pattern = r'(    hideAchievements\(\) \{\n        if \(this\.achievementIcon\) \{\n            this\.achievementIcon\.style\.display = \'none\';\n        \}\n    \})'
replacement = r'\1' + new_method

content = re.sub(pattern, replacement, content)

# Write the updated content back to the file
with open('script.js', 'w') as f:
    f.write(content)

print("Updated authentication state management successfully!")
