import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const CartItem = ({ item, updateQuantity, removeItem }) => {
  return (
    <div className="cart-item">
      <div className="cart-item-product">
        <div className="cart-item-image">
          <img 
            src={item.product.imageUrl || 'https://via.placeholder.com/80?text=Product'} 
            alt={item.product.name} 
          />
        </div>
        <div className="cart-item-details">
          <h3>{item.product.name}</h3>
          <p className="cart-item-category">{item.product.category}</p>
          <p className="cart-item-brand">Brand: {item.product.brand}</p>
        </div>
      </div>
      <div className="cart-item-price">${item.product.price.toFixed(2)}</div>
      <div className="cart-item-quantity">
        <button 
          className="quantity-btn" 
          onClick={() => item.quantity > 1 && updateQuantity(item.product._id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span className="quantity-value">{item.quantity}</span>
        <button 
          className="quantity-btn"
          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <div className="cart-item-total">
        ${(item.product.price * item.quantity).toFixed(2)}
      </div>
      <div className="cart-item-action">
        <button 
          className="remove-btn"
          onClick={() => removeItem(item.product._id)}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
