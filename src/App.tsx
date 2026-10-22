/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartItem, CurrentUser, Manufacturer, Order, ProductBox, Retailer } from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { RetailerCatalogView } from './components/RetailerCatalogView';
import { ManufacturerProfileView } from './components/ManufacturerProfileView';
import { ManufacturerDashboard } from './components/ManufacturerDashboard';
import { RetailerDashboard } from './components/RetailerDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { CartAndCheckoutDrawer } from './components/CartAndCheckoutDrawer';

import { testConnection } from './services/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => storageService.getCurrentUser());
  const [products, setProducts] = useState<ProductBox[]>(() => storageService.getProducts());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'retailer' | 'manufacturer' | 'admin'>('retailer');
  const [activeView, setActiveView] = useState<string>('landing');
  const [selectedProduct, setSelectedProduct] = useState<ProductBox | null>(null);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);

  // Sync storage events & boot test Firestore connection
  useEffect(() => {
    testConnection();

    const handleStorageUpdate = () => {
      setProducts(storageService.getProducts());
      setCurrentUser(storageService.getCurrentUser());
    };

    window.addEventListener('serron_storage_update', handleStorageUpdate);
    window.addEventListener('serron_auth_update', handleStorageUpdate);

    return () => {
      window.removeEventListener('serron_storage_update', handleStorageUpdate);
      window.removeEventListener('serron_auth_update', handleStorageUpdate);
    };
  }, []);

  const handleOpenAuth = (role: 'retailer' | 'manufacturer' | 'admin' = 'retailer') => {
    setAuthRole(role);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin');
    } else if (user.role === 'manufacturer') {
      setActiveView('manufacturer');
    } else {
      setActiveView('retailer');
    }
  };

  const handleLogout = async () => {
    await storageService.logoutUserAsync();
    setCurrentUser(null);
    setActiveView('landing');
  };

  // Cart operations with Color Support
  const handleAddToCart = (
    product: ProductBox,
    boxQuantity: number,
    selectedColor?: string,
    selectedColorHex?: string,
    selectedColorPhoto?: string
  ) => {
    setCartItems(prev => {
      const existing = prev.find(
        item => item.product.id === product.id && item.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedColor === selectedColor
            ? { ...item, boxQuantity: item.boxQuantity + boxQuantity }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          boxQuantity,
          selectedColor,
          selectedColorHex,
          selectedColorPhoto: selectedColorPhoto || product.photos?.[0],
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, selectedColor?: string) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, selectedColor);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId && item.selectedColor === selectedColor
          ? { ...item, boxQuantity: quantity }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, selectedColor?: string) => {
    setCartItems(prev =>
      prev.filter(
        item => !(item.product.id === productId && item.selectedColor === selectedColor)
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Product & Manufacturer navigation
  const handleSelectProduct = (product: ProductBox) => {
    setSelectedProduct(product);
    setSelectedManufacturerId(product.manufacturerId);
    setActiveView('manufacturer-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewManufacturer = (manufacturerId: string) => {
    setSelectedManufacturerId(manufacturerId);
    const mfgProducts = storageService.getProducts().filter(p => p.manufacturerId === manufacturerId);
    setSelectedProduct(mfgProducts[0] || null);
    setActiveView('manufacturer-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Database actions
  const handleSeedDemo = () => {
    storageService.seedSampleData();
    setProducts(storageService.getProducts());
  };

  const handleClearDb = () => {
    if (confirm('Deseja limpar todo o banco de dados? Todos os cadastros e pedidos serão reiniciados.')) {
      storageService.clearDatabase();
      setProducts([]);
      setCurrentUser(null);
      setCartItems([]);
      setActiveView('landing');
    }
  };

  // Selected Manufacturer details for profile view
  const currentSelectedManufacturer: Manufacturer | null = selectedManufacturerId
    ? storageService.getManufacturerById(selectedManufacturerId) || (selectedProduct ? {
        id: selectedManufacturerId,
        role: 'manufacturer',
        brandName: selectedProduct.manufacturerName,
        legalName: selectedProduct.manufacturerName,
        cnpj: '',
        city: selectedProduct.manufacturerCity || 'Nova Serrana',
        state: 'MG',
        phone: '',
        email: '',
        bio: 'Indústria credenciada de Nova Serrana para fornecimento de caixas e grades fechadas.',
        commissionRateAccepted: 8.5,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        isVerified: true,
        createdAt: new Date().toISOString(),
      } : null)
    : null;

  const currentManufacturerProducts = selectedManufacturerId
    ? products.filter(p => p.manufacturerId === selectedManufacturerId)
    : [];

  const cartTotalBoxes = cartItems.reduce((acc, it) => acc + it.boxQuantity, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        cartCount={cartTotalBoxes}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <LandingView
            products={products}
            onSelectProduct={handleSelectProduct}
            onViewManufacturer={handleViewManufacturer}
            onOpenLogin={() => setIsAuthOpen(true)}
          />
        )}

        {activeView === 'catalog' && (
          <RetailerCatalogView
            products={products}
            onSelectProduct={handleSelectProduct}
            onViewManufacturer={handleViewManufacturer}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeView === 'manufacturer-profile' && currentSelectedManufacturer && (
          <ManufacturerProfileView
            manufacturer={currentSelectedManufacturer}
            allManufacturerProducts={currentManufacturerProducts}
            selectedProduct={selectedProduct}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={handleAddToCart}
            onBack={() => setActiveView('landing')}
          />
        )}

        {activeView === 'manufacturer' && currentUser?.role === 'manufacturer' && (
          <ManufacturerDashboard
            manufacturer={currentUser as Manufacturer}
            onRefresh={() => setProducts(storageService.getProducts())}
          />
        )}

        {activeView === 'retailer' && currentUser?.role === 'retailer' && (
          <RetailerDashboard
            retailer={currentUser as Retailer}
            onBrowseCatalog={() => setActiveView('landing')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanel
            onRefresh={() => {
              setProducts(storageService.getProducts());
            }}
          />
        )}
      </main>

      {/* Auth Modal with unified login & role selection for registration */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Cart & Checkout Drawer */}
      <CartAndCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderCompleted={(order) => {
          setProducts(storageService.getProducts());
        }}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
