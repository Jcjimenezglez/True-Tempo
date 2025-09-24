#!/usr/bin/env python3

import re

# Read the script.js file
with open('script.js', 'r') as f:
    content = f.read()

# Define the new selectTechnique method
new_method = '''    selectTechnique(item) {
        const technique = item.dataset.technique;
        const title = item.querySelector('.item-title').textContent;
        const requiresAccount = item.dataset.requiresAccount === 'true';
        
        // Check if technique requires account and user is not authenticated
        if (requiresAccount && !this.isAuthenticated) {
            // Close dropdown
            this.closeDropdown();
            
            // Show message asking to sign up/login
            alert(`${title} requires an account. Sign up for free to unlock all timer techniques and track your progress!`);
            
            // Don't change technique
            return;
        }
        
        // Update the button text
        this.techniqueTitle.innerHTML = `${title}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        
        // Close dropdown
        this.closeDropdown();
        
        // Here you could implement different timer configurations based on technique
        this.loadTechnique(technique);
    }'''

# Replace the old method with the new one
pattern = r'    selectTechnique\(item\) \{.*?\n    \}'
new_content = re.sub(pattern, new_method, content, flags=re.DOTALL)

# Write the updated content back to the file
with open('script.js', 'w') as f:
    f.write(new_content)

print("Updated selectTechnique method successfully!")
