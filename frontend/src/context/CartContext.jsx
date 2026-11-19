
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'jl_fashions_cart';

const loadCart = () => {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
  const amount = Math.max(1, Math.floor(Number(quantity) || 1));
  const variantId = product.variantId;
  const stock = Number(product.stock);

  if (variantId == null || !Number.isFinite(stock) || stock <= 0) {
    return;
  }

  setCartItems((previousItems) => {
    const existingItem = previousItems.find(
      (item) => String(item.variantId) === String(variantId)
    );

    if (existingItem) {
      return previousItems.map((item) =>
        String(item.variantId) === String(variantId)
          ? {
              ...item,
              ...product,
              quantity: Math.min(item.quantity + amount, stock),
            }
          : item
      );
    }

    return [
      ...previousItems,
      {
        ...product,
        quantity: Math.min(amount, stock),
      },
    ];
  });
};
  const removeFromCart = (variantId) => {
    setCartItems((previousItems) =>
      previousItems.filter(
        (item) => String(item.variantId) !== String(variantId)
      )
    );
  };

const updateQuantity = (variantId, quantity) => {
  const amount = Math.floor(Number(quantity));

  if (!Number.isFinite(amount)) return;

  if (amount <= 0) {
    removeFromCart(variantId);
    return;
  }

  setCartItems((previousItems) =>
    previousItems.map((item) => {
      if (String(item.variantId) !== String(variantId)) {
        return item;
      }

      const stock = Number(item.stock);

      if (!Number.isFinite(stock) || stock <= 0) {
        return item;
      }

      return {
        ...item,
        quantity: Math.min(amount, stock),
      };
    })
  );
};

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(
    () => cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * item.quantity,
      0
    ),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
};
