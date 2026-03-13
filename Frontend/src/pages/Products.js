import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DeleteProductModal } from '../components/DeleteProductModal';
import { toast } from 'sonner';
import { Package2, Search, AlertTriangle, CheckCircle, ArrowLeft, Trash2, Camera, X } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Scanner } from '../components/Scanner'; // Asegúrate de que la ruta sea correcta

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newProductData, setNewProductData] = useState({ 
    name: '', 
    quantity: '', 
    minStock: '', 
    code: '' 
  });

  const handleSaveProduct = async () => {
    if (!newProductData.name) return toast.error("El nombre es obligatorio");
    
    try {
      let publicUrl = null;

      // 1. Subir la foto al bucket 'product-images'
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}_${newProductData.code}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        publicUrl = urlData.publicUrl;
      }

      // 2. Insertar los datos con los nombres correctos de tu base de datos
      const { error: dbError } = await supabase
        .from('products')
        .insert([{
          nombre: newProductData.name,
          codigo_id: newProductData.code,
          stock_actual: parseInt(newProductData.quantity) || 0,
          stock_minimo: parseInt(newProductData.minStock) || 0,
          image_url: publicUrl,
          user_id: user?.id
        }]);

      if (dbError) throw dbError;

      toast.success('¡Registrado en Overstock!');
      
      // 3. Limpiar y cerrar
      setIsAddingProduct(false);
      setSelectedImage(null);
      setNewProductData({ name: '', quantity: '', minStock: '', code: '' });
      fetchProducts(); 

    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error('Error: ' + error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const applyFilters = () => {
    let filtered = [...products];
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.nombre?.toLowerCase() || '').includes(search) || 
        (p.codigo_id?.toLowerCase() || '').includes(search)
      );
    }
    if (filter === 'alerts') filtered = filtered.filter(p => p.stock_actual < p.stock_minimo);
    else if (filter === 'ok') filtered = filtered.filter(p => p.stock_actual >= p.stock_minimo);
    setFilteredProducts(filtered);
  };

  useEffect(() => { applyFilters(); }, [products, searchTerm, filter]);

  const getStockStatus = (product) => {
    if (product.stock_actual < product.stock_minimo) {
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50', icon: AlertTriangle };
    }
    return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/50', icon: CheckCircle };
  };

  const handleDeleteProduct = async (motivo) => {
    try {
      await axios.delete(`${API}/products/${productToDelete.codigo_id}`, { data: { motivo } });
      toast.success('Producto eliminado');
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="bg-[#003366] p-2 rounded-lg"><Package2 className="h-5 w-5 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold">Listado de Productos</h1>
              <p className="text-xs text-muted-foreground">{filteredProducts.length} productos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-12"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'default' : 'secondary'}>Todos</Button>
            <Button onClick={() => setFilter('alerts')} variant={filter === 'alerts' ? 'destructive' : 'secondary'}>Alertas</Button>
            <Button onClick={() => setFilter('ok')} variant={filter === 'ok' ? 'success' : 'secondary'}>Stock OK</Button>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product);
            const StatusIcon = status.icon;
            return (
              <div key={product.codigo_id} className={`bg-card border ${status.border} rounded-lg p-5 shadow-sm`}>
                <div className="flex justify-between mb-3">
                  <div className="truncate">
                    <h3 className="font-semibold text-lg">{product.nombre}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{product.codigo_id}</p>
                  </div>
                  <div className={`${status.bg} p-2 rounded-lg`}><StatusIcon className={`h-5 w-5 ${status.color}`} /></div>
                </div>
                {/* Aquí podrías mostrar la imagen si existe: */}
                {product.image_url && <img src={product.image_url} alt={product.nombre} className="w-full h-32 object-cover rounded-md mb-3" />}
                
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground">Stock: <b className={status.color}>{product.stock_actual}</b></span>
                  <span className="text-muted-foreground text-xs">Mín: {product.stock_minimo}</span>
                </div>
                <Button onClick={() => setProductToDelete(product)} variant="ghost" size="sm" className="w-full text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </Button>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL DE NUEVO PRODUCTO */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Registrar en Overstock</h2>
              <button onClick={() => setIsAddingProduct(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <label className="text-[10px] font-black text-blue-400 uppercase">Código Detectado</label>
                <p className="text-lg font-mono font-bold text-blue-700">{newProductData.code}</p>
              </div>

              <Input placeholder="Nombre del artículo" onChange={(e) => setNewProductData({...newProductData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Cantidad" onChange={(e) => setNewProductData({...newProductData, quantity: e.target.value})} />
                <Input type="number" placeholder="Mínimo" onChange={(e) => setNewProductData({...newProductData, minStock: e.target.value})} />
              </div>

              <div className="mt-2 p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50">
                {!selectedImage ? (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-3">
                    <div className="bg-blue-500 p-3 rounded-full mb-2"><Camera className="w-8 h-8 text-white" /></div>
                    <span className="text-sm font-bold text-blue-600">Tomar Foto</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setSelectedImage(e.target.files[0])} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={URL.createObjectURL(selectedImage)} className="h-48 w-full object-cover rounded-xl" alt="Preview" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveProduct} className="w-full py-6 bg-blue-600 text-white rounded-2xl text-lg font-bold">
                GUARDAR PRODUCTO
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ESCÁNER */}
      {isScanning && (
        <Scanner
          onScan={(codigo) => {
            setNewProductData({ ...newProductData, code: codigo });
            setIsScanning(false);
            setIsAddingProduct(true);
          }}
          onClose={() => setIsScanning(false)}
        />
      )}

      {productToDelete && (
        <DeleteProductModal
          product={productToDelete}
          onConfirm={handleDeleteProduct}
          onCancel={() => setProductToDelete(null)}
        />
      )}
    </div>
  );
};