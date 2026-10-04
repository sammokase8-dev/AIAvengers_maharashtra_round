import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/authApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    try {
      await authApi.forgotPassword(values);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to request password reset. Try again.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('auth.forgotPassword')}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('auth.forgotPasswordDesc')}
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{t('common.success')}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {t('auth.forgotPasswordDesc')}
          </p>
          <NavLink to="/login" className="inline-block mt-6">
            <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              {t('auth.backToLogin')}
            </Button>
          </NavLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label={t('auth.emailLabel')}
            type="email"
            placeholder="name@studio.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isSubmitting}>
            {t('auth.sendRecovery')}
          </Button>

          <div className="text-center mt-4">
            <NavLink
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('auth.backToLogin')}</span>
            </NavLink>
          </div>
        </form>
      )}
    </div>
  );
};
export default ForgotPasswordPage;
