import React, { useState, useEffect, useRef } from 'react';
import './Products.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faFilter, faStar, faShoppingCart, 
  faChevronDown, faChevronUp, faTimes, faSort,
  faThLarge, faList, faHeart, faSync, faArrowUp
} from '@fortawesome/free-solid-svg-icons';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sortOption, setSortOption] = useState('featured');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  
  // UI states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Refs
  const productListRef = useRef(null);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Check for auth token and user data
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log("Products: No auth token - redirecting to login");
        window.location.href = '/login';
        return false;
      }
      
      try {
        const userData = JSON.parse(userStr);
        if (!userData || !userData.id) {
          console.log("Products: Invalid user data");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          return false;
        }
        
        console.log("Products: User authenticated:", userData.name);
        setUser(userData);
        
        // Load saved cart from localStorage if available
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {
            console.error("Error loading saved cart:", e);
          }
        }
        
        // Load saved wishlist from localStorage if available
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          try {
            setWishlist(JSON.parse(savedWishlist));
          } catch (e) {
            console.error("Error loading saved wishlist:", e);
          }
        }
        
        return true;
      } catch (err) {
        console.error("Products: Error parsing user data:", err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
    };
    
    // If authenticated, fetch products
    if (checkAuth()) {
      fetchProducts();
    }
    
    // Add scroll event listener for back-to-top button
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Handle scroll for back-to-top button
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log("Fetching products with token:", !!token);
      
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      let data = await response.json();
      
      // If no products in database or very few, add sample products for demo
      if (data.length < 5) {
        console.log("Adding sample products for demonstration");
        
        // Sample product categories for an Abans-like electronics store
        const sampleCategories = [
          'Televisions', 
          'Refrigerators', 
          'Washing Machines', 
          'Air Conditioners',
          'Kitchen Appliances',
          'Small Appliances',
          'Laptops',
          'Smartphones',
          'Audio & Video',
          'Irons',
          'Speakers',
          'Home Theater',
          'Vacuum Cleaners',
          'Fans & Air Coolers',
          'Water Heaters',
          'Microwave Ovens',
          'Rice Cookers',
          'Blenders & Mixers'
        ];
        
        // Popular electronics brands
        const sampleBrands = [
          'Samsung', 
          'LG', 
          'Sony', 
          'Panasonic', 
          'Philips',
          'Apple',
          'Dell',
          'HP',
          'Lenovo',
          'JBL',
          'Bose',
          'Acer',
          'Asus',
          'Bosch',
          'Whirlpool',
          'Electrolux',
          'Hitachi',
          'Huawei',
          'Xiaomi'
        ];
        
        // Sample product data
        const sampleProducts = [
          // Televisions
          {
            _id: 'tv001',
            name: 'Samsung 55" QLED 4K Smart TV',
            category: 'Televisions',
            brand: 'Samsung',
            description: 'Experience stunning 4K resolution with Quantum Dot technology for vibrant colors and deep blacks.',
            price: 899.99,
            oldPrice: 1099.99,
            discount: 18,
            stock: 15,
            rating: 4.7,
            numReviews: 128,
            imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'tv002',
            name: 'LG 65" OLED Smart TV',
            category: 'Televisions',
            brand: 'LG',
            description: 'Self-lit pixels create perfect blacks and infinite contrast for an immersive viewing experience.',
            price: 1299.99,
            oldPrice: 1499.99,
            discount: 13,
            stock: 8,
            rating: 4.9,
            numReviews: 92,
            imageUrl: 'https://images.unsplash.com/photo-1601944177325-f8867652837f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'tv003',
            name: 'Sony 50" 4K Ultra HD Smart TV',
            category: 'Televisions',
            brand: 'Sony',
            description: 'Lifelike picture quality with 4K X-Reality PRO and Motionflow XR technology.',
            price: 699.99,
            oldPrice: 799.99,
            discount: 12,
            stock: 20,
            rating: 4.5,
            numReviews: 76,
            imageUrl: 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Refrigerators
          {
            _id: 'ref001',
            name: 'Samsung Family Hub French Door Refrigerator',
            category: 'Refrigerators',
            brand: 'Samsung',
            description: 'Smart refrigerator with built-in touchscreen and cameras to see inside from anywhere.',
            price: 2799.99,
            oldPrice: 3299.99,
            discount: 15,
            stock: 5,
            rating: 4.6,
            numReviews: 42,
            imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'ref002',
            name: 'LG InstaView Door-in-Door Refrigerator',
            category: 'Refrigerators',
            brand: 'LG',
            description: 'Knock twice to see inside without opening the door, saving energy and keeping food cold.',
            price: 1999.99,
            oldPrice: 2199.99,
            discount: 9,
            stock: 12,
            rating: 4.7,
            numReviews: 63,
            imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Washing Machines
          {
            _id: 'wm001',
            name: 'Samsung 5.2 cu. ft. Front Load Washer',
            category: 'Washing Machines',
            brand: 'Samsung',
            description: 'Large capacity washer with Steam Wash technology to remove stains without pre-treatment.',
            price: 799.99,
            oldPrice: 999.99,
            discount: 20,
            stock: 10,
            rating: 4.4,
            numReviews: 87,
            imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1a6f4708?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            _id: 'wm002',
            name: 'LG Smart Wi-Fi Enabled Top Load Washer',
            category: 'Washing Machines',
            brand: 'LG',
            description: 'Control your washer from anywhere and receive notifications when your laundry is done.',
            price: 899.99,
            stock: 7,
            rating: 4.3,
            numReviews: 54,
            imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1a6f4708?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Air Conditioners
          {
            _id: 'ac001',
            name: 'LG 12,000 BTU DUAL Inverter Smart Window Air Conditioner',
            category: 'Air Conditioners',
            brand: 'LG',
            description: 'Energy efficient air conditioner with voice control compatibility and low noise operation.',
            price: 449.99,
            oldPrice: 529.99,
            discount: 15,
            stock: 25,
            rating: 4.5,
            numReviews: 118,
            imageUrl: 'https://images.unsplash.com/photo-1586883573447-3775dfd3a93e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            _id: 'ac002',
            name: 'Samsung WindFree™ Wall-Mounted Air Conditioner',
            category: 'Air Conditioners',
            brand: 'Samsung',
            description: 'Innovative cooling without direct air flow for maximum comfort and energy efficiency.',
            price: 799.99,
            oldPrice: 899.99,
            discount: 11,
            stock: 15,
            rating: 4.8,
            numReviews: 47,
            imageUrl: 'https://images.unsplash.com/photo-1586883573447-3775dfd3a93e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          
          // Laptops
          {
            _id: 'lap001',
            name: 'Dell XPS 13 Laptop',
            category: 'Laptops',
            brand: 'Dell',
            description: 'Ultra-thin and light laptop with InfinityEdge display and long battery life.',
            price: 1299.99,
            oldPrice: 1499.99,
            discount: 13,
            stock: 8,
            rating: 4.7,
            numReviews: 156,
            imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'lap002',
            name: 'HP Spectre x360 Convertible Laptop',
            category: 'Laptops',
            brand: 'HP',
            description: '2-in-1 convertible laptop with 4K OLED display and Intel Core i7 processor.',
            price: 1399.99,
            stock: 6,
            rating: 4.6,
            numReviews: 89,
            imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            _id: 'lap003',
            name: 'Lenovo ThinkPad X1 Carbon',
            category: 'Laptops',
            brand: 'Lenovo',
            description: 'Legendary business laptop with robust security features and exceptional durability.',
            price: 1599.99,
            oldPrice: 1799.99,
            discount: 11,
            stock: 9,
            rating: 4.8,
            numReviews: 112,
            imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Smartphones
          {
            _id: 'phone001',
            name: 'Samsung Galaxy S22 Ultra',
            category: 'Smartphones',
            brand: 'Samsung',
            description: 'Premium smartphone with S Pen support, 108MP camera and 6.8" Dynamic AMOLED display.',
            price: 1199.99,
            oldPrice: 1299.99,
            discount: 8,
            stock: 20,
            rating: 4.9,
            numReviews: 238,
            imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'phone002',
            name: 'Apple iPhone 14 Pro',
            category: 'Smartphones',
            brand: 'Apple',
            description: 'Advanced smartphone with A16 Bionic chip, Dynamic Island, and professional camera system.',
            price: 999.99,
            stock: 15,
            rating: 4.8,
            numReviews: 312,
            imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          
          // Irons
          {
            _id: 'iron001',
            name: 'Philips Azur Steam Iron',
            category: 'Irons',
            brand: 'Philips',
            description: 'Steam iron with SteamGlide soleplate for effortless gliding and quick wrinkle removal.',
            price: 49.99,
            oldPrice: 69.99,
            discount: 29,
            stock: 35,
            rating: 4.5,
            numReviews: 208,
            imageUrl: 'https://images.unsplash.com/photo-1585828068970-e565503b1fc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            _id: 'iron002',
            name: 'Panasonic Dry and Steam Iron',
            category: 'Irons',
            brand: 'Panasonic',
            description: 'Versatile iron with multi-directional ceramic soleplate and vertical steaming capability.',
            price: 39.99,
            stock: 40,
            rating: 4.3,
            numReviews: 176,
            imageUrl: 'https://images.unsplash.com/photo-1585828068970-e565503b1fc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Speakers
          {
            _id: 'speaker001',
            name: 'JBL Charge 5 Portable Bluetooth Speaker',
            category: 'Speakers',
            brand: 'JBL',
            description: 'Waterproof portable speaker with powerful sound and 20 hours of playtime.',
            price: 179.99,
            oldPrice: 199.99,
            discount: 10,
            stock: 25,
            rating: 4.7,
            numReviews: 342,
            imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          {
            _id: 'speaker002',
            name: 'Bose SoundLink Revolve+ II',
            category: 'Speakers',
            brand: 'Bose',
            description: 'Portable 360° Bluetooth speaker with deep, loud sound and long-lasting battery.',
            price: 299.99,
            stock: 18,
            rating: 4.8,
            numReviews: 254,
            imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            _id: 'speaker003',
            name: 'Sony SRS-XB43 EXTRA BASS Wireless Speaker',
            category: 'Speakers',
            brand: 'Sony',
            description: 'Powerful speaker with deep, punchy bass and multi-colored line light for party atmosphere.',
            price: 169.99,
            oldPrice: 249.99,
            discount: 32,
            stock: 12,
            rating: 4.6,
            numReviews: 198,
            imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Home Theater
          {
            _id: 'ht001',
            name: 'Sony HT-G700 3.1ch Soundbar with Dolby Atmos',
            category: 'Home Theater',
            brand: 'Sony',
            description: 'Soundbar with wireless subwoofer for immersive 3D surround sound experience.',
            price: 599.99,
            oldPrice: 699.99,
            discount: 14,
            stock: 10,
            rating: 4.5,
            numReviews: 123,
            imageUrl: 'https://images.unsplash.com/photo-1626153651036-66a84afd2a11?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Kitchen Appliances
          {
            _id: 'kitchen001',
            name: 'Bosch Series 8 Built-in Oven',
            category: 'Kitchen Appliances',
            brand: 'Bosch',
            description: 'Premium oven with pyrolytic self-cleaning and PerfectBake sensor for perfect results.',
            price: 1399.99,
            oldPrice: 1599.99,
            discount: 12,
            stock: 7,
            rating: 4.8,
            numReviews: 67,
            imageUrl: 'https://images.unsplash.com/photo-1585039261108-ec659fff0dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          },
          
          // Microwave Ovens
          {
            _id: 'micro001',
            name: 'Panasonic Microwave Oven with Inverter Technology',
            category: 'Microwave Ovens',
            brand: 'Panasonic',
            description: 'Delivers microwave energy in a way that allows delicate foods to simmer without overcooking.',
            price: 199.99,
            oldPrice: 249.99,
            discount: 20,
            stock: 15,
            rating: 4.6,
            numReviews: 189,
            imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb3ed5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Rice Cookers
          {
            _id: 'rice001',
            name: 'Zojirushi Micom Rice Cooker & Warmer',
            category: 'Rice Cookers',
            brand: 'Zojirushi',
            description: 'Advanced rice cooker with multiple cooking functions and keep warm feature.',
            price: 149.99,
            stock: 22,
            rating: 4.9,
            numReviews: 212,
            imageUrl: 'https://images.unsplash.com/photo-1621274147744-cfb5862a18ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          
          // Vacuum Cleaners
          {
            _id: 'vac001',
            name: 'Dyson V11 Absolute Cordless Vacuum',
            category: 'Vacuum Cleaners',
            brand: 'Dyson',
            description: 'Powerful cordless vacuum with intelligent cleaning modes and up to 60 minutes of run time.',
            price: 599.99,
            oldPrice: 699.99,
            discount: 14,
            stock: 9,
            rating: 4.8,
            numReviews: 256,
            imageUrl: 'https://images.unsplash.com/photo-1575709002049-38e9a17c99e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            featured: true
          }
        ];
        
        // Add sample products to the existing data
        data = [...data, ...sampleProducts];
        console.log(`Added ${sampleProducts.length} sample products`);
      }
      
      console.log(`Products fetched successfully: ${data.length} items`);
      setProducts(data);
      setFilteredProducts(data);
      
      // Extract unique categories and brands
      const uniqueCategories = [...new Set(data.map(product => product.category))];
      const uniqueBrands = [...new Set(data.map(product => product.brand))];
      
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
      
      // Find max price for range filter
      const maxProductPrice = Math.max(...data.map(product => product.price), 1000);
      setPriceRange({ min: 0, max: Math.ceil(maxProductPrice / 100) * 100 });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to load products: ${error.message}`);
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    const existingProduct = cart.find(item => item._id === product._id);
    
    let updatedCart;
    if (existingProduct) {
      updatedCart = cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }
    
    // Update state and save to localStorage
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Show confirmation
    alert(`${product.name} added to cart!`);
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item._id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item._id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };
  
  // Add/remove product from wishlist
  const toggleWishlist = (product) => {
    let updatedWishlist;
    if (wishlist.some(item => item._id === product._id)) {
      updatedWishlist = wishlist.filter(item => item._id !== product._id);
    } else {
      updatedWishlist = [...wishlist, product];
    }
    
    setWishlist(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };
  
  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };
  
  // Calculate cart item count
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Checkout function
  const checkout = () => {
    alert(`Order placed successfully! Total: $${calculateTotal()}`);
    setCart([]);
    localStorage.removeItem('cart');
  };
  
  // Apply filters to products
  useEffect(() => {
    if (!products.length) return;
    
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(search) || 
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter(product => selectedCategories.includes(product.category));
    }
    
    // Apply brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(product => selectedBrands.includes(product.brand));
    }
    
    // Apply price range filter
    result = result.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    );
    
    // Apply sorting
    switch(sortOption) {
      case 'price-low-high':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-a-z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-z-a':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating-high-low':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategories, selectedBrands, priceRange, sortOption]);
  
  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Toggle brand selection
  const toggleBrand = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: Math.max(...products.map(product => product.price), 1000) });
    setSortOption('featured');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">
          <FontAwesomeIcon icon={faSync} spin size="3x" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error">
          <FontAwesomeIcon icon={faTimes} /> {error}
        </div>
        <button onClick={fetchProducts} className="retry-btn">
          <FontAwesomeIcon icon={faSync} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="welcome-banner">
        <h1>Welcome to Vithanage Enterprises</h1>
        <p>Premium Electrical Appliances for Your Home</p>
        <div className="user-greeting">
          Hello, {user ? user.name : 'Guest'}! 
          <span className="cart-count" onClick={() => setShowCartModal(true)}>
            <FontAwesomeIcon icon={faShoppingCart} /> {getCartItemCount()} items
          </span>
          <span className="wishlist-count">
            <FontAwesomeIcon icon={faHeart} /> {wishlist.length} items
          </span>
        </div>
      </div>
      
      {/* Featured Products Carousel */}
      <div className="featured-products">
        <h2>Featured Products</h2>
        <div className="featured-products-grid">
          {products.filter(product => product.featured).slice(0, 4).map(product => (
            <div className="featured-product" key={`featured-${product._id}`}>
              <div className="featured-product-image">
                <img src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} />
                {product.discount > 0 && (
                  <div className="discount-badge">-{product.discount}%</div>
                )}
              </div>
              <div className="featured-product-info">
                <h3>{product.name}</h3>
                <div className="featured-product-price">
                  {product.oldPrice && (
                    <span className="old-price">${product.oldPrice.toFixed(2)}</span>
                  )}
                  <span className="current-price">${product.price.toFixed(2)}</span>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Categories Showcase */}
      <div className="categories-showcase">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {categories.slice(0, 6).map(category => (
            <div 
              className="category-card" 
              key={category}
              onClick={() => {
                setSelectedCategories([category]);
                document.querySelector('.products-main-content').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="category-name">{category}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="products-layout">
        {/* Filters sidebar */}
        <div className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="filters-header">
            <h2>
              <FontAwesomeIcon icon={faFilter} /> Filters
            </h2>
            <button 
              className="toggle-filters-btn mobile-only"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          {/* Search filter */}
          <div className="filter-section">
            <h3>Search Products</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button>
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
          
          {/* Categories filter */}
          <div className="filter-section">
            <h3>Categories</h3>
            <div className="filter-options">
              {categories.map(category => (
                <div key={category} className="filter-option">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <label htmlFor={`category-${category}`}>{category}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Brands filter */}
          <div className="filter-section">
            <h3>Brands</h3>
            <div className="filter-options">
              {brands.map(brand => (
                <div key={brand} className="filter-option">
                  <input
                    type="checkbox"
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  <label htmlFor={`brand-${brand}`}>{brand}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Price range filter */}
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-slider">
              <div className="price-range-display">
                <span>${priceRange.min}</span>
                <span>${priceRange.max}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(...products.map(p => p.price), 1000)}
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                className="price-range-slider"
              />
            </div>
          </div>
          
          {/* Filter actions */}
          <div className="filter-actions">
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="products-main-content">
          <div className="products-controls">
            <div className="mobile-controls">
              <button 
                className="toggle-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FontAwesomeIcon icon={faFilter} /> Filters
              </button>
            </div>
            
            <div className="view-controls">
              <div className="products-count">
                {filteredProducts.length} Products
              </div>
              
              <div className="sort-control">
                <label htmlFor="sort-select">
                  <FontAwesomeIcon icon={faSort} /> Sort:
                </label>
                <select 
                  id="sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                  <option value="name-z-a">Name: Z to A</option>
                  <option value="rating-high-low">Top Rated</option>
                </select>
              </div>
              
              <div className="display-options">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <FontAwesomeIcon icon={faThLarge} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Product display area */}
          <div className={`products-display ${viewMode}`}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div className="product-card" key={product._id}>
                  <div className="product-image">
                    <img src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} />
                    <button 
                      className={`wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product)}
                      title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                    {product.discount > 0 && (
                      <div className="discount-badge">-{product.discount}%</div>
                    )}
                    {product.stock < 5 && product.stock > 0 && (
                      <div className="stock-badge">Only {product.stock} left!</div>
                    )}
                    {product.stock === 0 && (
                      <div className="out-of-stock-badge">Out of Stock</div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <div className="product-category">{product.category}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-brand">{product.brand}</div>
                    
                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon 
                          key={i}
                          icon={faStar}
                          className={i < Math.round(product.rating || 0) ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                      <span className="rating-count">({product.numReviews || 0})</span>
                    </div>
                    
                    <div className="product-price">
                      {product.oldPrice && (
                        <span className="old-price">${product.oldPrice.toFixed(2)}</span>
                      )}
                      <span className="current-price">${product.price.toFixed(2)}</span>
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="product-description">{product.description}</div>
                    )}
                    
                    <div className="product-stock-info">
                      <span className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {product.stock > 0 && <span className="stock-count">({product.stock} available)</span>}
                    </div>
                    
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product)}
                      disabled={product.stock < 1}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <FontAwesomeIcon icon={faTimes} className="no-results-icon" />
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cart Modal */}
      {showCartModal && (
        <div className="cart-modal">
          <div className="cart-modal-content">
            <div className="cart-modal-header">
              <h2>
                <FontAwesomeIcon icon={faShoppingCart} /> Your Cart
              </h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCartModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div className="cart-item" key={item._id}>
                      <div className="cart-item-image">
                        <img src={item.imageUrl || 'https://via.placeholder.com/50x50?text=No+Image'} alt={item.name} />
                      </div>
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-price">${item.price.toFixed(2)} each</div>
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                        </div>
                        <div className="cart-item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item._id)}
                          title="Remove from Cart"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-summary">
                  <div className="cart-subtotal">
                    <span>Subtotal:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="cart-shipping">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="cart-total">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <button 
                    className="checkout-btn"
                    onClick={checkout}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <FontAwesomeIcon icon={faShoppingCart} className="empty-cart-icon" />
                <p>Your cart is empty</p>
                <p>Browse our products and add items to your cart</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Back to top button */}
      {showBackToTop && (
        <button 
          className="back-to-top-btn"
          onClick={scrollToTop}
          title="Back to Top"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}
    </div>
  );
};

export default Products;
