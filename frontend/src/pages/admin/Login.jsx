import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Field, inputCls } from '../../components/admin/ui/kit.jsx';

export default function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  if (status === 'authed') return <Navigate to={location.state?.from || '/admin/dashboard'} replace />;

  const onSubmit = async ({ email, password }) => {
    setError('');
    try { await login(email, password); navigate(location.state?.from || '/admin/dashboard', { replace: true }); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="admin-ui grid min-h-screen place-items-center bg-stone-100 px-4">
      <Helmet><title>Sign in | Agama admin</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <main className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-800 text-xl font-bold text-white">A</span>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">Agama admin</h1>
          <p className="mt-1 text-sm text-stone-600">Sign in to manage the website.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <input id="email" type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} className={inputCls} {...register('email', { required: 'Enter your email' })} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" aria-invalid={!!errors.password} className={`${inputCls} pr-11`} {...register('password', { required: 'Enter your password' })} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-stone-500 hover:bg-stone-100">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
          </Field>
          {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button type="submit" loading={isSubmitting} className="w-full">Sign in</Button>
        </form>
      </main>
    </div>
  );
}
