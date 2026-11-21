
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

const WISHLIST_URL = '/api/accounts/wishlist/';

const getCsrfToken = () => {
  const cookie = document.cookie
    .split('; ')
    .find((item) =>
      item.startsWith('csrftoken=')
    );

  return cookie
    ? decodeURIComponent(
        cookie.substring('csrftoken='.length)
      )
    : '';
};

const ensureCsrfToken = async (signal) => {
  const response = await fetch(
    '/api/accounts/csrf/',
    {
      credentials: 'include',
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      'Unable to initialize CSRF protection.'
    );
  }

  const token = getCsrfToken();

  if (!token) {
    throw new Error(
      'CSRF token was not found.'
    );
  }

  return token;
};

export const WishlistProvider = ({ children }) => {
  const {
    isAuthenticated,
    authLoading,
    user,
  } = useAuth();

  const [wishlistItems, setWishlistItems] =
    useState([]);

  const [wishlistLoading, setWishlistLoading] =
    useState(true);

  const [wishlistError, setWishlistError] =
    useState('');

  const [pendingIds, setPendingIds] =
    useState([]);

  const pendingRef = useRef(new Set());

  // Every session change gets a new generation.
  // Old requests must not update the new session.
  const generationRef = useRef(0);

  // Track active add/remove requests.
  const requestControllersRef = useRef(
    new Set()
  );

  // Keep the latest wishlist available to callbacks.
  const wishlistItemsRef = useRef([]);

  const updateWishlistItems = useCallback(
    (updater) => {
      setWishlistItems((previous) => {
        const next =
          typeof updater === 'function'
            ? updater(previous)
            : updater;

        wishlistItemsRef.current = next;

        return next;
      });
    },
    []
  );

  // Load wishlist when the authenticated customer changes.
  useEffect(() => {
    generationRef.current += 1;

    const generation = generationRef.current;

    // Cancel pending add/remove requests.
    requestControllersRef.current.forEach(
      (controller) => controller.abort()
    );

    requestControllersRef.current.clear();

    pendingRef.current.clear();
    setPendingIds([]);

    wishlistItemsRef.current = [];
    setWishlistItems([]);
    setWishlistError('');

    if (authLoading) {
      setWishlistLoading(true);
      return;
    }

    if (!isAuthenticated) {
      setWishlistLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadWishlist = async () => {
      setWishlistLoading(true);

      try {
        const response = await fetch(
          WISHLIST_URL,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            'Unable to load your wishlist.'
          );
        }

        const data = await response.json();

        if (
          controller.signal.aborted ||
          generation !== generationRef.current
        ) {
          return;
        }

        updateWishlistItems(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          generation !== generationRef.current
        ) {
          return;
        }

        setWishlistError(
          error.message ||
            'Unable to load your wishlist.'
        );
      } finally {
        if (
          !controller.signal.aborted &&
          generation === generationRef.current
        ) {
          setWishlistLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      controller.abort();
      generationRef.current += 1;
    };
  }, [
    authLoading,
    isAuthenticated,
    user,
    updateWishlistItems,
  ]);

  const wishlistCount = wishlistItems.length;

  const isWishlisted = useCallback(
    (productId) =>
      wishlistItems.some(
        (item) =>
          String(item.product_id) ===
          String(productId)
      ),
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        return {
          success: false,
          requiresLogin: true,
        };
      }

      if (wishlistLoading) {
        return {
          success: false,
          error: 'Wishlist is still loading.',
        };
      }

      const key = String(productId);

      if (pendingRef.current.has(key)) {
        return {
          success: false,
          error: 'Please wait.',
        };
      }

      const generation = generationRef.current;

      const controller = new AbortController();

      requestControllersRef.current.add(
        controller
      );

      pendingRef.current.add(key);

      setPendingIds((previous) => [
        ...previous,
        key,
      ]);

      setWishlistError('');

      const isCurrentRequest = () =>
        !controller.signal.aborted &&
        generation === generationRef.current;

      try {
        const csrfToken =
          await ensureCsrfToken(
            controller.signal
          );

        if (!isCurrentRequest()) {
          return {
            success: false,
            cancelled: true,
          };
        }

        const alreadySaved =
          wishlistItemsRef.current.some(
            (item) =>
              String(item.product_id) === key
          );

        const response = await fetch(
          alreadySaved
            ? `${WISHLIST_URL}${productId}/`
            : WISHLIST_URL,
          {
            method: alreadySaved
              ? 'DELETE'
              : 'POST',

            credentials: 'include',

            signal: controller.signal,

            headers: {
              'X-CSRFToken': csrfToken,

              ...(!alreadySaved && {
                'Content-Type':
                  'application/json',
              }),
            },

            ...(!alreadySaved && {
              body: JSON.stringify({
                product_id: productId,
              }),
            }),
          }
        );

        if (!isCurrentRequest()) {
          return {
            success: false,
            cancelled: true,
          };
        }

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            throw new Error(
              'Please sign in again to update your wishlist.'
            );
          }

          throw new Error(
            'Unable to update your wishlist.'
          );
        }

        if (alreadySaved) {
          updateWishlistItems((previous) =>
            previous.filter(
              (item) =>
                String(item.product_id) !== key
            )
          );

          return {
            success: true,
            added: false,
          };
        }

        const savedItem =
          await response.json();

        if (!isCurrentRequest()) {
          return {
            success: false,
            cancelled: true,
          };
        }

        updateWishlistItems((previous) => {
          const exists = previous.some(
            (item) =>
              String(item.product_id) === key
          );

          return exists
            ? previous
            : [savedItem, ...previous];
        });

        return {
          success: true,
          added: true,
        };
      } catch (error) {
        if (
          error.name === 'AbortError' ||
          !isCurrentRequest()
        ) {
          return {
            success: false,
            cancelled: true,
          };
        }

        const message =
          error.message ||
          'Unable to update your wishlist.';

        setWishlistError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        requestControllersRef.current.delete(
          controller
        );

        if (generation === generationRef.current) {
          pendingRef.current.delete(key);

          setPendingIds((previous) =>
            previous.filter(
              (id) => id !== key
            )
          );
        }
      }
    },
    [
      isAuthenticated,
      wishlistLoading,
      updateWishlistItems,
    ]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistCount,
      wishlistLoading,
      wishlistError,
      pendingIds,
      isWishlisted,
      toggleWishlist,
    }),
    [
      wishlistItems,
      wishlistCount,
      wishlistLoading,
      wishlistError,
      pendingIds,
      isWishlisted,
      toggleWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider'
    );
  }

  return context;
};
