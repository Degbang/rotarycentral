import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import * as Label from '@radix-ui/react-label';
import * as Select from '@radix-ui/react-select';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { ComponentPropsWithoutRef, forwardRef, useMemo, useState } from 'react';
import { RecordStatus } from '@/data/model';
import { formatStatusLabel } from '@/ui/formatters';

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  asChild?: boolean;
}) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      className={cn('button', `button-${variant}`, `button-${size}`, className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('card', className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </Card>
  );
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'gold';
}) {
  return <span className={cn('badge', `badge-${variant}`)}>{children}</span>;
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  const variant =
    status === 'PUBLISHED'
      ? 'success'
      : status === 'SUBMITTED'
        ? 'warning'
        : status === 'CHANGES_REQUESTED'
          ? 'danger'
          : 'neutral';

  return <Badge variant={variant}>{formatStatusLabel(status)}</Badge>;
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="stat-card">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </Card>
  );
}

export const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('input', className)} {...props} />,
);
TextInput.displayName = 'TextInput';

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn('textarea', className)} {...props} />,
);
TextArea.displayName = 'TextArea';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <Label.Root className="field-label" htmlFor={htmlFor}>
        {label}
      </Label.Root>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="select-trigger" aria-label={label}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown size={18} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper">
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item className="select-item" value={option.value} key={option.value}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </Field>
  );
}

export function SearchSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  emptyLabel = 'No matches found.',
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  error?: string;
  emptyLabel?: string;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Field label={label} error={error}>
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery('');
        }}
      >
        <Dialog.Trigger asChild>
          <button type="button" className="select-trigger" aria-label={label} aria-haspopup="dialog">
            <span className={selectedLabel ? undefined : 'muted'}>{selectedLabel || placeholder}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content" aria-label={`${label} picker`}>
            <div className="dialog-head">
              <div className="dialog-title">
                <strong>{label}</strong>
                <span className="muted">Type to search, then tap to select.</span>
              </div>
              <Dialog.Close asChild>
                <button className="icon-button" type="button" aria-label="Close">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="dialog-search">
              <Search size={18} aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                aria-label={`Search ${label.toLowerCase()}`}
              />
              {query ? (
                <button className="icon-button" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="dialog-list" role="listbox" aria-label={`${label} options`}>
              {filtered.length === 0 ? <p className="muted dialog-empty">{emptyLabel}</p> : null}
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="dialog-option"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {option.value === value ? <Check size={18} aria-hidden="true" /> : <span aria-hidden="true" />}
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Field>
  );
}

export function MetaList({ items }: { items: Array<{ label: string; value: string | React.ReactNode }> }) {
  return (
    <dl className="meta-list">
      {items.map((item) => (
        <div className="meta-row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Stepper({
  currentStep,
  steps,
  onStepRequest,
}: {
  currentStep: number;
  steps: Array<{ title: string; description: string }>;
  onStepRequest?: (stepIndex: number) => void;
}) {
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <button
          type="button"
          className={cn('step-item', index === currentStep && 'step-item-active')}
          key={step.title}
          onClick={() => onStepRequest?.(index)}
          aria-current={index === currentStep ? 'step' : undefined}
        >
          <span className="step-number">{index + 1}</span>
          <span className="step-copy">
            <strong>{step.title}</strong>
            <span className="step-desc">{step.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function InlineSearchSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  emptyLabel = 'No matches found.',
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  error?: string;
  emptyLabel?: string;
}) {
  const selected = options.find((option) => option.value === value) ?? null;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 12);
    return options.filter((option) => option.label.toLowerCase().includes(q)).slice(0, 24);
  }, [options, query]);

  return (
    <Field label={label} error={error}>
      <div className="inline-picker">
        <div className="inline-picker-input">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-label={`${label} search`}
          />
          {query ? (
            <button className="icon-button" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          ) : null}
        </div>

        {selected ? (
          <div className="inline-picker-selected" aria-label="Selected option">
            <span className="badge badge-gold">Selected</span>
            <strong>{selected.label}</strong>
          </div>
        ) : (
          <p className="muted inline-picker-hint">Start typing, then tap a club to select it.</p>
        )}

        <div className="inline-picker-list" role="listbox" aria-label={`${label} options`}>
          {filtered.length === 0 ? (
            <div className="dialog-empty muted">{emptyLabel}</div>
          ) : (
            filtered.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className="inline-picker-option"
                  onClick={() => onChange(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check size={16} aria-hidden="true" /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Field>
  );
}

export function UserPill({ name, detail }: { name: string; detail: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="user-pill">
      <Avatar.Root className="avatar-root">
        <Avatar.Fallback className="avatar-fallback">{initials}</Avatar.Fallback>
      </Avatar.Root>
      <div>
        <strong>{name}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export function FilterChip({
  label,
  value,
  active = false,
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  label: string;
  value?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn('filter-chip', active && 'filter-chip-active', className)}
      {...props}
    >
      <span className="filter-chip-label">{label}</span>
      {value ? <span className="filter-chip-value">{value}</span> : null}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}
