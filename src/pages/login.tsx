import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/features/auth';
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
        <div className="hero hero-snippet">
          <div className="hero-orb hero-orb-a" aria-hidden="true" />
          <div className="hero-orb hero-orb-b" aria-hidden="true" />
          <div className="hero-orb hero-orb-c" aria-hidden="true" />

          <div className="hero-content">
            <div className="hero-top fade-r-1">
              <div className="hero-wheel-pulse" aria-hidden="true">
                <img className="hero-wheel" src="/logospin.png" alt="" />
              </div>
              <div className="hero-top-copy">
                <div className="hero-rotary">Rotary</div>
                <div className="hero-district">Digital Hub</div>
              </div>
              <div className="hero-divider" aria-hidden="true" />
              <div className="hero-tagline" aria-label="Service Above Self">
                Service<br />Above<br />Self
              </div>
            </div>

            <div className="hero-head fade-r-2">
              <h1 className="hero-title">
                District 9104
                <br />
                <span className="hero-title-accent">Digital Hub</span>
              </h1>
              <div className="hero-bar gold-bar" aria-hidden="true" />
            </div>

            <p className="hero-desc fade-r-3">
              A private district platform for clubs, events, and projects in Ghana.
            </p>

            <p className="hero-highlight fade-r-4">
              Sign in to browse what’s happening across District 9104.
              <br />
              District and Club representatives can create and manage events and projects.
            </p>

            <div className="hero-badge fade-r-5">Ghana · District 9104</div>
          </div>
        </div>
      </section>
      <section className="login-panel login-panel-form">
        <div className="login-form-shell">
          <div className="login-form-card">
            <div className="login-kicker fade-up-1">Sign In</div>
            <div className="login-form-title fade-up-2">Email, password, and Rotary ID</div>

            <form
              className="form-stack"
              aria-busy={isSubmitting}
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
              <div className="fade-up-3 login-field">
                <label className="login-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  className="input-field"
                  type="email"
                  autoComplete="email"
                  placeholder="name@district9104.org"
                  disabled={isSubmitting}
                  {...register('email')}
                />
                {errors.email?.message ? <p className="field-error">{errors.email.message}</p> : null}
              </div>

              <div className="fade-up-3 login-field">
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  {...register('password')}
                />
                {errors.password?.message ? <p className="field-error">{errors.password.message}</p> : null}
              </div>

              <div className="fade-up-4 login-field">
                <label className="login-label" htmlFor="rotary-id">
                  Rotary ID
                </label>
                <p className="login-hint">Your role and access are assigned after we verify your Rotary ID.</p>
                <input
                  id="rotary-id"
                  className="input-field"
                  inputMode="numeric"
                  placeholder="Enter your Rotary ID"
                  disabled={isSubmitting}
                  {...register('rotaryId')}
                />
                {errors.rotaryId?.message ? <p className="field-error">{errors.rotaryId.message}</p> : null}
              </div>

              {errors.root?.message ? <p className="field-error">{errors.root.message}</p> : null}

              <div className="fade-up-5 login-cta">
                <button type="submit" className="sign-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
                <div className="login-install-note">
                  <p>Install to add an icon on your home screen for quick access.</p>
                  <InstallButton variant="secondary" />
                </div>
              </div>
            </form>
          </div>

          <div className="login-footer fade-up-5">© 2026 Berecons</div>
        </div>
      </section>
    </div>
  );
}
