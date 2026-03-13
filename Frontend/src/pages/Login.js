import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Package2, LogIn, UserPlus } from 'lucide-react';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
        toast.success('¡Cuenta creada exitosamente!');
      } else {
        await login(email, password);
        toast.success('¡Bienvenido de nuevo!');
      }
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al autenticar';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div 
        className="hidden md:flex md:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=80)' }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#003366] p-3 rounded-lg">
              <Package2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">OVERSTOCK</h1>
          </div>
          <p className="text-xl text-white/90 max-w-md">
            Sistema profesional de gestión de inventario para tu negocio
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#003366] p-2 rounded-lg">
              <Package2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">OVERSTOCK</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-muted-foreground">
              {isRegister
                ? 'Completa tus datos para comenzar'
                : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            {isRegister && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-2 block">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required={isRegister}
                  className="h-11"
                  data-testid="register-name-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="h-11"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium mb-2 block">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                'Procesando...'
              ) : isRegister ? (
                <><UserPlus className="mr-2 h-5 w-5" />Crear cuenta</>
              ) : (
                <><LogIn className="mr-2 h-5 w-5" />Iniciar sesión</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="toggle-auth-mode-btn"
            >
              {isRegister
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};