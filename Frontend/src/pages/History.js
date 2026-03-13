import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllMovements();
  }, []);

  const fetchAllMovements = async () => {
    try {
      const response = await axios.get(`${API}/movements`);
      setMovements(response.data);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (tipo) => {
    if (tipo === 'Entrada') return <TrendingUp className="h-5 w-5 text-green-400" />;
    if (tipo === 'Salida') return <TrendingDown className="h-5 w-5 text-red-400" />;
    return <AlertTriangle className="h-5 w-5 text-red-400" />;
  };

  const getMovementColor = (tipo) => {
    if (tipo === 'Entrada') return 'bg-green-500/20';
    if (tipo === 'Salida') return 'bg-red-500/20';
    return 'bg-red-500/20';
  };

  const getMovementTextColor = (tipo) => {
    if (tipo === 'Entrada') return 'text-green-400';
    if (tipo === 'Salida') return 'text-red-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Historial Completo</h1>
                <p className="text-xs text-muted-foreground">{movements.length} movimientos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando historial...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay movimientos registrados</h3>
            <p className="text-muted-foreground">
              Los movimientos de entrada, salida y eliminaciones aparecerán aquí
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="mt-4"
              data-testid="go-dashboard-btn"
            >
              Volver al Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="full-history-list">
            {movements.map((mov, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-all"
                data-testid={`history-item-${idx}`}
              >
                <div className={`p-2 rounded-lg ${getMovementColor(mov.tipo)}`}>
                  {getMovementIcon(mov.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      mov.tipo === 'Entrada' ? 'bg-green-500/20 text-green-300' :
                      mov.tipo === 'Salida' ? 'bg-red-500/20 text-red-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {mov.tipo}
                    </span>
                    <p className="font-semibold text-sm truncate">{mov.producto_nombre}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {mov.producto_id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mov.usuario} • {new Date(mov.fecha).toLocaleString('es-ES')}
                  </p>
                  {mov.motivo && (
                    <p className="text-xs text-red-300 mt-1 italic">
                      Motivo: {mov.motivo}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${getMovementTextColor(mov.tipo)}`}>
                    {mov.tipo === 'Entrada' ? '+' : mov.tipo === 'Salida' ? '-' : ''}{mov.cantidad}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};