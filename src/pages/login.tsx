import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/features/auth';
import { Button, Card, Field, TextInput } from '@/ui/components';
import districtLogo from '@/assets/rd9104-logo.png';
import { InstallButton } from '@/ui/install-button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  rotaryId: z.string().min(5, 'Enter your Rotary ID.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session, login, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rotaryId: '' },
  });

  if (!isBootstrapping && session) {
    return <Navigate replace to={from ?? session.defaultRoute} />;
  }

  return (
    <div className="login-layout">
      <section className="login-panel login-panel-brand" aria-label="District introduction">
        <div className="landing">
          <img className="landing-logo landing-animate-1" src={districtLogo} alt="Rotary District 9104 logo" />
          <div className="landing-copy">
            <h1 className="landing-title landing-animate-2">
              Rotary District <span className="landing-number">9104</span>
            </h1>
            <p className="landing-animate-3">
              A private district platform for clubs, events, and projects in Ghana.
            </p>
            <p className="muted landing-animate-4">
              Sign in to browse what’s happening across the district. Staff can create and manage events and projects.
            </p>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <Card className="login-card">
          <div className="login-card-head">
            <span className="eyebrow">Sign in</span>
            <h2>Email, password, and Rotary ID</h2>
          </div>

          <form
            className="form-stack"
            onSubmit={handleSubmit(async (values) => {
              try {
                const nextSession = await login(values);
                navigate(from ?? nextSession.defaultRoute);
              } catch (error) {
                setError('root', {
                  message: error instanceof Error ? error.message : 'Unable to sign in.',
                });
              }
            })}
          >
            <Field label="Email address" error={errors.email?.message}>
              <TextInput type="email" autoComplete="email" placeholder="name@districtgh.org" {...register('email')} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <TextInput type="password" autoComplete="current-password" placeholder="Enter your password" {...register('password')} />
            </Field>
            <Field label="Rotary ID" hint="Your role and access are assigned after we verify your Rotary ID." error={errors.rotaryId?.message}>
              <TextInput inputMode="numeric" placeholder="Enter your Rotary ID" {...register('rotaryId')} />
            </Field>
            {errors.root?.message ? <p className="field-error">{errors.root.message}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="login-install">
              <InstallButton variant="secondary" />
              <p className="muted">Install to add an icon on your home screen for quick access.</p>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
