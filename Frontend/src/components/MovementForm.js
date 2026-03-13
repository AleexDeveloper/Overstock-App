javascript
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const MovementForm = ({ product, onSubmit, onCancel }) => {
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState('Entrada');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cantidad || parseInt(cantidad) <= 0) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        producto_id: product.codigo_id,
        tipo,
        cantidad: parseInt(cantidad)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="movement-form-overlay">
      <div className="bg-card border border-border/50 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-2" data-testid="movement-form-title">Registrar Movimiento</h2>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Producto: {product.nombre}</p>
          <p className="text-sm text-muted-foreground font-mono">Código: {product.codigo_id}</p>
          <p className="text-sm text-muted-foreground mt-1">Stock actual: <span className="font-semibold">{product.stock_actual}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="cantidad" className="text-sm font-medium mb-2 block">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ingresa la cantidad"
              className="text-lg h-12"
              data-testid="movement-cantidad-input"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('Entrada')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  tipo === 'Entrada'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:border-green-500/50'
                }`}
                data-testid="movement-entrada-btn"
              >
                <ArrowDownCircle className="h-5 w-5" />
                <span className="font-semibold">Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setTipo('Salida')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  tipo === 'Salida'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:border-red-500/50'
                }`}
                data-testid="movement-salida-btn"
              >
                <ArrowUpCircle className="h-5 w-5" />
                <span className="font-semibold">Salida</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={loading}
              data-testid="movement-cancel-btn"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !cantidad || parseInt(cantidad) <= 0}
              data-testid="movement-submit-btn"
            >
              {loading ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};