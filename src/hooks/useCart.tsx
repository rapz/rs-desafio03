import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function getCart() {
    return cart;
  }

  const addProduct = async (productId: number) => {
    try {
      const { data: chosenProduct } = await api.get(`products/${productId}`);
      
      if (!getCart().some(product => product.id === productId)) {
        setCart([...getCart(), { ...chosenProduct, amount: 1 }])
      } else {
        const { data: stock } = await api.get(`stock`);
        let newCart = [...getCart()];
        let productIndex = cart.findIndex(product => product.id === productId);
        if (stock.find((product: { id: number; amount: number })=>product.id===productId).amount > newCart[productIndex].amount) {
          newCart[productIndex].amount += 1;
          setCart([...newCart])
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))
  }, [cart])


  function lerCart() {
    console.log(cart)
  }

  const removeProduct = (productId: number) => {
    try {
      let newCart = [...getCart()];
      let productIndex = newCart.findIndex(product => product.id === productId);
      newCart.splice(productIndex, 1);
      setCart([...newCart])
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: chosenProduct } = await api.get(`products/${productId}`);
      let newCart = [...getCart()];
      let productIndex = newCart.findIndex(product => product.id === productId);
      const { data: stock } = await api.get(`stock`);
      let newAmount = newCart[productIndex].amount+amount
      if (stock.find((product: { id: number; amount: number })=>product.id===productId).amount >= newAmount) {
        newCart[productIndex].amount += amount;
        setCart([...newCart])
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
