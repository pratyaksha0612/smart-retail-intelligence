import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, ArrowRight, Store, MapPin, Globe, Calendar, Camera, Hash, Sun, Moon } from 'lucide-react';
import { FaceOnboarding } from '../components/biometrics/FaceOnboarding';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../lib/api';
export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceOnboarding, setShowFaceOnboarding] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login logic
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Invalid email or password');
        }

        const data = await response.json();
        
        // Fetch user data
        const userRes = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const userData = await userRes.json();
        
        login(data.access_token, userData);
        navigate(from, { replace: true });

      } else {
        // Register logic
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            role: 'user',
            age: age ? parseInt(age) : null,
            country: country || null,
            pin_code: pinCode || null
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to register');
        }
        
        // After successful registration, log them in automatically
        const loginFormData = new URLSearchParams();
        loginFormData.append('username', email);
        loginFormData.append('password', password);

        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: loginFormData,
        });
        
        const loginData = await loginRes.json();
        
        // Upload profile picture if provided
        if (profilePicture) {
          const formData = new FormData();
          formData.append('file', profilePicture);
          
          await fetch(`${API_URL}/auth/upload-profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loginData.access_token}` },
            body: formData,
          });
        }
        
        const userRes = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });
        const userData = await userRes.json();
        
        login(loginData.access_token, userData);
        setShowFaceOnboarding(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {showFaceOnboarding && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FaceOnboarding 
            onComplete={() => { setShowFaceOnboarding(false); navigate(from, { replace: true }); }} 
            onCancel={() => { setShowFaceOnboarding(false); navigate(from, { replace: true }); }} 
          />
        </div>
      )}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface/80 backdrop-blur border border-border hover:bg-black/5 dark:hover:bg-white/5 transition-transform hover:scale-105 text-secondary hover:text-accent z-20 shadow-sm"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
      
      <div className="w-full max-w-md bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-accent to-purple-500 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Smart Retail</h2>
          <p className="text-secondary mt-1 text-sm">
            {isLogin ? 'Welcome back, please log in.' : 'Create your account to get started.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="relative w-1/3">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="relative w-2/3">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <input
                    type="text"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Pin Code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex flex-col items-center justify-center w-full py-2">
                <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-background/50 overflow-hidden group hover:border-accent transition-colors shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {profilePicture ? (
                    <img src={URL.createObjectURL(profilePicture)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-secondary group-hover:text-accent transition-colors">
                      <Camera className="w-8 h-8 mb-1 opacity-70" />
                      <span className="text-xs font-semibold">Add Photo</span>
                    </div>
                  )}
                  {profilePicture && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-secondary mt-3 text-center max-w-[250px] font-medium leading-relaxed">
                  Upload a clear, front-facing photo to enable secure face recognition login.
                </p>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-accent to-purple-500 hover:from-accent/90 hover:to-purple-500/90 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-accent hover:underline font-medium focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
