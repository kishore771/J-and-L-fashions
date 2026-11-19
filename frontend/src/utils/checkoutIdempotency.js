
const STORAGE_KEY = 'jl_checkout_attempt';

export const getCheckoutAttempt = (payload) => {
  const fingerprint = JSON.stringify({
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    apartment: payload.apartment,
    city: payload.city,
    state: payload.state,
    pincode: payload.pincode,
    items: [...payload.items].sort(
      (a, b) => a.variant_id - b.variant_id
    ),
  });

  try {
    const saved = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || 'null'
    );

    if (saved?.fingerprint === fingerprint && saved?.key) {
      return saved.key;
    }
  } catch {
    // Invalid stored data: start a fresh checkout attempt.
  }

  const key = crypto.randomUUID();

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ key, fingerprint })
  );

  return key;
};

export const clearCheckoutAttempt = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('jl_checkout_key');
};
