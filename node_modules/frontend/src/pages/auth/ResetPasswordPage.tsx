import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/authApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'demo-reset-token';
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

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
      await authApi.resetPassword({ token, newPassword: values.password });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed. Token may be expired.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('auth.resetPassword')}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('auth.resetPasswordDesc')}
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{t('common.success')}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('auth.resetPasswordDesc')}
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-6"
            onClick={() => navigate('/login')}
          >
            {t('auth.signIn')}
          </Button>
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
            label={t('auth.passwordLabel')}
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label={t('auth.confirmPasswordLabel')}
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isSubmitting}>
            {t('auth.resetPassword')}
          </Button>
        </form>
      )}
    </div>
  );
};
export default ResetPasswordPage;
