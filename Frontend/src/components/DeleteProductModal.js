import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle } from 'lucide-react';

export const DeleteProductModal = ({ product, onConfirm, onCancel }) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onConfirm(motivo.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="delete-product-modal">
      <div className="bg-card border border-red-500/50 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500/10 p-2 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-400" data-testid="delete-modal-title">
              Eliminar Producto
            </h2>
          </div>
        </div>

        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Producto a eliminar:</p>
          <p className="font-semibold">{product.nombre}</p>
          <p className="text-xs font-mono text-muted-foreground">{product.codigo_id}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="motivo" className="text-sm font-medium mb-2 block">
              ¿Por qué deseas eliminar este producto? *
            </Label>
            <Input
              id="motivo"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Producto descontinuado, error de registro..."
              className="h-11"
              data-testid="delete-motivo-input"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Esta acción quedará registrada en el historial
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">
              ⚠️ Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
              disabled={loading}
              data-testid="delete-cancel-btn"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={loading || !motivo.trim()}
              data-testid="delete-confirm-btn"
            >
              {loading ? 'Eliminando...' : 'Eliminar Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};