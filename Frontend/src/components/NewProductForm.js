import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PackagePlus } from 'lucide-react';

export const NewProductForm = ({ codigoId, onSubmit, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [stockInicial, setStockInicial] = useState('');
  const [stockMinimo, setStockMinimo] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !stockInicial || parseInt(stockInicial) < 0) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        codigo_id: codigoId,
        nombre: nombre.trim(),
        stock_inicial: parseInt(stockInicial),
        stock_minimo: parseInt(stockMinimo) || 10
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="new-product-form-overlay">
      <div className="bg-card border border-border/50 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <PackagePlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" data-testid="new-product-form-title">Nuevo Producto</h2>
            <p className="text-sm text-muted-foreground font-mono">{codigoId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="nombre" className="text-sm font-medium mb-2 block">Nombre del producto *</Label>
            <Input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tornillos 3/4"
              className="h-11"
              data-testid="new-product-nombre-input"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="stockInicial" className="text-sm font-medium mb-2 block">Stock inicial *</Label>
            <Input
              id="stockInicial"
              type="number"
              min="0"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value)}
              placeholder="0"
              className="h-11"
              data-testid="new-product-stock-inicial-input"
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Cantidad actual del producto en inventario
            </p>
          </div>

          <div>
            <Label htmlFor="stockMinimo" className="text-sm font-medium mb-2 block">Stock mínimo</Label>
            <Input
              id="stockMinimo"
              type="number"
              min="0"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="h-11"
              data-testid="new-product-stock-minimo-input"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Recibirás alertas cuando el stock baje de este nivel
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={loading}
              data-testid="new-product-cancel-btn"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !nombre.trim() || !stockInicial || parseInt(stockInicial) < 0}
              data-testid="new-product-submit-btn"
            >
              {loading ? 'Creando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};