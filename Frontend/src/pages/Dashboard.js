import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Scanner } from '../components/Scanner';
import { MovementForm } from '../components/MovementForm';
import { NewProductForm } from '../components/NewProductForm';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ScanBarcode, AlertTriangle, Bell, Package2, LogOut, TrendingDown, TrendingUp, Clock, List, CheckCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [movements, setMovements] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    fetchNotifications();
    fetchMovements();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.leida).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await axios.get(`${API}/movements/recent`);
      setMovements(response.data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`);
      fetchNotifications();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleScan = async (code) => {
    setShowScanner(false);
    setScannedCode(code);

    try {
      const response = await axios.get(`${API}/products/${code}`);
      setSelectedProduct(response.data);
      setShowMovementForm(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setShowNewProductForm(true);
      } else {
        toast.error('Error al buscar el producto');
      }
    }
  };

  const handleMovementSubmit = async (data) => {
    try {
      await axios.post(`${API}/movements`, data);
      toast.success(`${data.tipo} registrada exitosamente`);
      setShowMovementForm(false);
      setSelectedProduct(null);
      fetchAlerts();
      fetchNotifications();
      fetchMovements();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al registrar movimiento';
      toast.error(errorMsg);
    }
  };

  const handleNewProductSubmit = async (data) => {
    try {
      await axios.post(`${API}/products`, data);
      toast.success('Producto creado exitosamente');
      setShowNewProductForm(false);
      setScannedCode(null);
      fetchAlerts();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al crear producto';
      toast.error(errorMsg);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.patch(`${API}/notifications/${notifId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#003366] p-2.5 rounded-lg">
              <Package2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">OVERSTOCK</h1>
              <p className="text-xs text-muted-foreground">Hola, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/products')}
              variant="ghost"
              size="sm"
              data-testid="products-link-btn"
            >
              <List className="h-4 w-4 mr-2" />
              Productos
            </Button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              data-testid="notifications-toggle-btn"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  data-testid="mark-all-read-btn"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay notificaciones</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`text-sm p-3 rounded-lg border ${
                      notif.leida
                        ? 'bg-secondary/30 border-border/30 text-muted-foreground'
                        : 'bg-primary/5 border-primary/20 text-foreground'
                    }`}
                    onClick={() => !notif.leida && markAsRead(notif.id)}
                    data-testid={`notification-${notif.id}`}
                  >
                    <p>{notif.mensaje}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(notif.fecha).toLocaleString('es-ES')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            onClick={() => setShowScanner(true)}
            size="lg"
            className="w-full h-24 text-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all"
            data-testid="scan-btn"
          >
            <ScanBarcode className="mr-3 h-8 w-8" />
            ESCANEAR CÓDIGO
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold">Alertas de Stock</h2>
            </div>
            <div className="space-y-3" data-testid="alerts-list">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No hay alertas activas</p>
                  <p className="text-sm text-muted-foreground/70">Todos los productos tienen stock suficiente</p>
                </div>
              ) : (
                alerts.map((product) => (
                  <div
                    key={product.codigo_id}
                    className="border-l-4 border-l-red-500 bg-red-500/10 p-4 rounded-r-lg"
                    data-testid={`alert-${product.codigo_id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-red-200">{product.nombre}</p>
                        <p className="text-xs font-mono text-red-300/70">{product.codigo_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-300">Stock: <span className="font-bold">{product.stock_actual}</span></p>
                        <p className="text-xs text-red-300/70">Mínimo: {product.stock_minimo}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Movimientos Recientes</h2>
              </div>
              <Button
                onClick={() => navigate('/history')}
                variant="ghost"
                size="sm"
                data-testid="view-full-history-btn"
              >
                Ver historial completo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Últimos 7 días</p>
            <div className="space-y-3" data-testid="movements-list">
              {movements.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No hay movimientos registrados</p>
                </div>
              ) : (
                movements.map((mov, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/30"
                    data-testid={`movement-${idx}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      mov.tipo === 'Entrada' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {mov.tipo === 'Entrada' ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{mov.producto_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {mov.usuario} • {new Date(mov.fecha).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        mov.tipo === 'Entrada' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {mov.tipo === 'Entrada' ? '+' : '-'}{mov.cantidad}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {showScanner && (
        <Scanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showMovementForm && selectedProduct && (
        <MovementForm
          product={selectedProduct}
          onSubmit={handleMovementSubmit}
          onCancel={() => {
            setShowMovementForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showNewProductForm && scannedCode && (
        <NewProductForm
          codigoId={scannedCode}
          onSubmit={handleNewProductSubmit}
          onCancel={() => {
            setShowNewProductForm(false);
            setScannedCode(null);
          }}
        />
      )}
    </div>
  );
};