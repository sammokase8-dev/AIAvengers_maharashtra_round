import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User as UserIcon, Tv, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  channelName: z.string().min(2, 'Channel / Brand name is required'),
  niche: z.string().min(2, 'Primary content niche is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerAuth } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      channelName: '',
      niche: 'AI & Engineering',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    try {
      await registerAuth(values);
      success('Your CreatorAI studio is ready!', t('common.success'));
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toastError(msg, t('common.error'));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('auth.signUp')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('auth.registerSubtitle')}</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label={t('auth.nameLabel')}
          type="text"
          placeholder="e.g. Alex Rivera"
          leftIcon={<UserIcon className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label={t('auth.emailLabel')}
          type="email"
          placeholder="alex@studio.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={t('auth.channelNameLabel')}
            type="text"
            placeholder="@CreatorStudio"
            leftIcon={<Tv className="w-4 h-4" />}
            error={errors.channelName?.message}
            {...register('channelName')}
          />
          <Input
            label={t('auth.nicheLabel')}
            type="text"
            placeholder="e.g. AI & Tech"
            error={errors.niche?.message}
            {...register('niche')}
          />
        </div>

        <Input
          label={t('auth.passwordLabel')}
          type="password"
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {t('auth.initializeStudio')}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
        {t('auth.alreadyHaveAccount')}{' '}
        <NavLink to="/login" className="text-blue-600 hover:text-blue-700 font-semibold ml-1">
          {t('auth.signIn')}
        </NavLink>
      </div>
    </div>
  );
};
export default RegisterPage;
