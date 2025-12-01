// Example Usage Guide for ModernLoader Component

/*
=== HOW TO USE THE NEW MODERN LOADER ===

1. FULL SCREEN LOADER (for page loading):
import ModernLoader from '../Common/ModernLoader';

if (loading) {
  return (
    <ModernLoader 
      message="Loading Products..."
      subtitle="Please wait while we fetch the latest items"
    />
  );
}

2. MINI LOADER (for inline loading):
<ModernLoader 
  type="mini"
  message="Saving..."
/>

3. BUTTON LOADING STATE:
<button className={`btn ${loading ? 'vithanage-btn-loading' : ''}`}>
  {loading ? '' : 'Save Changes'}
</button>

=== EXAMPLES FOR DIFFERENT COMPONENTS ===

// Products Page:
<ModernLoader 
  message="Loading Products..."
  subtitle="Discovering amazing deals for you"
/>

// Best Sellers Page:
<ModernLoader 
  message="Loading Best Sellers..."
  subtitle="Finding our most popular items"
/>

// Cart Loading:
<ModernLoader 
  type="mini"
  message="Adding to cart..."
/>

// Form Submission:
<button className="btn-primary vithanage-btn-loading">
  Submit Order
</button>

=== FEATURES ===
✓ Animated company logo with "V"
✓ Multi-ring spinner animation  
✓ Floating particles background
✓ Typewriter effect text
✓ Progress bar animation
✓ Responsive design
✓ Unique orange/purple theme
✓ No conflicts with existing code

*/