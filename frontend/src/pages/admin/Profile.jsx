import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { Button, Card, Field, PageHeader, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

export default function Profile() {
  const { admin, setAdmin } = useAuth();
  const p = useForm({ defaultValues: { name: admin?.name ?? '', email: admin?.email ?? '' } });
  const pw = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const saveProfile = async (v) => {
    try { const r = await authApi.updateProfile(v); setAdmin(r.admin); toast.success('Profile updated.'); }
    catch (err) { applyServerErrors(err, p.setError); notifyError(err); }
  };
  const savePassword = async ({ currentPassword, newPassword }) => {
    try { await authApi.changePassword({ currentPassword, newPassword }); toast.success('Password changed. Other devices have been signed out.'); pw.reset(); }
    catch (err) { applyServerErrors(err, pw.setError); notifyError(err); }
  };
  return (
    <>
      <PageHeader title="My profile" description="Your sign-in details." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Details</h2>
          <form onSubmit={p.handleSubmit(saveProfile)} noValidate className="mt-5 space-y-5">
            <Field label="Name" htmlFor="p-name" required error={p.formState.errors.name?.message}><input id="p-name" autoComplete="name" className={inputCls} {...p.register('name', { required: 'Name is required' })} /></Field>
            <Field label="Email" htmlFor="p-email" required error={p.formState.errors.email?.message}><input id="p-email" type="email" autoComplete="email" className={inputCls} {...p.register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} /></Field>
            <Button type="submit" loading={p.formState.isSubmitting} disabled={!p.formState.isDirty}>Save profile</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Change password</h2>
          <form onSubmit={pw.handleSubmit(savePassword)} noValidate className="mt-5 space-y-5">
            <Field label="Current password" htmlFor="pw-cur" error={pw.formState.errors.currentPassword?.message}><input id="pw-cur" type="password" autoComplete="current-password" className={inputCls} {...pw.register('currentPassword', { required: 'Enter your current password' })} /></Field>
            <Field label="New password" htmlFor="pw-new" hint="At least 8 characters, with a letter and a number." error={pw.formState.errors.newPassword?.message}><input id="pw-new" type="password" autoComplete="new-password" className={inputCls} {...pw.register('newPassword', { required: 'Enter a new password', minLength: { value: 8, message: 'Use at least 8 characters' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include a letter and a number' })} /></Field>
            <Field label="Confirm new password" htmlFor="pw-conf" error={pw.formState.errors.confirm?.message}><input id="pw-conf" type="password" autoComplete="new-password" className={inputCls} {...pw.register('confirm', { validate: (v) => v === pw.getValues('newPassword') || 'Passwords do not match' })} /></Field>
            <Button type="submit" loading={pw.formState.isSubmitting}>Change password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
